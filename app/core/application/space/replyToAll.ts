import type { UserId } from "@/core/domain/identity/valueObject";
import { ThreadComment } from "@/core/domain/space/entity";
import type {
  CommentFile,
  Mention,
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

export type ReplyToAllInput = {
  readonly operatorId: string;
  readonly threadId: string;
  readonly text?: string | null;
  readonly additionalMentions?: readonly Mention[];
  readonly files?: readonly CommentFile[];
};

export async function replyToAll({
  container,
  input,
}: ServiceArgs<ReplyToAllInput>): Promise<ThreadCommentDto> {
  const operatorId = input.operatorId as UserId;
  const threadId = input.threadId as ThreadId;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const thread = await ctx.threadRepository.findById(threadId);
    if (!thread) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Thread ${input.threadId} not found`,
      );
    }
    await assertSpaceMember(ctx, thread.spaceId, operatorId);

    const { comments } = await ctx.threadCommentRepository.findByThreadId(
      threadId,
      0,
      10000,
    );

    const mentionMap = new Map<string, Mention>();

    for (const c of comments) {
      if (c.creatorId !== operatorId) {
        const user = await ctx.userRepository.findById(c.creatorId);
        if (user) {
          const mention = MentionVO.create({
            type: MentionType.User,
            code: user.loginName,
          });
          mentionMap.set(`${mention.type}:${mention.code}`, mention);
        }
      }
    }

    for (const m of input.additionalMentions ?? []) {
      const key = `${m.type}:${m.code}`;
      if (!mentionMap.has(key)) {
        mentionMap.set(key, m);
      }
    }

    const mentions = [...mentionMap.values()];

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
