import type { UserId } from "@/core/domain/identity/valueObject";
import type { SpaceId } from "@/core/domain/space/valueObject";
import type { ServiceArgs } from "../types";
import { assertSpaceAdmin, getSpaceOrThrow } from "./helpers";

export type DeleteSpaceInput = {
  readonly operatorId: string;
  readonly spaceId: string;
};

export async function deleteSpace({
  container,
  input,
}: ServiceArgs<DeleteSpaceInput>): Promise<void> {
  const operatorId = input.operatorId as UserId;
  const spaceId = input.spaceId as SpaceId;

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await getSpaceOrThrow(ctx, spaceId);
    await assertSpaceAdmin(ctx, spaceId, operatorId);

    const threads = await ctx.threadRepository.findBySpaceId(spaceId);
    for (const thread of threads) {
      await ctx.threadCommentRepository.deleteByThreadId(thread.threadId);
      await ctx.threadFollowRepository.deleteByThreadId(thread.threadId);
      await ctx.threadRepository.delete(thread.threadId);
    }
    await ctx.spaceAnnouncementRepository.deleteBySpaceId(spaceId);
    await ctx.relatedLinkRepository.deleteBySpaceId(spaceId);
    await ctx.spaceMemberRepository.deleteBySpaceId(spaceId);
    await ctx.spaceRepository.delete(spaceId);
  });
}
