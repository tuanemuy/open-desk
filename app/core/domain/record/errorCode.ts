/**
 * Error codes for the Record domain.
 */
export const RecordErrorCode = {
  // Record errors
  RevisionConflict: "RECORD_REVISION_CONFLICT",
  InvalidFieldUpdate: "RECORD_INVALID_FIELD_UPDATE",
  FieldNotFound: "RECORD_FIELD_NOT_FOUND",
  SubtableRowMissing: "RECORD_SUBTABLE_ROW_MISSING",
  BatchSizeLimitExceeded: "RECORD_BATCH_SIZE_LIMIT_EXCEEDED",

  // Process management errors
  InvalidStatusTransition: "RECORD_INVALID_STATUS_TRANSITION",
  AssigneeRequired: "RECORD_ASSIGNEE_REQUIRED",
  TooManyAssignees: "RECORD_TOO_MANY_ASSIGNEES",
  DuplicateAction: "RECORD_DUPLICATE_ACTION",
  ProcessNotEnabled: "RECORD_PROCESS_NOT_ENABLED",

  // Comment errors
  CommentTextEmpty: "RECORD_COMMENT_TEXT_EMPTY",
  CommentTextTooLong: "RECORD_COMMENT_TEXT_TOO_LONG",
  TooManyMentions: "RECORD_TOO_MANY_MENTIONS",
  CommentNotOwned: "RECORD_COMMENT_NOT_OWNED",

  // History errors
  InvalidHistoryVersion: "RECORD_INVALID_HISTORY_VERSION",

  // CSV import errors
  InvalidJobState: "RECORD_INVALID_JOB_STATE",
  FileSizeLimitExceeded: "RECORD_FILE_SIZE_LIMIT_EXCEEDED",
  UpdateKeyRequired: "RECORD_UPDATE_KEY_REQUIRED",
  NoFieldsSelected: "RECORD_NO_FIELDS_SELECTED",

  // Cursor errors
  CursorExpired: "RECORD_CURSOR_EXPIRED",
  CursorLimitExceeded: "RECORD_CURSOR_LIMIT_EXCEEDED",
  CursorCreationTimeout: "RECORD_CURSOR_CREATION_TIMEOUT",
  InvalidCursorSize: "RECORD_INVALID_CURSOR_SIZE",

  // Query errors
  QuerySyntaxError: "RECORD_QUERY_SYNTAX_ERROR",
  QueryValidationError: "RECORD_QUERY_VALIDATION_ERROR",

  // Value object errors
  EmptyRecordId: "RECORD_EMPTY_RECORD_ID",
  EmptyCommentId: "RECORD_EMPTY_COMMENT_ID",
  EmptyHistoryId: "RECORD_EMPTY_HISTORY_ID",
  EmptyCsvImportJobId: "RECORD_EMPTY_CSV_IMPORT_JOB_ID",
  EmptyCsvExportJobId: "RECORD_EMPTY_CSV_EXPORT_JOB_ID",
  EmptyCursorId: "RECORD_EMPTY_CURSOR_ID",
  EmptyFieldCode: "RECORD_EMPTY_FIELD_CODE",
  InvalidFieldType: "RECORD_INVALID_FIELD_TYPE",
  InvalidImportMode: "RECORD_INVALID_IMPORT_MODE",
  InvalidErrorHandling: "RECORD_INVALID_ERROR_HANDLING",
  InvalidCsvEncoding: "RECORD_INVALID_CSV_ENCODING",
  InvalidCsvDelimiter: "RECORD_INVALID_CSV_DELIMITER",
  InvalidMentionType: "RECORD_INVALID_MENTION_TYPE",
  InvalidSortDirection: "RECORD_INVALID_SORT_DIRECTION",

  // Field validation errors
  FieldValidation: "RECORD_FIELD_VALIDATION",
} as const;

export type RecordErrorCode =
  (typeof RecordErrorCode)[keyof typeof RecordErrorCode];
