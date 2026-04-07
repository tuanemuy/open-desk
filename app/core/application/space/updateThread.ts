import type { UserId } from "@/core/domain/identity/valueObject";
import { Thread } from "@/core/domain/space/entity";
import type { ThreadId } from "@/core/domain/space/valueObject";
import {
  ForbiddenError,
  ForbiddenErrorCode,
  NotFoundError,
  NotFoundErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";
import type { ThreadDto } from "./dto";

export type UpdateThreadInput = {
  readonly operatorId: string;
  readonly threadId: string;
  readonly title?: string;
  readonly body?: string | null;
};

export async function updateThread({
  container,
  input,
}: ServiceArgs<UpdateThreadInput>): Promise<ThreadDto> {
  const operatorId = input.operatorId as UserId;
  const threadId = input.threadId as ThreadId;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    let thread = await ctx.threadRepository.findById(threadId);
    if (!thread) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Thread ${input.threadId} not found`,
      );
    }

    const member = await ctx.spaceMemberRepository.findBySpaceIdAndUserId(
      thread.spaceId,
      operatorId,
    );
    const isAdmin = member?.isAdmin ?? false;
    const isCreator = thread.creatorId === operatorId;
    if (!isAdmin && !isCreator) {
      throw new ForbiddenError(
        ForbiddenErrorCode.InsufficientPermissions,
        "Only space admin or thread creator can update",
      );
    }

    if (input.title !== undefined) {
      const { entity } = Thread.rename(thread, input.title);
      thread = entity;
    }
    if (input.body !== undefined) {
      const { entity } = Thread.updateBody(thread, input.body);
      thread = entity;
    }

    await ctx.threadRepository.save(thread);

    return {
      threadId: thread.threadId,
      spaceId: thread.spaceId,
      title: thread.title,
      body: thread.body,
      creatorId: thread.creatorId,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
    };
  });
}
