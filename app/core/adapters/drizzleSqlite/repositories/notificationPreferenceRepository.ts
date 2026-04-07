import type { InferSelectModel } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { notificationPreferences } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import type { NotificationPreference } from "@/core/domain/notification/entity";
import type { NotificationPreferenceRepository } from "@/core/domain/notification/ports/notificationPreferenceRepository";
import type {
  EmailNotificationFormat as EmailNotificationFormatType,
  EmailNotificationScope as EmailNotificationScopeType,
} from "@/core/domain/notification/valueObject";
import type { Executor } from "../client";

type NotificationPreferenceDataModel = InferSelectModel<
  typeof notificationPreferences
>;

export class DrizzleSqliteNotificationPreferenceRepository
  implements NotificationPreferenceRepository
{
  constructor(private readonly executor: Executor) {}

  private into(data: NotificationPreferenceDataModel): NotificationPreference {
    return {
      userId: data.userId as UserIdType,
      emailEnabled: data.emailEnabled,
      emailScope: data.emailScope as EmailNotificationScopeType,
      emailFormat: data.emailFormat as EmailNotificationFormatType,
      desktopEnabled: data.desktopEnabled,
      updatedAt: data.updatedAt,
    };
  }

  async findByUserId(
    userId: UserIdType,
  ): Promise<NotificationPreference | null> {
    try {
      const results = await this.executor
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, userId))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find notification preference by user id",
        error,
      );
    }
  }

  async save(
    preference: NotificationPreference,
  ): Promise<NotificationPreference> {
    try {
      await this.executor
        .insert(notificationPreferences)
        .values({
          userId: preference.userId,
          emailEnabled: preference.emailEnabled,
          emailScope: preference.emailScope,
          emailFormat: preference.emailFormat,
          desktopEnabled: preference.desktopEnabled,
          updatedAt: preference.updatedAt,
        })
        .onConflictDoUpdate({
          target: notificationPreferences.userId,
          set: {
            emailEnabled: preference.emailEnabled,
            emailScope: preference.emailScope,
            emailFormat: preference.emailFormat,
            desktopEnabled: preference.desktopEnabled,
            updatedAt: preference.updatedAt,
          },
        });

      return preference;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save notification preference",
        error,
      );
    }
  }

  async delete(userId: UserIdType): Promise<void> {
    try {
      await this.executor
        .delete(notificationPreferences)
        .where(eq(notificationPreferences.userId, userId));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete notification preference",
        error,
      );
    }
  }
}
