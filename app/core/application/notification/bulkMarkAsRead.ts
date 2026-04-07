import type { UserId } from "@/core/domain/identity/valueObject";
import type { NotificationId } from "@/core/domain/notification/valueObject";
import type { ServiceArgs } from "../types";
import type { BulkReadOutput } from "./dto";

export type BulkMarkAsReadInput = {
  readonly operatorId: string;
  readonly notificationIds?: readonly string[];
};

export async function bulkMarkAsRead({
  container,
  input,
}: ServiceArgs<BulkMarkAsReadInput>): Promise<BulkReadOutput> {
  const operatorId = input.operatorId as UserId;
  const notificationIds = input.notificationIds?.map(
    (id) => id as unknown as NotificationId,
  );

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const readCount = await ctx.notificationRepository.markAsReadBatch(
      operatorId,
      notificationIds,
    );
    return { readCount };
  });
}
