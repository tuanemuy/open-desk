import type { UserId } from "@/core/domain/identity/valueObject";
import { NotificationGenerationService } from "@/core/domain/notification/services/notificationGenerationService";
import type { SourceType } from "@/core/domain/notification/valueObject";
import type { ServiceArgs } from "../types";
import type { GenerateNotificationsOutput } from "./dto";

export type GenerateReminderNotificationsInput = {
  readonly sourceType: string;
  readonly sourceId: string;
  readonly recipientIds: readonly string[];
  readonly title: string;
  readonly content: string;
};

export async function generateReminderNotifications({
  container,
  input,
}: ServiceArgs<GenerateReminderNotificationsInput>): Promise<GenerateNotificationsOutput> {
  const recipientIds = input.recipientIds.map((id) => id as UserId);

  const { notifications } =
    NotificationGenerationService.generateReminderNotifications({
      sourceType: input.sourceType as SourceType,
      sourceId: input.sourceId,
      recipientIds,
      title: input.title,
      content: input.content,
    });

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.notificationRepository.saveBatch([...notifications]);
    return {
      notifications: notifications.map((n) => ({
        notificationId: n.notificationId,
        recipientId: n.recipientId as string,
      })),
    };
  });
}
