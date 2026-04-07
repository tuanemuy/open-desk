import type { AppId as AppIdType, BookmarkCategory } from "../valueObject";
import { AppId } from "../valueObject";

/**
 * URL pattern for APP category: /apps/{appId} pattern
 * Matches paths like /apps/abc123, /apps/abc123/records/new, etc.
 */
const APP_URL_PATTERN = /\/apps\/([^/]+)/;

/**
 * URL pattern for SEARCH category: /search pattern
 * Matches paths like /search, /search?keyword=テスト, etc.
 */
const SEARCH_URL_PATTERN = /\/search(?:\?|$)/;

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
   * 1. APP: URL path matches /apps/{appId} -> category = APP, appId = extracted appId
   * 2. SEARCH: URL path matches /search -> category = SEARCH, appId = null
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
