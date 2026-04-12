import type { Index } from "meilisearch";
import { Meilisearch } from "meilisearch";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { SearchIndexProvider } from "@/core/domain/search/ports/searchIndexProvider";
import type {
  IndexEntry,
  SearchQuery,
  SearchResult,
  SearchResultItem,
  SourceType,
} from "@/core/domain/search/valueObject";

const INDEX_UID = "content";

/**
 * Shape of documents stored in the Meilisearch "content" index.
 */
type MeiliDocument = {
  /** Composite primary key: `${sourceType}:${sourceId}` */
  id: string;
  sourceType: string;
  sourceId: string;
  appId: string | null;
  spaceId: string | null;
  title: string;
  body: string;
  creatorId: string;
  creatorName: string;
  locationName: string;
  /** Unix timestamp in seconds for filterable numeric comparison */
  createdAt: number;
  /** ISO string for display purposes */
  createdAtISO: string;
};

/**
 * Configuration for the Meilisearch search index provider.
 */
export type MeilisearchConfig = Readonly<{
  host: string;
  apiKey: string;
}>;

/**
 * Meilisearch implementation of SearchIndexProvider.
 *
 * Uses a single "content" index with filterable attributes for
 * sourceType, appId, spaceId, creatorId, and createdAt.
 * Snippet generation uses Meilisearch's built-in highlight and crop features.
 */
export class MeilisearchSearchIndexProvider implements SearchIndexProvider {
  private readonly client: Meilisearch;
  private readonly indexInstance: Index<MeiliDocument>;
  private readonly initPromise: Promise<void>;

  constructor(config: MeilisearchConfig) {
    this.client = new Meilisearch({
      host: config.host,
      apiKey: config.apiKey,
    });
    this.indexInstance = this.client.index<MeiliDocument>(INDEX_UID);
    this.initPromise = this.ensureIndex();
  }

  /**
   * Ensure the index exists with the correct settings.
   * Called once during construction; subsequent operations await this promise.
   */
  private async ensureIndex(): Promise<void> {
    try {
      await this.client.createIndex(INDEX_UID, { primaryKey: "id" }).waitTask();
    } catch (error: unknown) {
      // Index may already exist; only throw on unexpected errors
      const isAlreadyExists =
        error != null &&
        typeof error === "object" &&
        "cause" in error &&
        error.cause != null &&
        typeof error.cause === "object" &&
        "code" in error.cause &&
        (error.cause as { code: string }).code === "index_already_exists";
      if (!isAlreadyExists) {
        throw new SystemError(
          SystemErrorCode.ExternalApiError,
          "Failed to create Meilisearch index",
          error,
        );
      }
    }

    try {
      await this.indexInstance
        .updateSettings({
          filterableAttributes: [
            "sourceType",
            "appId",
            "spaceId",
            "creatorId",
            "createdAt",
          ],
          searchableAttributes: ["title", "body"],
          sortableAttributes: ["createdAt"],
        })
        .waitTask();
    } catch (error: unknown) {
      throw new SystemError(
        SystemErrorCode.ExternalApiError,
        "Failed to update Meilisearch index settings",
        error,
      );
    }
  }

  private async getIndex(): Promise<Index<MeiliDocument>> {
    await this.initPromise;
    return this.indexInstance;
  }

  /**
   * Build a composite document ID from sourceType and sourceId.
   */
  private static docId(sourceType: string, sourceId: string): string {
    return `${sourceType}__${sourceId}`;
  }

  /**
   * Convert an IndexEntry into a MeiliDocument for storage.
   */
  private static toDocument(entry: IndexEntry): MeiliDocument {
    return {
      id: MeilisearchSearchIndexProvider.docId(
        entry.sourceType,
        entry.sourceId,
      ),
      sourceType: entry.sourceType,
      sourceId: entry.sourceId,
      appId: entry.appId,
      spaceId: entry.spaceId,
      title: entry.title,
      body: entry.body,
      creatorId: entry.creatorId,
      creatorName: entry.creatorName,
      locationName: entry.locationName,
      createdAt: Math.floor(entry.createdAt.getTime() / 1000),
      createdAtISO: entry.createdAt.toISOString(),
    };
  }

  /**
   * Build a Meilisearch filter string array from a SearchQuery.
   */
  private static buildFilter(query: SearchQuery): string[] {
    const filters: string[] = [];

    // Scope filter
    switch (query.scope.type) {
      case "APP":
        filters.push(`appId = "${query.scope.appId}"`);
        break;
      case "SPACE":
        filters.push(`spaceId = "${query.scope.spaceId}"`);
        break;
      case "GLOBAL":
        // No scope filter for global search
        break;
    }

    // Source type filter
    if (query.filters.sourceTypes.length > 0) {
      const typeConditions = query.filters.sourceTypes
        .map((t) => `sourceType = "${t}"`)
        .join(" OR ");
      filters.push(`(${typeConditions})`);
    }

    // Date range filter
    if (query.filters.dateRange !== null) {
      const { from, to } = query.filters.dateRange;
      if (from !== null) {
        filters.push(`createdAt >= ${Math.floor(from.getTime() / 1000)}`);
      }
      if (to !== null) {
        filters.push(`createdAt <= ${Math.floor(to.getTime() / 1000)}`);
      }
    }

    // Creator filter
    if (query.filters.creatorId !== null) {
      filters.push(`creatorId = "${query.filters.creatorId}"`);
    }

    return filters;
  }

  async search(query: SearchQuery): Promise<SearchResult> {
    try {
      const index = await this.getIndex();
      const filter = MeilisearchSearchIndexProvider.buildFilter(query);

      const response = await index.search(query.keyword, {
        filter,
        offset: query.offset,
        limit: query.limit,
        attributesToHighlight: ["title", "body"],
        highlightPreTag: "<strong>",
        highlightPostTag: "</strong>",
        attributesToCrop: ["body"],
        cropLength: 80,
        cropMarker: "...",
        attributesToRetrieve: [
          "sourceType",
          "sourceId",
          "title",
          "locationName",
          "creatorName",
          "createdAtISO",
        ],
      });

      const items: SearchResultItem[] = response.hits.map((hit) => {
        const formatted = hit._formatted;
        const snippet = formatted?.body ?? hit.body ?? "";
        const title = formatted?.title ?? hit.title ?? "";

        return {
          title,
          snippet,
          sourceType: hit.sourceType as SourceType,
          sourceId: hit.sourceId,
          locationName: hit.locationName,
          creatorName: hit.creatorName,
          createdAt: new Date(hit.createdAtISO),
        };
      });

      return {
        items,
        totalCount: response.estimatedTotalHits ?? 0,
        offset: query.offset,
        limit: query.limit,
      };
    } catch (error: unknown) {
      if (error instanceof SystemError) {
        throw error;
      }
      throw new SystemError(
        SystemErrorCode.ExternalApiError,
        "Meilisearch search failed",
        error,
      );
    }
  }

  async indexRecord(entry: IndexEntry): Promise<void> {
    await this.addDocument(entry);
  }

  async indexComment(entry: IndexEntry): Promise<void> {
    await this.addDocument(entry);
  }

  async indexThread(entry: IndexEntry): Promise<void> {
    await this.addDocument(entry);
  }

  async indexProfile(entry: IndexEntry): Promise<void> {
    await this.addDocument(entry);
  }

  async indexMessage(entry: IndexEntry): Promise<void> {
    await this.addDocument(entry);
  }

  async indexFile(entry: IndexEntry): Promise<void> {
    await this.addDocument(entry);
  }

  async removeFromIndex(
    sourceType: SourceType,
    sourceId: string,
  ): Promise<void> {
    try {
      const index = await this.getIndex();
      const docId = MeilisearchSearchIndexProvider.docId(sourceType, sourceId);
      await index.deleteDocument(docId).waitTask();
    } catch (error: unknown) {
      if (error instanceof SystemError) {
        throw error;
      }
      throw new SystemError(
        SystemErrorCode.ExternalApiError,
        `Failed to remove document from Meilisearch index: ${sourceType}:${sourceId}`,
        error,
      );
    }
  }

  async removeByAppId(appId: string): Promise<number> {
    return this.deleteByFilter(`appId = "${appId}"`);
  }

  async removeBySpaceId(spaceId: string): Promise<number> {
    return this.deleteByFilter(`spaceId = "${spaceId}"`);
  }

  /**
   * Add or replace a single document in the index.
   */
  private async addDocument(entry: IndexEntry): Promise<void> {
    try {
      const index = await this.getIndex();
      const doc = MeilisearchSearchIndexProvider.toDocument(entry);
      await index.addDocuments([doc]).waitTask();
    } catch (error: unknown) {
      if (error instanceof SystemError) {
        throw error;
      }
      throw new SystemError(
        SystemErrorCode.ExternalApiError,
        `Failed to index document in Meilisearch: ${entry.sourceType}:${entry.sourceId}`,
        error,
      );
    }
  }

  /**
   * Delete documents matching a filter and return the number of deleted documents.
   */
  private async deleteByFilter(filter: string): Promise<number> {
    try {
      const index = await this.getIndex();
      const task = await index.deleteDocuments({ filter }).waitTask();
      return task.details?.deletedDocuments ?? 0;
    } catch (error: unknown) {
      if (error instanceof SystemError) {
        throw error;
      }
      throw new SystemError(
        SystemErrorCode.ExternalApiError,
        `Failed to delete documents from Meilisearch index with filter: ${filter}`,
        error,
      );
    }
  }
}
