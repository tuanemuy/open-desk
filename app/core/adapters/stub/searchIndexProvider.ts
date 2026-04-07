import type { SearchIndexProvider } from "@/core/domain/search/ports/searchIndexProvider";
import type {
  IndexEntry,
  SearchQuery,
  SearchResult,
  SourceType,
} from "@/core/domain/search/valueObject";

export class StubSearchIndexProvider implements SearchIndexProvider {
  search(_query: SearchQuery): Promise<SearchResult> {
    throw new Error("Not implemented");
  }

  indexRecord(_entry: IndexEntry): Promise<void> {
    throw new Error("Not implemented");
  }

  indexComment(_entry: IndexEntry): Promise<void> {
    throw new Error("Not implemented");
  }

  indexThread(_entry: IndexEntry): Promise<void> {
    throw new Error("Not implemented");
  }

  indexProfile(_entry: IndexEntry): Promise<void> {
    throw new Error("Not implemented");
  }

  indexMessage(_entry: IndexEntry): Promise<void> {
    throw new Error("Not implemented");
  }

  indexFile(_entry: IndexEntry): Promise<void> {
    throw new Error("Not implemented");
  }

  removeFromIndex(_sourceType: SourceType, _sourceId: string): Promise<void> {
    throw new Error("Not implemented");
  }

  removeByAppId(_appId: string): Promise<number> {
    throw new Error("Not implemented");
  }

  removeBySpaceId(_spaceId: string): Promise<number> {
    throw new Error("Not implemented");
  }
}
