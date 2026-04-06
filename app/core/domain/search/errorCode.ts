/**
 * Error codes for the Search domain.
 */
export const SearchErrorCode = {
  // SearchQuery validation errors
  EmptyKeyword: "SEARCH_EMPTY_KEYWORD",
  InvalidOffset: "SEARCH_INVALID_OFFSET",
  InvalidLimit: "SEARCH_INVALID_LIMIT",

  // SearchFilter validation errors
  InvalidDateRange: "SEARCH_INVALID_DATE_RANGE",

  // SearchScope validation errors
  UnavailableSourceType: "SEARCH_UNAVAILABLE_SOURCE_TYPE",

  // Search execution errors
  SearchExecutionFailed: "SEARCH_EXECUTION_FAILED",
  IndexUpdateFailed: "SEARCH_INDEX_UPDATE_FAILED",
} as const;

export type SearchErrorCode =
  (typeof SearchErrorCode)[keyof typeof SearchErrorCode];
