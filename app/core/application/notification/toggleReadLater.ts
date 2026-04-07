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
import type { NotificationReadLaterOutput } from "./dto";

export type ToggleReadLaterInput = {
  readonly operatorId: string;
  readonly notificationId: string;
};

export async function toggleReadLater({
  container,
  input,
}: ServiceArgs<ToggleReadLaterInput>): Promise<NotificationReadLaterOutput> {
  const operatorId = input.operatorId as UserId;
  const notificationId = NotificationId.create(input.notificationId);

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const notification =
      await ctx.notificationRepository.findById(notificationId);
    if (!notification)
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Notification ${input.notificationId} not found`,
      );
    if (!Notification.isOwnedBy(notification, operatorId))
      throw new ForbiddenError(
        ForbiddenErrorCode.InsufficientPermissions,
        "Notification access denied",
      );

    const { entity: updated } = Notification.toggleReadLater(notification);
    await ctx.notificationRepository.save(updated);
    return {
      notificationId: updated.notificationId,
      isReadLater: updated.isReadLater,
    };
  });
}
