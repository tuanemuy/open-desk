import type { AppId } from "@/core/domain/app/valueObject";
import { BusinessRuleError } from "@/core/domain/error";
import type { UserId } from "@/core/domain/identity/valueObject";
import type { SpaceId } from "@/core/domain/space/valueObject";
import { SearchErrorCode } from "./errorCode";

// ============================================
// SourceType
// ============================================

const SOURCE_TYPES = [
  "RECORD",
  "COMMENT",
  "THREAD",
  "PEOPLE",
  "MESSAGE",
  "FILE",
] as const;

type _SourceType = (typeof SOURCE_TYPES)[number];

export type SourceType = _SourceType;

export const SourceType = {
  Record: "RECORD" as _SourceType,
  Comment: "COMMENT" as _SourceType,
  Thread: "THREAD" as _SourceType,
  People: "PEOPLE" as _SourceType,
  Message: "MESSAGE" as _SourceType,
  File: "FILE" as _SourceType,
  validValues: SOURCE_TYPES,
};

// ============================================
// SearchScope
// ============================================

type _SearchScope =
  | { readonly type: "GLOBAL" }
  | { readonly type: "APP"; readonly appId: AppId }
  | { readonly type: "SPACE"; readonly spaceId: SpaceId };

export type SearchScope = _SearchScope;

export const SearchScope = {
  global: (): _SearchScope => ({ type: "GLOBAL" }),
  app: (appId: AppId): _SearchScope => ({ type: "APP", appId }),
  space: (spaceId: SpaceId): _SearchScope => ({ type: "SPACE", spaceId }),
};

// ============================================
// Scope-available SourceTypes mapping
// ============================================

const AVAILABLE_SOURCE_TYPES_BY_SCOPE: Record<
  _SearchScope["type"],
  readonly _SourceType[]
> = {
  GLOBAL: ["RECORD", "COMMENT", "THREAD", "PEOPLE", "MESSAGE", "FILE"],
  APP: ["RECORD", "COMMENT", "FILE"],
  SPACE: ["RECORD", "COMMENT", "THREAD", "FILE"],
};

/**
 * Returns the SourceTypes available for a given SearchScope type.
 */
export function getAvailableSourceTypes(
  scopeType: _SearchScope["type"],
): readonly _SourceType[] {
  return AVAILABLE_SOURCE_TYPES_BY_SCOPE[scopeType];
}

// ============================================
// DateRange
// ============================================

type _DateRange = Readonly<{
  from: Date | null;
  to: Date | null;
}>;

export type DateRange = _DateRange;

export const DateRange = {
  create: (from: Date | null, to: Date | null): _DateRange => {
    if (from !== null && to !== null && from > to) {
      throw new BusinessRuleError(
        SearchErrorCode.InvalidDateRange,
        `Invalid date range: from (${from.toISOString()}) must be before or equal to to (${to.toISOString()})`,
      );
    }
    return { from, to };
  },
};

// ============================================
// SearchFilter
// ============================================

type _SearchFilter = Readonly<{
  sourceTypes: readonly _SourceType[];
  dateRange: _DateRange | null;
  creatorId: UserId | null;
}>;

export type SearchFilter = _SearchFilter;

export const SearchFilter = {
  create: (params: {
    sourceTypes: readonly _SourceType[];
    dateRange: _DateRange | null;
    creatorId: UserId | null;
  }): _SearchFilter => ({
    sourceTypes: params.sourceTypes,
    dateRange: params.dateRange,
    creatorId: params.creatorId,
  }),
  empty: (): _SearchFilter => ({
    sourceTypes: [],
    dateRange: null,
    creatorId: null,
  }),
};

// ============================================
// SearchQuery
// ============================================

const SEARCH_LIMIT_MIN = 1;
const SEARCH_LIMIT_MAX = 100;

type _SearchQuery = Readonly<{
  keyword: string;
  scope: _SearchScope;
  filters: _SearchFilter;
  offset: number;
  limit: number;
}>;

export type SearchQuery = _SearchQuery;

export const SearchQuery = {
  create: (params: {
    keyword: string;
    scope: _SearchScope;
    filters: _SearchFilter;
    offset: number;
    limit: number;
  }): _SearchQuery => {
    if (params.keyword.length === 0) {
      throw new BusinessRuleError(
        SearchErrorCode.EmptyKeyword,
        "Search keyword cannot be empty",
      );
    }
    if (params.offset < 0) {
      throw new BusinessRuleError(
        SearchErrorCode.InvalidOffset,
        `Search offset must be non-negative, got ${params.offset}`,
      );
    }
    if (params.limit < SEARCH_LIMIT_MIN || params.limit > SEARCH_LIMIT_MAX) {
      throw new BusinessRuleError(
        SearchErrorCode.InvalidLimit,
        `Search limit must be between ${SEARCH_LIMIT_MIN} and ${SEARCH_LIMIT_MAX}, got ${params.limit}`,
      );
    }

    // Validate that all filter source types are available for the given scope
    const availableTypes = getAvailableSourceTypes(params.scope.type);
    for (const sourceType of params.filters.sourceTypes) {
      if (!availableTypes.includes(sourceType)) {
        throw new BusinessRuleError(
          SearchErrorCode.UnavailableSourceType,
          `Source type "${sourceType}" is not available for scope "${params.scope.type}"`,
        );
      }
    }

    return {
      keyword: params.keyword,
      scope: params.scope,
      filters: params.filters,
      offset: params.offset,
      limit: params.limit,
    };
  },
  limitMin: SEARCH_LIMIT_MIN,
  limitMax: SEARCH_LIMIT_MAX,
};

// ============================================
// SearchResultItem
// ============================================

type _SearchResultItem = Readonly<{
  title: string;
  snippet: string;
  sourceType: _SourceType;
  sourceId: string;
  locationName: string;
  creatorName: string;
  createdAt: Date;
}>;

export type SearchResultItem = _SearchResultItem;

// ============================================
// SearchResult
// ============================================

type _SearchResult = Readonly<{
  items: readonly _SearchResultItem[];
  totalCount: number;
  offset: number;
  limit: number;
}>;

export type SearchResult = _SearchResult;

// ============================================
// IndexEntry
// ============================================

type _IndexEntry = Readonly<{
  sourceType: _SourceType;
  sourceId: string;
  appId: string | null;
  spaceId: string | null;
  title: string;
  body: string;
  creatorId: string;
  creatorName: string;
  locationName: string;
  createdAt: Date;
}>;

export type IndexEntry = _IndexEntry;

export const IndexEntry = {
  create: (params: {
    sourceType: _SourceType;
    sourceId: string;
    appId: string | null;
    spaceId: string | null;
    title: string;
    body: string;
    creatorId: string;
    creatorName: string;
    locationName: string;
    createdAt: Date;
  }): _IndexEntry => ({
    sourceType: params.sourceType,
    sourceId: params.sourceId,
    appId: params.appId,
    spaceId: params.spaceId,
    title: params.title,
    body: params.body,
    creatorId: params.creatorId,
    creatorName: params.creatorName,
    locationName: params.locationName,
    createdAt: params.createdAt,
  }),
};
