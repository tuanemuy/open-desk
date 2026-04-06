/**
 * Error codes for the Bookmark domain.
 */
export const BookmarkErrorCode = {
  EmptyBookmarkName: "BOOKMARK_EMPTY_NAME",
  EmptyBookmarkUrl: "BOOKMARK_EMPTY_URL",
} as const;

export type BookmarkErrorCode =
  (typeof BookmarkErrorCode)[keyof typeof BookmarkErrorCode];
