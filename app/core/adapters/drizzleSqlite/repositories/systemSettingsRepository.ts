import type { InferSelectModel } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { systemSettings } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { SystemSetting } from "@/core/domain/system-settings/entity";
import type { SystemSettingsRepository } from "@/core/domain/system-settings/ports/systemSettingsRepository";
import type {
  SettingId as SettingIdType,
  SettingKey,
  SettingKeyValueMap,
} from "@/core/domain/system-settings/valueObject";
import type { Executor } from "../client";

type SystemSettingDataModel = InferSelectModel<typeof systemSettings>;

export class DrizzleSqliteSystemSettingsRepository
  implements SystemSettingsRepository
{
  constructor(private readonly executor: Executor) {}

  private into(data: SystemSettingDataModel): SystemSetting {
    return {
      settingId: data.id as SettingIdType,
      key: data.key as SettingKey,
      value: data.value as SettingKeyValueMap[SettingKey],
      updatedAt: data.updatedAt,
    };
  }

  async findByKey(key: SettingKey): Promise<SystemSetting | null> {
    try {
      const results = await this.executor
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.key, key))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find system setting by key",
        error,
      );
    }
  }

  async findAll(): Promise<SystemSetting[]> {
    try {
      const results = await this.executor.select().from(systemSettings);

      return results.map((r) => this.into(r));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find all system settings",
        error,
      );
    }
  }

  async save(setting: SystemSetting): Promise<void> {
    try {
      await this.executor
        .insert(systemSettings)
        .values({
          id: setting.settingId,
          key: setting.key,
          value: setting.value,
          updatedAt: setting.updatedAt,
        })
        .onConflictDoUpdate({
          target: systemSettings.id,
          set: {
            key: setting.key,
            value: setting.value,
            updatedAt: setting.updatedAt,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save system setting",
        error,
      );
    }
  }
}
