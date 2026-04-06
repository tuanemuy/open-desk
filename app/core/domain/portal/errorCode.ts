/**
 * Error codes for the Portal domain.
 */
export const PortalErrorCode = {
  // Announcement errors
  EmptyTitle: "PORTAL_EMPTY_TITLE",

  // Value object errors
  EmptyFileKey: "PORTAL_EMPTY_FILE_KEY",
} as const;

export type PortalErrorCode =
  (typeof PortalErrorCode)[keyof typeof PortalErrorCode];
