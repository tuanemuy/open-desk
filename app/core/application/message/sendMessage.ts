import { UserId } from "@/core/domain/identity/valueObject";
import { DirectMessage, MessageThread } from "@/core/domain/message/entity";
import {
  FileKey,
  MessageThreadId,
  RichTextHtml,
} from "@/core/domain/message/valueObject";
import {
  ForbiddenError,
  ForbiddenErrorCode,
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";
import type { SendMessageOutput } from "./dto";

export type SendMessageInput = {
  senderId: string;
  threadId: string;
  content: string;
  attachmentFileKeys: string[];
};

export async function sendMessage({
  container,
  input,
}: ServiceArgs<SendMessageInput>): Promise<SendMessageOutput> {
  if (!container.config.features.peopleAndMessageEnabled) {
    throw new ForbiddenError(
      ForbiddenErrorCode.InsufficientPermissions,
      "People and Message features are disabled",
    );
  }

  const senderId = UserId.create(input.senderId);
  const threadId = MessageThreadId.create(input.threadId);

  if (input.content.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Message content cannot be empty",
    );
  }

  // RichTextHtml.create validates disallowed tags (iframe, opendesk-app, etc.)
  const richTextContent = RichTextHtml.create(input.content);
  const attachmentFileKeys = input.attachmentFileKeys.map((k) =>
    FileKey.create(k),
  );

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const thread = await ctx.messageThreadRepository.findById(threadId);
    if (!thread) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Message thread not found: ${input.threadId}`,
      );
    }

    if (!MessageThread.isParticipant(thread, senderId)) {
      throw new ForbiddenError(
        ForbiddenErrorCode.InsufficientPermissions,
        "Sender is not a participant of this thread",
      );
    }

    const { entity: message } = DirectMessage.create({
      threadId,
      senderId,
      content: richTextContent,
      attachmentFileKeys,
    });

    await ctx.directMessageRepository.save(message);

    const { entity: updatedThread } = MessageThread.updateLastMessageAt(
      thread,
      message.createdAt,
    );
    await ctx.messageThreadRepository.save(updatedThread);

    return {
      messageId: message.messageId,
      threadId: message.threadId,
      senderId: message.senderId,
      content: message.content,
      attachmentFileKeys: message.attachmentFileKeys.map((k) => k as string),
      createdAt: message.createdAt,
    };
  });
}
