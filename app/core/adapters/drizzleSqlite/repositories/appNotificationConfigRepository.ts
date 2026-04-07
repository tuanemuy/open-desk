import type { InferSelectModel } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { appNotificationConfigs } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { AppNotificationConfig } from "@/core/domain/app/entity";
import type { AppNotificationConfigRepository } from "@/core/domain/app/ports/appNotificationConfigRepository";
import type {
  AppId as AppIdType,
  GeneralNotification as GeneralNotificationType,
  PerRecordNotification as PerRecordNotificationType,
  ReminderNotification as ReminderNotificationType,
  Revision as RevisionType,
} from "@/core/domain/app/valueObject";
import type { Executor } from "../client";

type AppNotificationConfigDataModel = InferSelectModel<
  typeof appNotificationConfigs
>;

export class DrizzleSqliteAppNotificationConfigRepository
  implements AppNotificationConfigRepository
{
  constructor(private readonly executor: Executor) {}

  private into(data: AppNotificationConfigDataModel): AppNotificationConfig {
    return {
      appId: data.appId as AppIdType,
      generalNotifications:
        data.generalNotifications as unknown as readonly GeneralNotificationType[],
      perRecordNotifications:
        data.perRecordNotifications as unknown as readonly PerRecordNotificationType[],
      reminderNotifications:
        data.reminderNotifications as unknown as readonly ReminderNotificationType[],
      revision: data.revision as RevisionType,
    };
  }

  async findByAppId(appId: AppIdType): Promise<AppNotificationConfig | null> {
    try {
      const results = await this.executor
        .select()
        .from(appNotificationConfigs)
        .where(eq(appNotificationConfigs.appId, appId))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find app notification config by app id",
        error,
      );
    }
  }

  async save(config: AppNotificationConfig): Promise<void> {
    try {
      await this.executor
        .insert(appNotificationConfigs)
        .values({
          appId: config.appId,
          generalNotifications:
            config.generalNotifications as unknown as Record<string, unknown>[],
          perRecordNotifications:
            config.perRecordNotifications as unknown as Record<
              string,
              unknown
            >[],
          reminderNotifications:
            config.reminderNotifications as unknown as Record<
              string,
              unknown
            >[],
          revision: config.revision,
        })
        .onConflictDoUpdate({
          target: appNotificationConfigs.appId,
          set: {
            generalNotifications:
              config.generalNotifications as unknown as Record<
                string,
                unknown
              >[],
            perRecordNotifications:
              config.perRecordNotifications as unknown as Record<
                string,
                unknown
              >[],
            reminderNotifications:
              config.reminderNotifications as unknown as Record<
                string,
                unknown
              >[],
            revision: config.revision,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save app notification config",
        error,
      );
    }
  }
}
