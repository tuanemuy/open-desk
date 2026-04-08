/**
 * Error codes for the Audit domain.
 */
export const AuditErrorCode = {
  EmptyModule: "AUDIT_EMPTY_MODULE",
  EmptyAction: "AUDIT_EMPTY_ACTION",
  InvalidRetentionPeriod: "AUDIT_INVALID_RETENTION_PERIOD",
  InvalidAuditFilter: "AUDIT_INVALID_FILTER",
  ExportLimitExceeded: "AUDIT_EXPORT_LIMIT_EXCEEDED",
  InvalidAccessDays: "AUDIT_INVALID_ACCESS_DAYS",
  FutureAccessDate: "AUDIT_FUTURE_ACCESS_DATE",
  SuccessWithErrorCode: "AUDIT_SUCCESS_WITH_ERROR_CODE",
  InvalidTimestamps: "AUDIT_INVALID_TIMESTAMPS",
} as const;

export type AuditErrorCode =
  (typeof AuditErrorCode)[keyof typeof AuditErrorCode];
