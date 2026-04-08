import { v7 as uuidv7 } from "uuid";
import { BusinessRuleError } from "@/core/domain/error";
import { SystemSettingsErrorCode } from "./errorCode";

// ============================================
// SettingId
// ============================================

type _SettingId = string & { readonly brand: "SettingId" };

export type SettingId = _SettingId;

export const SettingId = {
  create: (id: string): _SettingId => {
    return id as _SettingId;
  },
  generate: (): _SettingId => {
    return uuidv7() as _SettingId;
  },
};

// ============================================
// SettingKey
// ============================================

export type SettingKey =
  // OpenDesk system admin
  | "header_color"
  | "feature_flags"
  | "guest_auth"
  | "mobile_display"
  | "js_css_customization"
  | "update_option"
  | "shared_app_settings"
  // cybozu.com common admin
  | "password_policy"
  | "lockout_policy"
  | "session_policy"
  | "saml_auth"
  | "two_factor_auth"
  | "access_restriction"
  | "external_integration"
  | "system_mail"
  | "locale"
  | "logo"
  | "login_page";

export const SETTING_KEYS: readonly SettingKey[] = [
  "header_color",
  "feature_flags",
  "guest_auth",
  "mobile_display",
  "js_css_customization",
  "update_option",
  "shared_app_settings",
  "password_policy",
  "lockout_policy",
  "session_policy",
  "saml_auth",
  "two_factor_auth",
  "access_restriction",
  "external_integration",
  "system_mail",
  "locale",
  "logo",
  "login_page",
] as const;

// ============================================
// HeaderColor
// ============================================

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export type HeaderColor = Readonly<{
  readonly hex: string;
}>;

export const HeaderColor = {
  create: (hex: string): HeaderColor => {
    if (!HEX_COLOR_PATTERN.test(hex)) {
      throw new BusinessRuleError(
        SystemSettingsErrorCode.InvalidHexColor,
        `Invalid HEX color code: ${hex}`,
      );
    }
    return { hex };
  },
};

// ============================================
// FeatureFlags
// ============================================

export type FeatureFlags = Readonly<{
  readonly emailNotification: Readonly<{
    readonly enabled: boolean;
    readonly defaultReceive: "SELF_ONLY" | "NONE";
    readonly format: "HTML" | "TEXT";
    readonly allowUserFormatChange: boolean;
    readonly notifyRestApi: boolean;
  }>;
  readonly space: Readonly<{
    readonly enabled: boolean;
    readonly allowStandaloneApp: boolean;
  }>;
  readonly guestSpace: Readonly<{
    readonly enabled: boolean;
  }>;
  readonly peopleAndMessage: Readonly<{
    readonly enabled: boolean;
  }>;
  readonly usageDashboard: Readonly<{
    readonly enabled: boolean;
  }>;
}>;

// ============================================
// GuestAuth
// ============================================

export type GuestAuth = Readonly<{
  readonly twoFactorEnabled: boolean;
}>;

// ============================================
// MobileDisplay
// ============================================

export type MobileDisplay = Readonly<{
  readonly displayMode: "MOBILE" | "PC";
  readonly allowUserToggle: boolean;
}>;

// ============================================
// JsCssCustomization
// ============================================

export type CustomizationScope = "ALL_USERS" | "ADMIN_ONLY" | "DISABLED";

export type CustomFile = Readonly<{
  readonly type: "URL" | "UPLOAD";
  readonly url: string;
  readonly fileId: string | null;
}>;

export type JsCssCustomization = Readonly<{
  readonly scope: CustomizationScope;
  readonly pcJsFiles: readonly CustomFile[];
  readonly mobileJsFiles: readonly CustomFile[];
  readonly pcCssFiles: readonly CustomFile[];
  readonly mobileCssFiles: readonly CustomFile[];
}>;

// ============================================
// UpdateOption
// ============================================

export type UpdateChannel = "LATEST" | "MONTHLY";

export type FeatureToggle = Readonly<{
  readonly featureId: string;
  readonly name: string;
  readonly enabled: boolean;
  readonly expiresAt: Date | null;
}>;

export type UpdateOption = Readonly<{
  readonly channel: UpdateChannel;
  readonly disabledFeatures: readonly FeatureToggle[];
  readonly disabledLatestOnlyFeatures: readonly FeatureToggle[];
  readonly earlyAccessFeatures: readonly FeatureToggle[];
  readonly experimentalFeatures: readonly FeatureToggle[];
  readonly apiLabFeatures: readonly FeatureToggle[];
}>;

// ============================================
// SharedAppSettings
// ============================================

export type SharedAppSettings = Readonly<{
  readonly prohibitEveryoneAdmin: boolean;
}>;

// ============================================
// PasswordPolicy
// ============================================

const PASSWORD_MIN_LENGTH_MIN = 3;
const PASSWORD_MIN_LENGTH_MAX = 15;
const HISTORY_COUNT_MIN = 0;
const HISTORY_COUNT_MAX = 15;

export type PasswordComplexity =
  | "NONE"
  | "ALPHANUMERIC"
  | "ALPHANUMERIC_SPECIAL";

export type PasswordPolicy = Readonly<{
  readonly userMinLength: number;
  readonly adminMinLength: number;
  readonly complexity: PasswordComplexity;
  readonly allowSameAsLoginName: boolean;
  readonly expirationDays: number | null;
  readonly historyCount: number;
  readonly allowUserChange: boolean;
  readonly requireChangeOnNextLogin: boolean;
  readonly allowUserReset: boolean;
}>;

export const PasswordPolicy = {
  create: (params: PasswordPolicy): PasswordPolicy => {
    if (
      params.userMinLength < PASSWORD_MIN_LENGTH_MIN ||
      params.userMinLength > PASSWORD_MIN_LENGTH_MAX
    ) {
      throw new BusinessRuleError(
        SystemSettingsErrorCode.PasswordPolicyOutOfRange,
        `userMinLength must be between ${PASSWORD_MIN_LENGTH_MIN} and ${PASSWORD_MIN_LENGTH_MAX}, got ${params.userMinLength}`,
      );
    }
    if (
      params.adminMinLength < PASSWORD_MIN_LENGTH_MIN ||
      params.adminMinLength > PASSWORD_MIN_LENGTH_MAX
    ) {
      throw new BusinessRuleError(
        SystemSettingsErrorCode.PasswordPolicyOutOfRange,
        `adminMinLength must be between ${PASSWORD_MIN_LENGTH_MIN} and ${PASSWORD_MIN_LENGTH_MAX}, got ${params.adminMinLength}`,
      );
    }
    if (
      params.historyCount < HISTORY_COUNT_MIN ||
      params.historyCount > HISTORY_COUNT_MAX
    ) {
      throw new BusinessRuleError(
        SystemSettingsErrorCode.PasswordPolicyOutOfRange,
        `historyCount must be between ${HISTORY_COUNT_MIN} and ${HISTORY_COUNT_MAX}, got ${params.historyCount}`,
      );
    }
    return params;
  },
};

// ============================================
// LockoutPolicy
// ============================================

const MAX_FAILED_ATTEMPTS_MIN = 3;
const MAX_FAILED_ATTEMPTS_MAX = 10;
const VALID_LOCKOUT_DURATIONS: readonly (number | null)[] = [
  null,
  3,
  15,
  30,
  60,
];

export type LockoutPolicy = Readonly<{
  readonly maxFailedAttempts: number | null;
  readonly lockoutDurationMinutes: number | null;
  readonly failedLoginMessage: Readonly<Record<string, string>>;
}>;

export const LockoutPolicy = {
  create: (params: LockoutPolicy): LockoutPolicy => {
    if (
      params.maxFailedAttempts !== null &&
      (params.maxFailedAttempts < MAX_FAILED_ATTEMPTS_MIN ||
        params.maxFailedAttempts > MAX_FAILED_ATTEMPTS_MAX)
    ) {
      throw new BusinessRuleError(
        SystemSettingsErrorCode.InvalidSettingValue,
        `maxFailedAttempts must be null or between ${MAX_FAILED_ATTEMPTS_MIN} and ${MAX_FAILED_ATTEMPTS_MAX}, got ${params.maxFailedAttempts}`,
      );
    }
    if (!VALID_LOCKOUT_DURATIONS.includes(params.lockoutDurationMinutes)) {
      throw new BusinessRuleError(
        SystemSettingsErrorCode.InvalidSettingValue,
        `lockoutDurationMinutes must be null or one of 3, 15, 30, 60, got ${params.lockoutDurationMinutes}`,
      );
    }
    return params;
  },
};

// ============================================
// SessionPolicy
// ============================================

export type AutoLoginExpiration = "1_DAY" | "1_WEEK" | "1_MONTH";

export type SessionPolicy = Readonly<{
  readonly sessionLifetimeMinutes: number;
  readonly allowAutoComplete: boolean;
  readonly allowBrowserSave: boolean;
  readonly allowAutoLogin: boolean;
  readonly autoLoginExpiration: AutoLoginExpiration | null;
  readonly allowMismatchedApiAuth: boolean;
}>;

// ============================================
// SamlAuth
// ============================================

export type SamlAuth = Readonly<{
  readonly enabled: boolean;
}>;

// ============================================
// TwoFactorAuth
// ============================================

export type TwoFactorAuth = Readonly<{
  readonly enabled: boolean;
}>;

// ============================================
// AccessRestriction
// ============================================

const CIDR_PATTERN = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;

export type IpRestrictionEntry = Readonly<{
  readonly cidr: string;
  readonly description: string;
}>;

export const IpRestrictionEntry = {
  create: (cidr: string, description: string): IpRestrictionEntry => {
    if (!CIDR_PATTERN.test(cidr)) {
      throw new BusinessRuleError(
        SystemSettingsErrorCode.InvalidCidr,
        `Invalid CIDR format: ${cidr}`,
      );
    }
    return { cidr, description };
  },
};

export type AccessRestriction = Readonly<{
  readonly ipRestrictionEnabled: boolean;
  readonly allowedIps: readonly IpRestrictionEntry[];
  readonly basicAuthEnabled: boolean;
  readonly basicAuthUsername: string | null;
  readonly basicAuthPasswordHash: string | null;
}>;

// ============================================
// ExternalIntegration
// ============================================

export type ExternalIntegration = Readonly<{
  readonly allowIframe: boolean;
  readonly referrerPolicySameOrigin: boolean;
  readonly allowWebhook: boolean;
}>;

// ============================================
// SystemMail
// ============================================

export type MailServerType = "BUILTIN" | "EXTERNAL";

export type ExternalMailServer = Readonly<{
  readonly host: string;
  readonly port: number;
  readonly username: string;
  readonly passwordEncrypted: string;
  readonly useTls: boolean;
}>;

export type SystemMail = Readonly<{
  readonly fromAddress: string;
  readonly serverType: MailServerType;
  readonly externalServer: ExternalMailServer | null;
}>;

// ============================================
// Locale
// ============================================

export type SupportedLanguage =
  | "ja"
  | "en_US"
  | "zh_CN"
  | "zh_TW"
  | "es"
  | "pt_BR"
  | "th";

export type Locale = Readonly<{
  readonly timezone: string;
  readonly language: SupportedLanguage;
}>;

// ============================================
// Logo
// ============================================

export type Logo = Readonly<{
  readonly imageFileId: string | null;
  readonly linkUrl: string;
}>;

// ============================================
// LoginPage
// ============================================

export type LoginPage = Readonly<{
  readonly title: string;
  readonly backgroundImageFileId: string | null;
}>;

// ============================================
// SettingValue (Union Type)
// ============================================

export type SettingValue =
  | HeaderColor
  | FeatureFlags
  | GuestAuth
  | MobileDisplay
  | JsCssCustomization
  | UpdateOption
  | SharedAppSettings
  | PasswordPolicy
  | LockoutPolicy
  | SessionPolicy
  | SamlAuth
  | TwoFactorAuth
  | AccessRestriction
  | ExternalIntegration
  | SystemMail
  | Locale
  | Logo
  | LoginPage;

// ============================================
// SettingKeyValueMap
// Maps each SettingKey to its corresponding value object type
// ============================================

export type SettingKeyValueMap = {
  readonly header_color: HeaderColor;
  readonly feature_flags: FeatureFlags;
  readonly guest_auth: GuestAuth;
  readonly mobile_display: MobileDisplay;
  readonly js_css_customization: JsCssCustomization;
  readonly update_option: UpdateOption;
  readonly shared_app_settings: SharedAppSettings;
  readonly password_policy: PasswordPolicy;
  readonly lockout_policy: LockoutPolicy;
  readonly session_policy: SessionPolicy;
  readonly saml_auth: SamlAuth;
  readonly two_factor_auth: TwoFactorAuth;
  readonly access_restriction: AccessRestriction;
  readonly external_integration: ExternalIntegration;
  readonly system_mail: SystemMail;
  readonly locale: Locale;
  readonly logo: Logo;
  readonly login_page: LoginPage;
};
