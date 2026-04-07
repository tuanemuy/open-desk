import type { UserId } from "@/core/domain/identity/valueObject";
import { Thread } from "@/core/domain/space/entity";
import type { SpaceId } from "@/core/domain/space/valueObject";
import { ValidationError, ValidationErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { ThreadDto } from "./dto";
import { assertSpaceMember, getSpaceOrThrow } from "./helpers";

export type CreateThreadInput = {
  readonly operatorId: string;
  readonly spaceId: string;
  readonly title: string;
  readonly body?: string;
  readonly notifyOnCreate?: boolean;
};

export async function createThread({
  container,
  input,
}: ServiceArgs<CreateThreadInput>): Promise<ThreadDto> {
  const operatorId = input.operatorId as UserId;
  const spaceId = input.spaceId as SpaceId;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const space = await getSpaceOrThrow(ctx, spaceId);
    if (!space.useMultiThread) {
      throw new ValidationError(
        ValidationErrorCode.InvalidInput,
        "Multi-thread must be enabled to create threads",
      );
    }
    await assertSpaceMember(ctx, spaceId, operatorId);

    const { entity: thread } = Thread.create({
      spaceId,
      title: input.title,
      body: input.body ?? null,
      creatorId: operatorId,
      isDefault: false,
      notifyOnCreate: input.notifyOnCreate,
    });

    await ctx.threadRepository.save(thread);
    await ctx.threadFollowRepository.save({
      threadId: thread.threadId,
      userId: operatorId,
    });

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
