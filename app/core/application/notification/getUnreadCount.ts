import type { UserId } from "@/core/domain/identity/valueObject";
import type { ServiceArgs } from "../types";
import type { UnreadCountOutput } from "./dto";

export type GetUnreadCountInput = { readonly operatorId: string };

export async function getUnreadCount({
  container,
  input,
}: ServiceArgs<GetUnreadCountInput>): Promise<UnreadCountOutput> {
  const operatorId = input.operatorId as UserId;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const unreadCount =
      await ctx.notificationRepository.countUnread(operatorId);
    return { unreadCount };
  });
}
