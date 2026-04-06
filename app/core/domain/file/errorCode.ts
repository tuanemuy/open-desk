/**
 * Error codes for the File domain.
 */
export const FileErrorCode = {
  // StoredFile entity errors
  AlreadyAttached: "FILE_ALREADY_ATTACHED",
  EmptyFileName: "FILE_EMPTY_FILE_NAME",
  EmptyContentType: "FILE_EMPTY_CONTENT_TYPE",
  InvalidFileSize: "FILE_INVALID_FILE_SIZE",
  InvalidExpiration: "FILE_INVALID_EXPIRATION",
  MissingExpirationForTemporary: "FILE_MISSING_EXPIRATION_FOR_TEMPORARY",
  UnexpectedExpirationForAttached: "FILE_UNEXPECTED_EXPIRATION_FOR_ATTACHED",

  // FileKey errors
  EmptyKey: "FILE_EMPTY_FILE_KEY",

  // FileStatus errors
  InvalidFileStatus: "FILE_INVALID_FILE_STATUS",
} as const;

export type FileErrorCode = (typeof FileErrorCode)[keyof typeof FileErrorCode];
