import type { UserId } from "@/core/domain/identity/valueObject";
import { RecordComment } from "@/core/domain/record/entity";
import { CommentId } from "@/core/domain/record/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";

export type LikeCommentInput = {
  readonly appId: string;
  readonly recordId: string;
  readonly commentId: string;
  readonly userId: string;
};

export async function likeComment({
  container,
  input,
}: ServiceArgs<LikeCommentInput>): Promise<void> {
  const commentId = CommentId.create(input.commentId);
  const userId = input.userId as UserId;

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    const comment = await ctx.recordCommentRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Comment ${input.commentId} not found`,
      );
    }

    const { entity: updatedComment } = RecordComment.addLike(comment, userId);
    await ctx.recordCommentRepository.save(updatedComment);
  });
}
