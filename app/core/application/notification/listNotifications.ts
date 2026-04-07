import type { UserId } from "@/core/domain/identity/valueObject";
import type { NotificationFilterId } from "@/core/domain/notification/valueObject";
import {
  ForbiddenError,
  ForbiddenErrorCode,
  NotFoundError,
  NotFoundErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";
import type { NotificationListOutput } from "./dto";

export type ListNotificationsInput = {
  readonly operatorId: string;
  readonly filterId?: string;
  readonly isRead?: boolean;
  readonly offset?: number;
  readonly limit?: number;
};

export async function listNotifications({
  container,
  input,
}: ServiceArgs<ListNotificationsInput>): Promise<NotificationListOutput> {
  const operatorId = input.operatorId as UserId;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    if (input.filterId) {
      const filter = await ctx.notificationFilterRepository.findById(
        input.filterId as NotificationFilterId,
      );
      if (!filter) {
        throw new NotFoundError(
          NotFoundErrorCode.NotFound,
          `Filter ${input.filterId} not found`,
        );
      }
      if (filter.userId !== operatorId) {
        throw new ForbiddenError(
          ForbiddenErrorCode.InsufficientPermissions,
          "Filter access denied",
        );
      }
    }

    const result = await ctx.notificationRepository.findByRecipientId(
      operatorId,
      {
        isRead: input.isRead,
        offset: input.offset ?? 0,
        limit: input.limit ?? 50,
      },
    );

    return {
      notifications: result.notifications.map((n) => ({
        notificationId: n.notificationId,
        type: n.type,
        sourceType: n.sourceType,
        sourceId: n.sourceId,
        senderId: n.senderId as string | null,
        title: n.title,
        content: n.content,
        isRead: n.isRead,
        isReadLater: n.isReadLater,
        createdAt: n.createdAt,
      })),
      totalCount: result.totalCount,
    };
  });
}
