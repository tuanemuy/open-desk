/**
 * Error codes for the SystemSettings domain.
 */
export const SystemSettingsErrorCode = {
  SettingNotFound: "SYSTEM_SETTINGS_SETTING_NOT_FOUND",
  InvalidSettingValue: "SYSTEM_SETTINGS_INVALID_SETTING_VALUE",
  InvalidHexColor: "SYSTEM_SETTINGS_INVALID_HEX_COLOR",
  PasswordPolicyOutOfRange: "SYSTEM_SETTINGS_PASSWORD_POLICY_OUT_OF_RANGE",
  InvalidCidr: "SYSTEM_SETTINGS_INVALID_CIDR",
} as const;

export type SystemSettingsErrorCode =
  (typeof SystemSettingsErrorCode)[keyof typeof SystemSettingsErrorCode];
