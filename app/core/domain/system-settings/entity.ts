import { BusinessRuleError } from "@/core/domain/error";
import { SystemSettingsErrorCode } from "./errorCode";
import type {
  SettingId as SettingIdType,
  SettingKey,
  SettingKeyValueMap,
} from "./valueObject";
import { SettingId } from "./valueObject";

// ============================================
// SystemSetting Entity
// ============================================

type _SystemSetting<K extends SettingKey = SettingKey> = Readonly<{
  settingId: SettingIdType;
  key: K;
  value: SettingKeyValueMap[K];
  updatedAt: Date;
}>;

export type SystemSetting<K extends SettingKey = SettingKey> =
  _SystemSetting<K>;

export const SystemSetting = {
  /**
   * Create a new SystemSetting entity.
   */
  create: <K extends SettingKey>(params: {
    key: K;
    value: SettingKeyValueMap[K];
  }): _SystemSetting<K> => {
    return {
      settingId: SettingId.generate(),
      key: params.key,
      value: params.value,
      updatedAt: new Date(),
    };
  },

  /**
   * Reconstruct a SystemSetting entity from persisted data.
   */
  reconstruct: <K extends SettingKey>(
    data: _SystemSetting<K>,
  ): _SystemSetting<K> => data,

  /**
   * Update the setting value.
   * @throws BusinessRuleError if value is invalid for the given key
   */
  updateValue: <K extends SettingKey>(
    setting: _SystemSetting<K>,
    value: SettingKeyValueMap[K],
  ): _SystemSetting<K> => {
    return {
      ...setting,
      value,
      updatedAt: new Date(),
    };
  },

  /**
   * Type guard to check if a setting has a specific key.
   */
  hasKey: <K extends SettingKey>(
    setting: _SystemSetting,
    key: K,
  ): setting is _SystemSetting<K> => {
    return setting.key === key;
  },

  /**
   * Get the setting value, throwing if the setting does not match the expected key.
   * @throws BusinessRuleError if the setting key does not match
   */
  getTypedValue: <K extends SettingKey>(
    setting: _SystemSetting,
    key: K,
  ): SettingKeyValueMap[K] => {
    if (setting.key !== key) {
      throw new BusinessRuleError(
        SystemSettingsErrorCode.InvalidSettingValue,
        `Expected setting key "${key}" but got "${setting.key}"`,
      );
    }
    return setting.value as SettingKeyValueMap[K];
  },
};
