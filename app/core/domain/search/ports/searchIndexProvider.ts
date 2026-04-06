import type {
  IndexEntry,
  SearchQuery,
  SearchResult,
  SourceType,
} from "@/core/domain/search/valueObject";

/**
 * Port interface for the full-text search index provider.
 *
 * Responsible for building, updating, querying, and deleting the search index.
 * Implementations handle snippet generation with `<strong>` keyword highlighting.
 *
 * For FILE source type entries, the implementation is responsible for extracting
 * text content from PDF files. The domain layer does not handle PDF text extraction.
 */
export interface SearchIndexProvider {
  /**
   * Execute a full-text search based on keyword, scope, and filters.
   * Snippets in the result are approximately 3 lines of text with keyword
   * portions highlighted using `<strong>` tags.
   * PDF file contents are included in the index as extracted text.
   * @param query The search query (keyword, scope, filters, pagination)
   * @returns The search result (items, total count, pagination info)
   */
  search(query: SearchQuery): Promise<SearchResult>;

  /**
   * Index or update a record entry.
   * Called from the use case layer when a record is created or updated.
   * @param entry The index entry
   */
  indexRecord(entry: IndexEntry): Promise<void>;

  /**
   * Index a record comment entry.
   * Called from the use case layer when a comment is posted.
   * @param entry The index entry
   */
  indexComment(entry: IndexEntry): Promise<void>;

  /**
   * Index or update a thread entry.
   * Called from the use case layer when a thread is created or updated.
   * @param entry The index entry
   */
  indexThread(entry: IndexEntry): Promise<void>;

  /**
   * Index or update a user profile entry.
   * Called from the use case layer when a profile is created or updated.
   * @param entry The index entry
   */
  indexProfile(entry: IndexEntry): Promise<void>;

  /**
   * Index a message entry.
   * Called from the use case layer when a message is sent.
   * @param entry The index entry
   */
  indexMessage(entry: IndexEntry): Promise<void>;

  /**
   * Index a file attachment entry.
   * For PDF files, the implementation must extract text content and include
   * it in the index. PDF text extraction is the responsibility of the
   * SearchIndexProvider implementation, not the domain layer.
   * @param entry The index entry
   */
  indexFile(entry: IndexEntry): Promise<void>;

  /**
   * Remove an entry from the search index.
   * Called from the use case layer when the source data is deleted.
   * @param sourceType The source type of the entry to remove
   * @param sourceId The source ID of the entry to remove
   */
  removeFromIndex(sourceType: SourceType, sourceId: string): Promise<void>;

  /**
   * Remove all index entries belonging to a specific app.
   * Called from the use case layer when an app is deleted.
   * @param appId The app ID whose entries should be removed
   * @returns The number of removed entries
   */
  removeByAppId(appId: string): Promise<number>;

  /**
   * Remove all index entries belonging to a specific space.
   * Called from the use case layer when a space is deleted.
   * @param spaceId The space ID whose entries should be removed
   * @returns The number of removed entries
   */
  removeBySpaceId(spaceId: string): Promise<number>;
}
