import type { UserId } from "@/core/domain/identity/valueObject";
import { ThreadComment } from "@/core/domain/space/entity";
import type {
  CommentFile,
  Mention,
  ThreadId,
} from "@/core/domain/space/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { ThreadCommentDto } from "./dto";
import { assertSpaceMember } from "./helpers";

export type PostThreadCommentInput = {
  readonly operatorId: string;
  readonly threadId: string;
  readonly text?: string | null;
  readonly mentions?: readonly Mention[];
  readonly files?: readonly CommentFile[];
};

export async function postThreadComment({
  container,
  input,
}: ServiceArgs<PostThreadCommentInput>): Promise<ThreadCommentDto> {
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

    const { entity: comment } = ThreadComment.create({
      threadId,
      spaceId: thread.spaceId,
      text: input.text ?? null,
      mentions: input.mentions ?? [],
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
