import { UserId } from "@/core/domain/identity/valueObject";
import { MessageThread } from "@/core/domain/message/entity";
import { MessageThreadId } from "@/core/domain/message/valueObject";
import {
  ForbiddenError,
  ForbiddenErrorCode,
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";
import type { ListMessagesOutput } from "./dto";

export type ListMessagesInput = {
  operatorId: string;
  threadId: string;
  offset: number;
  limit: number;
};

export async function listMessages({
  container,
  input,
}: ServiceArgs<ListMessagesInput>): Promise<ListMessagesOutput> {
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
  const threadId = MessageThreadId.create(input.threadId);

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const thread = await ctx.messageThreadRepository.findById(threadId);
    if (!thread) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Message thread not found: ${input.threadId}`,
      );
    }

    if (!MessageThread.isParticipant(thread, operatorId)) {
      throw new ForbiddenError(
        ForbiddenErrorCode.InsufficientPermissions,
        "Operator is not a participant of this thread",
      );
    }

    const result = await ctx.directMessageRepository.findByThreadId({
      threadId,
      offset: input.offset,
      limit: input.limit,
    });

    return {
      messages: result.messages.map((msg) => ({
        messageId: msg.messageId,
        threadId: msg.threadId,
        senderId: msg.senderId,
        content: msg.content,
        attachmentFileKeys: msg.attachmentFileKeys.map((k) => k as string),
        createdAt: msg.createdAt,
      })),
      totalCount: result.totalCount,
      offset: input.offset,
      limit: input.limit,
    };
  });
}
