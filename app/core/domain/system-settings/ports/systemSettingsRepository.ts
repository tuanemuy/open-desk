import type { SystemSetting } from "@/core/domain/system-settings/entity";
import type { SettingKey } from "@/core/domain/system-settings/valueObject";

/**
 * Repository port for SystemSetting entity persistence.
 */
export interface SystemSettingsRepository {
  /**
   * Find a system setting by its key.
   * @returns The system setting, or null if not found.
   */
  findByKey(key: SettingKey): Promise<SystemSetting | null>;

  /**
   * Find all system settings.
   * @returns An array of all system settings.
   */
  findAll(): Promise<SystemSetting[]>;

  /**
   * Save a system setting (insert or update).
   */
  save(setting: SystemSetting): Promise<void>;
}
