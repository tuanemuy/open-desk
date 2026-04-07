import { AppNotificationConfig } from "@/core/domain/app/entity";
import { AppErrorCode } from "@/core/domain/app/errorCode";
import type {
  GeneralNotification,
  PerRecordNotification,
  ReminderNotification,
} from "@/core/domain/app/valueObject";
import { AppId, AppStatus, Revision } from "@/core/domain/app/valueObject";
import { BusinessRuleError } from "@/core/domain/error";
import { UserId } from "@/core/domain/identity/valueObject";
import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";
import type { ConfigureNotificationsOutput } from "./dto";

export type ConfigureNotificationsInput = {
  appId: string;
  generalNotifications: GeneralNotification[] | null;
  perRecordNotifications: PerRecordNotification[] | null;
  reminderNotifications: ReminderNotification[] | null;
  revision: number;
  modifierId: string;
};

export async function configureNotifications({
  container,
  input,
}: ServiceArgs<ConfigureNotificationsInput>): Promise<ConfigureNotificationsOutput> {
  const appId = AppId.create(input.appId);
  const expectedRevision = Revision.create(input.revision);
  const _modifierId = UserId.create(input.modifierId);

  return await container.unitOfWorkProvider.transaction(async (repos) => {
    const app = await repos.appRepository.findById(appId);
    if (app === null) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `App ${input.appId} not found`,
      );
    }
    if (AppStatus.isDeleted(app.status)) {
      throw new BusinessRuleError(
        AppErrorCode.DeletedAppModification,
        "Cannot modify a deleted app",
      );
    }

    let config = await repos.appNotificationConfigRepository.findByAppId(appId);
    if (config === null) {
      config = AppNotificationConfig.create({ appId });
    } else {
      if (config.revision !== expectedRevision) {
        throw new BusinessRuleError(
          AppErrorCode.RevisionConflict,
          `Revision conflict: expected ${expectedRevision}, got ${config.revision}`,
        );
      }
    }

    if (input.generalNotifications !== null) {
      config = AppNotificationConfig.setGeneralNotifications(
        config,
        input.generalNotifications,
      );
    }

    if (input.perRecordNotifications !== null) {
      config = AppNotificationConfig.setPerRecordNotifications(
        config,
        input.perRecordNotifications,
      );
    }

    if (input.reminderNotifications !== null) {
      // Validate that dateFieldCode references a date/datetime field
      for (const reminder of input.reminderNotifications) {
        const field = await repos.fieldRepository.findByCode(
          appId,
          reminder.dateFieldCode,
        );
        if (field === null) {
          throw new ValidationError(
            ValidationErrorCode.InvalidInput,
            `Reminder date field ${reminder.dateFieldCode} not found`,
          );
        }
        if (field.fieldType !== "DATE" && field.fieldType !== "DATETIME") {
          throw new ValidationError(
            ValidationErrorCode.InvalidInput,
            `Reminder date field ${reminder.dateFieldCode} must be a DATE or DATETIME type`,
          );
        }
      }
      config = AppNotificationConfig.setReminderNotifications(
        config,
        input.reminderNotifications,
      );
    }

    // Increment revision
    config = {
      ...config,
      revision: Revision.increment(config.revision),
    };

    await repos.appNotificationConfigRepository.save(config);

    return {
      appId: config.appId,
      revision: config.revision,
    };
  });
}
