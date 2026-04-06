import type { AppId as AppIdType, BookmarkCategory } from "../valueObject";
import { AppId } from "../valueObject";

/**
 * URL pattern for APP category: /k/{numeric_id}/ pattern
 * Matches paths like /k/4/, /k/4/show#record=1, etc.
 */
const APP_URL_PATTERN = /\/k\/(\d+)\//;

/**
 * URL pattern for SEARCH category: /k/search pattern
 * Matches paths like /k/search?keyword=テスト, etc.
 */
const SEARCH_URL_PATTERN = /\/k\/search(?:\?|$)/;

/**
 * Categorization result containing the determined category and optional appId.
 */
export type CategorizationResult = {
  readonly category: BookmarkCategory;
  readonly appId: AppIdType | null;
};

/**
 * Domain service that determines bookmark category based on URL patterns.
 * Used during bookmark creation and URL update.
 */
export const BookmarkCategorizationService = {
  /**
   * Categorize a URL into a BookmarkCategory.
   *
   * Rules:
   * 1. APP: URL path matches /k/{numeric_id}/ -> category = APP, appId = matched numeric id
   * 2. SEARCH: URL path matches /k/search -> category = SEARCH, appId = null
   * 3. OTHER: anything else -> category = OTHER, appId = null
   */
  categorize: (url: string): CategorizationResult => {
    const appMatch = APP_URL_PATTERN.exec(url);
    if (appMatch?.[1]) {
      return {
        category: "APP",
        appId: AppId.create(appMatch[1]),
      };
    }

    if (SEARCH_URL_PATTERN.test(url)) {
      return {
        category: "SEARCH",
        appId: null,
      };
    }

    return {
      category: "OTHER",
      appId: null,
    };
  },
};
