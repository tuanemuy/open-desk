import type { UserId } from "@/core/domain/identity/valueObject";
import { NotificationGenerationService } from "@/core/domain/notification/services/notificationGenerationService";
import type { SourceType } from "@/core/domain/notification/valueObject";
import type { ServiceArgs } from "../types";
import type { GenerateNotificationsOutput } from "./dto";

export type GenerateMentionNotificationsInput = {
  readonly senderId: string;
  readonly sourceType: string;
  readonly sourceId: string;
  readonly mentionedUserIds: readonly string[];
  readonly title: string;
  readonly content: string;
};

export async function generateMentionNotifications({
  container,
  input,
}: ServiceArgs<GenerateMentionNotificationsInput>): Promise<GenerateNotificationsOutput> {
  const senderId = input.senderId as UserId;
  const mentionedUserIds = input.mentionedUserIds.map((id) => id as UserId);

  const { notifications } =
    NotificationGenerationService.generateMentionNotifications({
      senderId,
      sourceType: input.sourceType as SourceType,
      sourceId: input.sourceId,
      mentionedUserIds,
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
