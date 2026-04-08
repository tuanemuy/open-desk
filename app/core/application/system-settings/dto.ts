import type {
  AutoLoginExpiration,
  CustomFile,
  CustomizationScope,
  ExternalMailServer,
  FeatureFlags,
  FeatureToggle,
  IpRestrictionEntry,
  LockoutPolicy,
  MailServerType,
  PasswordComplexity,
  PasswordPolicy,
  SamlAuth,
  SessionPolicy,
  SupportedLanguage,
  TwoFactorAuth,
  UpdateChannel,
} from "@/core/domain/system-settings/valueObject";

// ============================================
// Header Color
// ============================================

export type HeaderColorOutput = {
  hex: string;
};

// ============================================
// Feature Flags
// ============================================

export type FeatureFlagsOutput = FeatureFlags;

// ============================================
// Access Restriction
// ============================================

export type AccessRestrictionOutput = {
  ipRestrictionEnabled: boolean;
  allowedIps: readonly IpRestrictionEntry[];
  basicAuthEnabled: boolean;
  basicAuthUsername: string | null;
};

// ============================================
// Login Security
// ============================================

export type LoginSecurityOutput = {
  passwordPolicy: PasswordPolicy;
  lockoutPolicy: LockoutPolicy;
  sessionPolicy: SessionPolicy;
  samlAuth: SamlAuth;
  twoFactorAuth: TwoFactorAuth;
};

// ============================================
// Password Policy
// ============================================

export type PasswordPolicyOutput = {
  userMinLength: number;
  adminMinLength: number;
  complexity: PasswordComplexity;
  allowSameAsLoginName: boolean;
  expirationDays: number | null;
  historyCount: number;
  allowUserChange: boolean;
  requireChangeOnNextLogin: boolean;
  allowUserReset: boolean;
};

// ============================================
// Lockout Policy
// ============================================

export type LockoutPolicyOutput = {
  maxFailedAttempts: number | null;
  lockoutDurationMinutes: number | null;
  failedLoginMessage: Readonly<Record<string, string>>;
};

// ============================================
// Session Policy
// ============================================

export type SessionPolicyOutput = {
  sessionLifetimeMinutes: number;
  allowAutoComplete: boolean;
  allowBrowserSave: boolean;
  allowAutoLogin: boolean;
  autoLoginExpiration: AutoLoginExpiration | null;
  allowMismatchedApiAuth: boolean;
};

// ============================================
// SAML Auth
// ============================================

export type SamlAuthOutput = {
  enabled: boolean;
};

// ============================================
// Two Factor Auth
// ============================================

export type TwoFactorAuthOutput = {
  enabled: boolean;
};

// ============================================
// Guest Auth
// ============================================

export type GuestAuthOutput = {
  twoFactorEnabled: boolean;
};

// ============================================
// Mobile Display
// ============================================

export type MobileDisplayOutput = {
  displayMode: "MOBILE" | "PC";
  allowUserToggle: boolean;
};

// ============================================
// JS/CSS Customization
// ============================================

export type JsCssCustomizationOutput = {
  scope: CustomizationScope;
  pcJsFiles: readonly CustomFile[];
  mobileJsFiles: readonly CustomFile[];
  pcCssFiles: readonly CustomFile[];
  mobileCssFiles: readonly CustomFile[];
};

// ============================================
// Update Option
// ============================================

export type UpdateOptionOutput = {
  channel: UpdateChannel;
  disabledFeatures: readonly FeatureToggle[];
  disabledLatestOnlyFeatures: readonly FeatureToggle[];
  earlyAccessFeatures: readonly FeatureToggle[];
  experimentalFeatures: readonly FeatureToggle[];
  apiLabFeatures: readonly FeatureToggle[];
};

// ============================================
// Shared App Settings
// ============================================

export type SharedAppSettingsOutput = {
  prohibitEveryoneAdmin: boolean;
};

// ============================================
// External Integration
// ============================================

export type ExternalIntegrationOutput = {
  allowIframe: boolean;
  referrerPolicySameOrigin: boolean;
  allowWebhook: boolean;
};

// ============================================
// System Mail
// ============================================

export type SystemMailOutput = {
  fromAddress: string;
  serverType: MailServerType;
  externalServer: ExternalMailServer | null;
};

// ============================================
// Locale
// ============================================

export type LocaleOutput = {
  timezone: string;
  language: SupportedLanguage;
};

// ============================================
// Logo
// ============================================

export type LogoOutput = {
  imageFileId: string | null;
  linkUrl: string;
};

// ============================================
// Login Page
// ============================================

export type LoginPageOutput = {
  title: string;
  backgroundImageFileId: string | null;
};
