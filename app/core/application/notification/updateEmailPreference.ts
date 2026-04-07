import type { UserId } from "@/core/domain/identity/valueObject";
import { NotificationPreference } from "@/core/domain/notification/entity";
import type {
  EmailNotificationFormat,
  EmailNotificationScope,
} from "@/core/domain/notification/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { EmailPreferenceOutput } from "./dto";

export type UpdateEmailPreferenceInput = {
  readonly operatorId: string;
  readonly emailEnabled?: boolean;
  readonly emailScope?: EmailNotificationScope;
  readonly emailFormat?: EmailNotificationFormat;
};

export async function updateEmailPreference({
  container,
  input,
}: ServiceArgs<UpdateEmailPreferenceInput>): Promise<EmailPreferenceOutput> {
  const operatorId = input.operatorId as UserId;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    let preference =
      await ctx.notificationPreferenceRepository.findByUserId(operatorId);
    if (!preference)
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        "Notification preference not found",
      );

    if (input.emailEnabled !== undefined) {
      preference = NotificationPreference.setEmailEnabled(
        preference,
        input.emailEnabled,
      );
    }
    if (input.emailScope !== undefined) {
      preference = NotificationPreference.setEmailScope(
        preference,
        input.emailScope,
      );
    }
    if (input.emailFormat !== undefined) {
      preference = NotificationPreference.setEmailFormat(
        preference,
        input.emailFormat,
      );
    }

    await ctx.notificationPreferenceRepository.save(preference);

    return {
      emailEnabled: preference.emailEnabled,
      emailScope: preference.emailScope,
      emailFormat: preference.emailFormat,
      updatedAt: preference.updatedAt,
    };
  });
}
