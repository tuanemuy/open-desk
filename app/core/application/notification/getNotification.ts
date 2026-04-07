import type { UserId } from "@/core/domain/identity/valueObject";
import { Notification } from "@/core/domain/notification/entity";
import { NotificationId } from "@/core/domain/notification/valueObject";
import {
  ForbiddenError,
  ForbiddenErrorCode,
  NotFoundError,
  NotFoundErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";
import type { NotificationDetailOutput } from "./dto";

export type GetNotificationInput = {
  readonly operatorId: string;
  readonly notificationId: string;
};

export async function getNotification({
  container,
  input,
}: ServiceArgs<GetNotificationInput>): Promise<NotificationDetailOutput> {
  const operatorId = input.operatorId as UserId;
  const notificationId = NotificationId.create(input.notificationId);

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const notification =
      await ctx.notificationRepository.findById(notificationId);
    if (!notification) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Notification ${input.notificationId} not found`,
      );
    }
    if (!Notification.isOwnedBy(notification, operatorId)) {
      throw new ForbiddenError(
        ForbiddenErrorCode.InsufficientPermissions,
        "Notification access denied",
      );
    }

    const source = await container.notificationSourceResolver.resolve(
      notification.sourceType,
      notification.sourceId,
    );

    return {
      notificationId: notification.notificationId,
      type: notification.type,
      sourceType: notification.sourceType,
      sourceId: notification.sourceId,
      senderId: notification.senderId as string | null,
      title: notification.title,
      content: notification.content,
      isRead: notification.isRead,
      isReadLater: notification.isReadLater,
      createdAt: notification.createdAt,
      source,
    };
  });
}
