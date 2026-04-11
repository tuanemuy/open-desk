import type { SearchIndexProvider } from "@/core/domain/search/ports/searchIndexProvider";
import type {
  IndexEntry,
  SearchQuery,
  SearchResult,
  SourceType,
} from "@/core/domain/search/valueObject";
import { StubNotImplementedError } from "./error";

export class StubSearchIndexProvider implements SearchIndexProvider {
  search(_query: SearchQuery): Promise<SearchResult> {
    throw new StubNotImplementedError("SearchIndexProvider");
  }

  indexRecord(_entry: IndexEntry): Promise<void> {
    throw new StubNotImplementedError("SearchIndexProvider");
  }

  indexComment(_entry: IndexEntry): Promise<void> {
    throw new StubNotImplementedError("SearchIndexProvider");
  }

  indexThread(_entry: IndexEntry): Promise<void> {
    throw new StubNotImplementedError("SearchIndexProvider");
  }

  indexProfile(_entry: IndexEntry): Promise<void> {
    throw new StubNotImplementedError("SearchIndexProvider");
  }

  indexMessage(_entry: IndexEntry): Promise<void> {
    throw new StubNotImplementedError("SearchIndexProvider");
  }

  indexFile(_entry: IndexEntry): Promise<void> {
    throw new StubNotImplementedError("SearchIndexProvider");
  }

  removeFromIndex(_sourceType: SourceType, _sourceId: string): Promise<void> {
    throw new StubNotImplementedError("SearchIndexProvider");
  }

  removeByAppId(_appId: string): Promise<number> {
    throw new StubNotImplementedError("SearchIndexProvider");
  }

  removeBySpaceId(_spaceId: string): Promise<number> {
    throw new StubNotImplementedError("SearchIndexProvider");
  }
}
