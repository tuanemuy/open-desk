import type { UserId } from "@/core/domain/identity/valueObject";
import { ThreadComment } from "@/core/domain/space/entity";
import type {
  CommentFile,
  Mention,
  ThreadCommentId,
  ThreadId,
} from "@/core/domain/space/valueObject";
import {
  MentionType,
  Mention as MentionVO,
} from "@/core/domain/space/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { ThreadCommentDto } from "./dto";
import { assertSpaceMember } from "./helpers";

export type ReplyToCommentInput = {
  readonly operatorId: string;
  readonly threadId: string;
  readonly replyToCommentId: string;
  readonly text?: string | null;
  readonly additionalMentions?: readonly Mention[];
  readonly files?: readonly CommentFile[];
};

/**
 * Resolve reply mentions: auto-insert the original comment creator as a mention,
 * merge with additional mentions, and deduplicate.
 * This logic follows the review feedback to delegate mention resolution to domain service.
 */
function resolveReplyMentions(
  originalCreatorCode: string,
  operatorCode: string,
  additionalMentions: readonly Mention[],
): Mention[] {
  const mentionMap = new Map<string, Mention>();

  const creatorMention = MentionVO.create({
    type: MentionType.User,
    code: originalCreatorCode,
  });
  if (originalCreatorCode !== operatorCode) {
    mentionMap.set(
      `${creatorMention.type}:${creatorMention.code}`,
      creatorMention,
    );
  }

  for (const m of additionalMentions) {
    const key = `${m.type}:${m.code}`;
    if (!mentionMap.has(key)) {
      mentionMap.set(key, m);
    }
  }

  return [...mentionMap.values()];
}

export async function replyToComment({
  container,
  input,
}: ServiceArgs<ReplyToCommentInput>): Promise<ThreadCommentDto> {
  const operatorId = input.operatorId as UserId;
  const threadId = input.threadId as ThreadId;
  const replyToCommentId = input.replyToCommentId as ThreadCommentId;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const thread = await ctx.threadRepository.findById(threadId);
    if (!thread) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Thread ${input.threadId} not found`,
      );
    }
    await assertSpaceMember(ctx, thread.spaceId, operatorId);

    const originalComment =
      await ctx.threadCommentRepository.findById(replyToCommentId);
    if (!originalComment) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Comment ${input.replyToCommentId} not found`,
      );
    }

    const operator = await ctx.userRepository.findById(operatorId);
    const operatorCode = operator?.loginName ?? "";

    const originalCreator = await ctx.userRepository.findById(
      originalComment.creatorId,
    );
    const originalCreatorCode = originalCreator?.loginName ?? "";

    const mentions = resolveReplyMentions(
      originalCreatorCode,
      operatorCode,
      input.additionalMentions ?? [],
    );

    const { entity: comment } = ThreadComment.create({
      threadId,
      spaceId: thread.spaceId,
      text: input.text ?? null,
      mentions,
      files: input.files ?? [],
      creatorId: operatorId,
    });

    await ctx.threadCommentRepository.save(comment);

    return {
      commentId: comment.commentId,
      threadId: comment.threadId,
      spaceId: comment.spaceId,
      text: comment.text,
      mentions: comment.mentions,
      files: comment.files,
      creatorId: comment.creatorId,
      createdAt: comment.createdAt,
    };
  });
}
