import { UserId } from "@/core/domain/identity/valueObject";
import {
  ForbiddenError,
  ForbiddenErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";
import type { ListMessageThreadsOutput } from "./dto";

export type ListMessageThreadsInput = {
  operatorId: string;
  offset: number;
  limit: number;
};

export async function listMessageThreads({
  container,
  input,
}: ServiceArgs<ListMessageThreadsInput>): Promise<ListMessageThreadsOutput> {
  if (!container.config.features.peopleAndMessageEnabled) {
    throw new ForbiddenError(
      ForbiddenErrorCode.InsufficientPermissions,
      "People and Message features are disabled",
    );
  }

  if (input.offset < 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Offset must be non-negative",
    );
  }
  if (input.limit < 1 || input.limit > 100) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Limit must be between 1 and 100",
    );
  }

  const operatorId = UserId.create(input.operatorId);

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const result = await ctx.messageThreadRepository.findByParticipantUserId({
      userId: operatorId,
      offset: input.offset,
      limit: input.limit,
    });

    return {
      threads: result.threads.map((thread) => ({
        threadId: thread.threadId,
        participantIds: [
          thread.participantIds[0],
          thread.participantIds[1],
        ] as [string, string],
        lastMessageAt: thread.lastMessageAt,
        createdAt: thread.createdAt,
      })),
      totalCount: result.totalCount,
      offset: input.offset,
      limit: input.limit,
    };
  });
}
