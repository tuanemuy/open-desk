import type { UserId } from "@/core/domain/identity/valueObject";
import { follow } from "@/core/domain/space/services/threadFollowService";
import type { ThreadId } from "@/core/domain/space/valueObject";
import {
  ForbiddenError,
  ForbiddenErrorCode,
  NotFoundError,
  NotFoundErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";
import { assertSpaceMember } from "./helpers";

export type FollowThreadInput = {
  readonly operatorId: string;
  readonly threadId: string;
};

export async function followThread({
  container,
  input,
}: ServiceArgs<FollowThreadInput>): Promise<void> {
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

    const result = await follow(
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
        `Cannot follow thread: ${result.error.kind}`,
      );
    }
  });
}
