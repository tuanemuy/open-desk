import { v7 as uuidv7 } from "uuid";
import { BusinessRuleError } from "@/core/domain/error";
import { IdentityErrorCode } from "./errorCode";

// ============================================
// UserId
// ============================================

type _UserId = string & { readonly brand: "UserId" };

export type UserId = _UserId;

export const UserId = {
  create: (id: string): _UserId => {
    return id as _UserId;
  },
  generate: (): _UserId => {
    return uuidv7() as _UserId;
  },
};

// ============================================
// OrganizationId
// ============================================

type _OrganizationId = string & { readonly brand: "OrganizationId" };

export type OrganizationId = _OrganizationId;

export const OrganizationId = {
  create: (id: string): _OrganizationId => {
    return id as _OrganizationId;
  },
  generate: (): _OrganizationId => {
    return uuidv7() as _OrganizationId;
  },
};

// ============================================
// GroupId
// ============================================

type _GroupId = string & { readonly brand: "GroupId" };

export type GroupId = _GroupId;

export const GroupId = {
  create: (id: string): _GroupId => {
    return id as _GroupId;
  },
  generate: (): _GroupId => {
    return uuidv7() as _GroupId;
  },
};

// ============================================
// SessionId
// ============================================

type _SessionId = string & { readonly brand: "SessionId" };

export type SessionId = _SessionId;

export const SessionId = {
  create: (id: string): _SessionId => {
    return id as _SessionId;
  },
  generate: (): _SessionId => {
    return uuidv7() as _SessionId;
  },
};

// ============================================
// FileKey
// ============================================

type _FileKey = string & { readonly brand: "FileKey" };

export type FileKey = _FileKey;

export const FileKey = {
  create: (key: string): _FileKey => {
    if (key.length === 0) {
      throw new BusinessRuleError(
        IdentityErrorCode.EmptyFileKey,
        "File key cannot be empty",
      );
    }
    return key as _FileKey;
  },
};

// ============================================
// LoginName
// ============================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type _LoginName = string & { readonly brand: "LoginName" };

export type LoginName = _LoginName;

export const LoginName = {
  create: (value: string): _LoginName => {
    if (value.length === 0) {
      throw new BusinessRuleError(
        IdentityErrorCode.InvalidLoginName,
        "Login name cannot be empty",
      );
    }
    if (!EMAIL_REGEX.test(value)) {
      throw new BusinessRuleError(
        IdentityErrorCode.InvalidLoginName,
        "Login name must be a valid email address format",
      );
    }
    return value.toLowerCase() as _LoginName;
  },
  equals: (a: _LoginName, b: _LoginName): boolean => {
    return a.toLowerCase() === b.toLowerCase();
  },
};

// ============================================
// Email
// ============================================

type _Email = string & { readonly brand: "Email" };

export type Email = _Email;

export const Email = {
  create: (value: string): _Email => {
    if (value.length === 0) {
      throw new BusinessRuleError(
        IdentityErrorCode.InvalidEmail,
        "Email cannot be empty",
      );
    }
    if (!EMAIL_REGEX.test(value)) {
      throw new BusinessRuleError(
        IdentityErrorCode.InvalidEmail,
        "Email must be a valid email address format",
      );
    }
    return value.toLowerCase() as _Email;
  },
  equals: (a: _Email, b: _Email): boolean => {
    return a.toLowerCase() === b.toLowerCase();
  },
};

// ============================================
// DisplayName
// ============================================

type _DisplayName = string & { readonly brand: "DisplayName" };

export type DisplayName = _DisplayName;

export const DisplayName = {
  create: (value: string): _DisplayName => {
    if (value.length === 0) {
      throw new BusinessRuleError(
        IdentityErrorCode.EmptyDisplayName,
        "Display name cannot be empty",
      );
    }
    return value as _DisplayName;
  },
};

// ============================================
// Timezone
// ============================================

const VALID_TIMEZONES = [
  "Pacific/Midway",
  "Pacific/Honolulu",
  "America/Anchorage",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Caracas",
  "America/Halifax",
  "America/St_Johns",
  "America/Argentina/Buenos_Aires",
  "America/Sao_Paulo",
  "Atlantic/South_Georgia",
  "Atlantic/Azores",
  "Atlantic/Cape_Verde",
  "UTC",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Amsterdam",
  "Europe/Brussels",
  "Europe/Vienna",
  "Europe/Zurich",
  "Europe/Warsaw",
  "Europe/Prague",
  "Europe/Budapest",
  "Europe/Stockholm",
  "Europe/Oslo",
  "Europe/Helsinki",
  "Europe/Athens",
  "Europe/Bucharest",
  "Europe/Istanbul",
  "Europe/Moscow",
  "Europe/Kiev",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Africa/Lagos",
  "Africa/Nairobi",
  "Asia/Dubai",
  "Asia/Baku",
  "Asia/Kabul",
  "Asia/Karachi",
  "Asia/Tashkent",
  "Asia/Kolkata",
  "Asia/Colombo",
  "Asia/Kathmandu",
  "Asia/Almaty",
  "Asia/Dhaka",
  "Asia/Rangoon",
  "Asia/Bangkok",
  "Asia/Jakarta",
  "Asia/Ho_Chi_Minh",
  "Asia/Singapore",
  "Asia/Kuala_Lumpur",
  "Asia/Shanghai",
  "Asia/Taipei",
  "Asia/Hong_Kong",
  "Asia/Manila",
  "Asia/Seoul",
  "Asia/Tokyo",
  "Australia/Darwin",
  "Australia/Adelaide",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Hobart",
  "Pacific/Guam",
  "Pacific/Port_Moresby",
  "Pacific/Noumea",
  "Pacific/Auckland",
  "Pacific/Fiji",
  "Pacific/Tongatapu",
  "Pacific/Apia",
] as const;

type _Timezone = (typeof VALID_TIMEZONES)[number] & {
  readonly brand: "Timezone";
};

export type Timezone = _Timezone;

export const Timezone = {
  create: (value: string): _Timezone => {
    if (!VALID_TIMEZONES.includes(value as (typeof VALID_TIMEZONES)[number])) {
      throw new BusinessRuleError(
        IdentityErrorCode.InvalidTimezone,
        `Invalid timezone: ${value}`,
      );
    }
    return value as _Timezone;
  },
  default: (): _Timezone => {
    return "Asia/Tokyo" as _Timezone;
  },
  validValues: VALID_TIMEZONES,
};

// ============================================
// Language
// ============================================

const VALID_LANGUAGES = [
  "ja",
  "en",
  "zh-CN",
  "zh-TW",
  "es",
  "pt-BR",
  "th",
] as const;

type LanguageValue = (typeof VALID_LANGUAGES)[number];

type _Language = LanguageValue & { readonly brand: "Language" };

export type Language = _Language;

export const Language = {
  create: (value: string): _Language => {
    if (!VALID_LANGUAGES.includes(value as LanguageValue)) {
      throw new BusinessRuleError(
        IdentityErrorCode.InvalidLanguage,
        `Invalid language: ${value}`,
      );
    }
    return value as _Language;
  },
  default: (): _Language => {
    return "ja" as _Language;
  },
  validValues: VALID_LANGUAGES,
};

// ============================================
// TimeFormat
// ============================================

const VALID_TIME_FORMATS = ["12h", "24h"] as const;

type TimeFormatValue = (typeof VALID_TIME_FORMATS)[number];

type _TimeFormat = TimeFormatValue & { readonly brand: "TimeFormat" };

export type TimeFormat = _TimeFormat;

export const TimeFormat = {
  create: (value: string): _TimeFormat => {
    if (!VALID_TIME_FORMATS.includes(value as TimeFormatValue)) {
      throw new BusinessRuleError(
        IdentityErrorCode.InvalidTimeFormat,
        `Invalid time format: ${value}`,
      );
    }
    return value as _TimeFormat;
  },
  default: (): _TimeFormat => {
    return "24h" as _TimeFormat;
  },
  validValues: VALID_TIME_FORMATS,
};

// ============================================
// Password (plain-text, validated against a PasswordPolicy)
// ============================================

type _Password = string & { readonly brand: "Password" };

export type Password = _Password;

export const Password = {
  /**
   * Create a validated Password value object.
   * Validates against the provided PasswordPolicy and optional loginName.
   * This is a transient value object -- it is never persisted.
   */
  create: (
    value: string,
    policy: _PasswordPolicy,
    loginName?: string,
  ): _Password => {
    if (value.length < policy.minLength) {
      throw new BusinessRuleError(
        IdentityErrorCode.PasswordTooShort,
        `Password must be at least ${policy.minLength} characters`,
      );
    }

    if (policy.complexity === "alphanumeric") {
      const hasLetter = /[a-zA-Z]/.test(value);
      const hasDigit = /\d/.test(value);
      if (!hasLetter || !hasDigit) {
        throw new BusinessRuleError(
          IdentityErrorCode.PasswordComplexityNotMet,
          "Password must contain both letters and digits",
        );
      }
    }

    if (policy.complexity === "alphanumeric_symbol") {
      const hasLetter = /[a-zA-Z]/.test(value);
      const hasDigit = /\d/.test(value);
      const hasSymbol = /[^a-zA-Z0-9]/.test(value);
      if (!hasLetter || !hasDigit || !hasSymbol) {
        throw new BusinessRuleError(
          IdentityErrorCode.PasswordComplexityNotMet,
          "Password must contain letters, digits, and symbols",
        );
      }
    }

    if (
      !policy.allowSameAsLoginName &&
      loginName !== undefined &&
      value === loginName
    ) {
      throw new BusinessRuleError(
        IdentityErrorCode.PasswordSameAsLoginName,
        "Password must not be the same as the login name",
      );
    }

    return value as _Password;
  },
};

// ============================================
// HashedPassword
// ============================================

type _HashedPassword = Readonly<{
  value: string;
  algorithm: string;
}>;

export type HashedPassword = _HashedPassword;

export const HashedPassword = {
  create: (value: string, algorithm: string): _HashedPassword => {
    if (value.length === 0) {
      throw new BusinessRuleError(
        IdentityErrorCode.EmptyHashedPassword,
        "Hashed password value cannot be empty",
      );
    }
    return { value, algorithm };
  },
};

// ============================================
// ApiScope
// ============================================

export type ApiScope =
  | "k:app_record:read"
  | "k:app_record:write"
  | "k:app_settings:read"
  | "k:app_settings:write"
  | "k:file:read"
  | "k:file:write";

// ============================================
// ApiToken
// ============================================

type _ApiToken = Readonly<{
  value: string;
  scopes: readonly ApiScope[];
}>;

export type ApiToken = _ApiToken;

export const ApiToken = {
  create: (value: string, scopes: readonly ApiScope[]): _ApiToken => {
    if (value.length === 0) {
      throw new BusinessRuleError(
        IdentityErrorCode.EmptyApiTokenValue,
        "API token value cannot be empty",
      );
    }
    if (scopes.length === 0) {
      throw new BusinessRuleError(
        IdentityErrorCode.EmptyApiTokenScopes,
        "API token must have at least one scope",
      );
    }
    return { value, scopes };
  },
};

// ============================================
// OAuthToken
// ============================================

type _OAuthToken = Readonly<{
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scopes: readonly ApiScope[];
}>;

export type OAuthToken = _OAuthToken;

export const OAuthToken = {
  create: (params: {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    scopes: readonly ApiScope[];
  }): _OAuthToken => {
    if (params.accessToken.length === 0) {
      throw new BusinessRuleError(
        IdentityErrorCode.EmptyOAuthAccessToken,
        "OAuth access token cannot be empty",
      );
    }
    if (params.refreshToken.length === 0) {
      throw new BusinessRuleError(
        IdentityErrorCode.EmptyOAuthRefreshToken,
        "OAuth refresh token cannot be empty",
      );
    }
    if (params.scopes.length === 0) {
      throw new BusinessRuleError(
        IdentityErrorCode.EmptyOAuthScopes,
        "OAuth token must have at least one scope",
      );
    }
    return {
      accessToken: params.accessToken,
      refreshToken: params.refreshToken,
      expiresAt: params.expiresAt,
      scopes: params.scopes,
    };
  },
};

// ============================================
// PasswordPolicy
// ============================================

const PASSWORD_MIN_LENGTH_MIN = 3;
const PASSWORD_MIN_LENGTH_MAX = 15;
const PASSWORD_HISTORY_COUNT_MIN = 0;
const PASSWORD_HISTORY_COUNT_MAX = 15;

export type PasswordComplexity =
  | "none"
  | "alphanumeric"
  | "alphanumeric_symbol";

type _PasswordPolicy = Readonly<{
  minLength: number;
  complexity: PasswordComplexity;
  allowSameAsLoginName: boolean;
  expirationDays: number | null;
  historyCount: number;
  allowUserChange: boolean;
  allowUserReset: boolean;
}>;

export type PasswordPolicy = _PasswordPolicy;

export const PasswordPolicy = {
  create: (params: {
    minLength: number;
    complexity: PasswordComplexity;
    allowSameAsLoginName: boolean;
    expirationDays: number | null;
    historyCount: number;
    allowUserChange: boolean;
    allowUserReset: boolean;
  }): _PasswordPolicy => {
    if (
      params.minLength < PASSWORD_MIN_LENGTH_MIN ||
      params.minLength > PASSWORD_MIN_LENGTH_MAX ||
      !Number.isInteger(params.minLength)
    ) {
      throw new BusinessRuleError(
        IdentityErrorCode.InvalidPasswordMinLength,
        `Password minimum length must be an integer between ${PASSWORD_MIN_LENGTH_MIN} and ${PASSWORD_MIN_LENGTH_MAX}`,
      );
    }
    if (
      params.historyCount < PASSWORD_HISTORY_COUNT_MIN ||
      params.historyCount > PASSWORD_HISTORY_COUNT_MAX ||
      !Number.isInteger(params.historyCount)
    ) {
      throw new BusinessRuleError(
        IdentityErrorCode.InvalidPasswordHistoryCount,
        `Password history count must be an integer between ${PASSWORD_HISTORY_COUNT_MIN} and ${PASSWORD_HISTORY_COUNT_MAX}`,
      );
    }
    if (
      params.expirationDays !== null &&
      (params.expirationDays <= 0 || !Number.isInteger(params.expirationDays))
    ) {
      throw new BusinessRuleError(
        IdentityErrorCode.InvalidPasswordExpirationDays,
        "Password expiration days must be a positive integer",
      );
    }
    return {
      minLength: params.minLength,
      complexity: params.complexity,
      allowSameAsLoginName: params.allowSameAsLoginName,
      expirationDays: params.expirationDays,
      historyCount: params.historyCount,
      allowUserChange: params.allowUserChange,
      allowUserReset: params.allowUserReset,
    };
  },
  default: (): _PasswordPolicy => ({
    minLength: 8,
    complexity: "none",
    allowSameAsLoginName: false,
    expirationDays: null,
    historyCount: 0,
    allowUserChange: true,
    allowUserReset: true,
  }),
};

// ============================================
// TitleId
// ============================================

type _TitleId = string & { readonly brand: "TitleId" };

export type TitleId = _TitleId;

export const TitleId = {
  create: (id: string): _TitleId => {
    return id as _TitleId;
  },
  generate: (): _TitleId => {
    return uuidv7() as _TitleId;
  },
};

// ============================================
// ExternalId
// ============================================

type _ExternalId = string & { readonly brand: "ExternalId" };

export type ExternalId = _ExternalId;

export const ExternalId = {
  create: (value: string): _ExternalId => {
    if (value.length === 0) {
      throw new BusinessRuleError(
        IdentityErrorCode.EmptyExternalId,
        "External ID cannot be empty",
      );
    }
    return value as _ExternalId;
  },
};

// ============================================
// ScimResourceType
// ============================================

const VALID_SCIM_RESOURCE_TYPES = ["User", "Group"] as const;

type ScimResourceTypeValue = (typeof VALID_SCIM_RESOURCE_TYPES)[number];

type _ScimResourceType = ScimResourceTypeValue & {
  readonly brand: "ScimResourceType";
};

export type ScimResourceType = _ScimResourceType;

export const ScimResourceType = {
  create: (value: string): _ScimResourceType => {
    if (!VALID_SCIM_RESOURCE_TYPES.includes(value as ScimResourceTypeValue)) {
      throw new BusinessRuleError(
        IdentityErrorCode.InvalidScimResourceType,
        `Invalid SCIM resource type: ${value}`,
      );
    }
    return value as _ScimResourceType;
  },
  validValues: VALID_SCIM_RESOURCE_TYPES,
};

// ============================================
// ApiTokenRecordId
// ============================================

type _ApiTokenRecordId = string & { readonly brand: "ApiTokenRecordId" };

export type ApiTokenRecordId = _ApiTokenRecordId;

export const ApiTokenRecordId = {
  create: (id: string): _ApiTokenRecordId => {
    return id as _ApiTokenRecordId;
  },
  generate: (): _ApiTokenRecordId => {
    return uuidv7() as _ApiTokenRecordId;
  },
};

// ============================================
// HashedBearerToken
// ============================================

type _HashedBearerToken = Readonly<{
  value: string;
  algorithm: string;
}>;

export type HashedBearerToken = _HashedBearerToken;

export const HashedBearerToken = {
  create: (value: string, algorithm: string): _HashedBearerToken => {
    if (value.length === 0) {
      throw new BusinessRuleError(
        IdentityErrorCode.EmptyHashedBearerToken,
        "Hashed bearer token value cannot be empty",
      );
    }
    return { value, algorithm };
  },
};

// ============================================
// BearerToken
// ============================================

const BEARER_TOKEN_MIN_LENGTH = 32;

type _BearerToken = string & { readonly brand: "BearerToken" };

export type BearerToken = _BearerToken;

export const BearerToken = {
  create: (value: string): _BearerToken => {
    if (value.length === 0) {
      throw new BusinessRuleError(
        IdentityErrorCode.EmptyBearerToken,
        "Bearer token cannot be empty",
      );
    }
    if (value.length < BEARER_TOKEN_MIN_LENGTH) {
      throw new BusinessRuleError(
        IdentityErrorCode.BearerTokenTooShort,
        `Bearer token must be at least ${BEARER_TOKEN_MIN_LENGTH} characters`,
      );
    }
    return value as _BearerToken;
  },
  minLength: BEARER_TOKEN_MIN_LENGTH,
};

// ============================================
// LockoutPolicy
// ============================================

const LOCKOUT_MAX_ATTEMPTS_MIN = 3;
const LOCKOUT_MAX_ATTEMPTS_MAX = 10;

type _LockoutPolicy = Readonly<{
  maxFailedAttempts: number | null;
  lockoutDuration: number | null;
}>;

export type LockoutPolicy = _LockoutPolicy;

export const LockoutPolicy = {
  /** Date used to represent permanent lockout (no auto-unlock). */
  PERMANENT_LOCK_DATE: new Date("9999-12-31"),
  create: (params: {
    maxFailedAttempts: number | null;
    lockoutDuration: number | null;
  }): _LockoutPolicy => {
    if (
      params.maxFailedAttempts !== null &&
      (params.maxFailedAttempts < LOCKOUT_MAX_ATTEMPTS_MIN ||
        params.maxFailedAttempts > LOCKOUT_MAX_ATTEMPTS_MAX ||
        !Number.isInteger(params.maxFailedAttempts))
    ) {
      throw new BusinessRuleError(
        IdentityErrorCode.InvalidLockoutMaxAttempts,
        `Lockout max failed attempts must be an integer between ${LOCKOUT_MAX_ATTEMPTS_MIN} and ${LOCKOUT_MAX_ATTEMPTS_MAX}`,
      );
    }
    if (
      params.lockoutDuration !== null &&
      (params.lockoutDuration <= 0 || !Number.isInteger(params.lockoutDuration))
    ) {
      throw new BusinessRuleError(
        IdentityErrorCode.InvalidLockoutDuration,
        "Lockout duration must be a positive integer",
      );
    }
    if (params.maxFailedAttempts === null && params.lockoutDuration !== null) {
      throw new BusinessRuleError(
        IdentityErrorCode.InconsistentLockoutPolicy,
        "Lockout duration must not be set when lockout is disabled (maxFailedAttempts is null)",
      );
    }
    return {
      maxFailedAttempts: params.maxFailedAttempts,
      lockoutDuration: params.lockoutDuration,
    };
  },
  default: (): _LockoutPolicy => ({
    maxFailedAttempts: null,
    lockoutDuration: null,
  }),
};

// ============================================
// SessionPolicy
// ============================================

const SESSION_TIMEOUT_MIN = 15;
const SESSION_TIMEOUT_MAX = 1440;

type _SessionPolicy = Readonly<{
  timeoutMinutes: number;
}>;

export type SessionPolicy = _SessionPolicy;

export const SessionPolicy = {
  create: (timeoutMinutes: number): _SessionPolicy => {
    if (
      timeoutMinutes < SESSION_TIMEOUT_MIN ||
      timeoutMinutes > SESSION_TIMEOUT_MAX ||
      !Number.isInteger(timeoutMinutes)
    ) {
      throw new BusinessRuleError(
        IdentityErrorCode.InvalidSessionTimeout,
        `Session timeout must be an integer between ${SESSION_TIMEOUT_MIN} and ${SESSION_TIMEOUT_MAX} minutes`,
      );
    }
    return { timeoutMinutes };
  },
  default: (): _SessionPolicy => ({
    timeoutMinutes: SESSION_TIMEOUT_MAX,
  }),
};
