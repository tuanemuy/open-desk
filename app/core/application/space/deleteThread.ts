import type { UserId } from "@/core/domain/identity/valueObject";
import type { ThreadId } from "@/core/domain/space/valueObject";
import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";
import { assertSpaceAdmin } from "./helpers";

export type DeleteThreadInput = {
  readonly operatorId: string;
  readonly threadId: string;
};

export async function deleteThread({
  container,
  input,
}: ServiceArgs<DeleteThreadInput>): Promise<void> {
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
    if (thread.isDefault) {
      throw new ValidationError(
        ValidationErrorCode.InvalidInput,
        "Default thread cannot be deleted",
      );
    }
    await assertSpaceAdmin(ctx, thread.spaceId, operatorId);

    await ctx.threadCommentRepository.deleteByThreadId(threadId);
    await ctx.threadFollowRepository.deleteByThreadId(threadId);
    await ctx.threadRepository.delete(threadId);
  });
}
