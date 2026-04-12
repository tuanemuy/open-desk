import type { InferSelectModel } from "drizzle-orm";
import { auditLogSettings } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { AuditLogSetting } from "@/core/domain/audit/entity";
import type { AuditLogSettingRepository } from "@/core/domain/audit/ports/auditLogSettingRepository";
import type { Executor } from "../client";

type AuditLogSettingDataModel = InferSelectModel<typeof auditLogSettings>;

export class DrizzleSqliteAuditLogSettingRepository
  implements AuditLogSettingRepository
{
  constructor(private readonly executor: Executor) {}

  private into(data: AuditLogSettingDataModel): AuditLogSetting {
    return {
      settings: data.settings as Record<string, unknown>,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  async find(): Promise<AuditLogSetting> {
    try {
      const results = await this.executor
        .select()
        .from(auditLogSettings)
        .limit(1);

      if (results.length === 0) {
        // Return a default singleton when no record exists
        const now = new Date();
        const defaultSetting: AuditLogSetting = {
          settings: {},
          createdAt: now,
          updatedAt: now,
        };
        return defaultSetting;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find audit log setting",
        error,
      );
    }
  }

  async save(setting: AuditLogSetting): Promise<void> {
    try {
      // Singleton pattern: delete all existing records and insert the new one
      await this.executor.delete(auditLogSettings);
      await this.executor.insert(auditLogSettings).values({
        settings: setting.settings,
        createdAt: setting.createdAt,
        updatedAt: setting.updatedAt,
      });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save audit log setting",
        error,
      );
    }
  }
}
