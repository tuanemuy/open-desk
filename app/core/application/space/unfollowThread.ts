import type { UserId } from "@/core/domain/identity/valueObject";
import { unfollow } from "@/core/domain/space/services/threadFollowService";
import type { ThreadId } from "@/core/domain/space/valueObject";
import {
  ForbiddenError,
  ForbiddenErrorCode,
  NotFoundError,
  NotFoundErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";
import { assertSpaceMember } from "./helpers";

export type UnfollowThreadInput = {
  readonly operatorId: string;
  readonly threadId: string;
};

export async function unfollowThread({
  container,
  input,
}: ServiceArgs<UnfollowThreadInput>): Promise<void> {
  const operatorId = input.operatorId as UserId;
  const threadId = input.threadId as ThreadId;

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    const thread = await ctx.threadRepository.findById(threadId);
    if (!thread) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Thread ${input.threadId} not found`,
      );
    }
    await assertSpaceMember(ctx, thread.spaceId, operatorId);

    const result = await unfollow(
      {
        spaceRepository: ctx.spaceRepository,
        threadRepository: ctx.threadRepository,
        threadFollowRepository: ctx.threadFollowRepository,
      },
      { threadId, userId: operatorId },
    );

    if (!result.ok) {
      throw new ForbiddenError(
        ForbiddenErrorCode.InsufficientPermissions,
        `Cannot unfollow thread: ${result.error.kind}`,
      );
    }
  });
}
