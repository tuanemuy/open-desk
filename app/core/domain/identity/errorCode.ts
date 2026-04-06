/**
 * Error codes for the Identity domain.
 */
export const IdentityErrorCode = {
  // User errors
  AlreadyActive: "IDENTITY_ALREADY_ACTIVE",
  AlreadyInactive: "IDENTITY_ALREADY_INACTIVE",
  EmptyDisplayName: "IDENTITY_EMPTY_DISPLAY_NAME",

  // Organization errors
  EmptyOrganizationName: "IDENTITY_EMPTY_ORGANIZATION_NAME",
  CircularReference: "IDENTITY_CIRCULAR_REFERENCE",
  InvalidOrderIndex: "IDENTITY_INVALID_ORDER_INDEX",

  // Group errors
  EmptyGroupName: "IDENTITY_EMPTY_GROUP_NAME",

  // Value object validation errors
  InvalidEmail: "IDENTITY_INVALID_EMAIL",
  InvalidLoginName: "IDENTITY_INVALID_LOGIN_NAME",
  InvalidTimezone: "IDENTITY_INVALID_TIMEZONE",
  InvalidLanguage: "IDENTITY_INVALID_LANGUAGE",
  EmptyFileKey: "IDENTITY_EMPTY_FILE_KEY",
  InvalidPasswordMinLength: "IDENTITY_INVALID_PASSWORD_MIN_LENGTH",
  InvalidPasswordComplexity: "IDENTITY_INVALID_PASSWORD_COMPLEXITY",
  InvalidPasswordHistoryCount: "IDENTITY_INVALID_PASSWORD_HISTORY_COUNT",
  InvalidPasswordExpirationDays: "IDENTITY_INVALID_PASSWORD_EXPIRATION_DAYS",
  InvalidLockoutMaxAttempts: "IDENTITY_INVALID_LOCKOUT_MAX_ATTEMPTS",
  InvalidLockoutDuration: "IDENTITY_INVALID_LOCKOUT_DURATION",
  InvalidSessionTimeout: "IDENTITY_INVALID_SESSION_TIMEOUT",
  EmptyHashedPassword: "IDENTITY_EMPTY_HASHED_PASSWORD",
  EmptyApiTokenValue: "IDENTITY_EMPTY_API_TOKEN_VALUE",
  EmptyApiTokenScopes: "IDENTITY_EMPTY_API_TOKEN_SCOPES",
  EmptyOAuthAccessToken: "IDENTITY_EMPTY_OAUTH_ACCESS_TOKEN",
  EmptyOAuthRefreshToken: "IDENTITY_EMPTY_OAUTH_REFRESH_TOKEN",
  EmptyOAuthScopes: "IDENTITY_EMPTY_OAUTH_SCOPES",
  InvalidSessionExpiry: "IDENTITY_INVALID_SESSION_EXPIRY",
  EmptyIpAddress: "IDENTITY_EMPTY_IP_ADDRESS",
  EmptyUserAgent: "IDENTITY_EMPTY_USER_AGENT",
  EmptyOrganizationCode: "IDENTITY_EMPTY_ORGANIZATION_CODE",
  EmptyGroupCode: "IDENTITY_EMPTY_GROUP_CODE",
  SelfParentReference: "IDENTITY_SELF_PARENT_REFERENCE",

  // Password validation errors
  PasswordTooShort: "IDENTITY_PASSWORD_TOO_SHORT",
  PasswordComplexityNotMet: "IDENTITY_PASSWORD_COMPLEXITY_NOT_MET",
  PasswordSameAsLoginName: "IDENTITY_PASSWORD_SAME_AS_LOGIN_NAME",
} as const;

export type IdentityErrorCode =
  (typeof IdentityErrorCode)[keyof typeof IdentityErrorCode];
