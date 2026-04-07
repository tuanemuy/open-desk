import type { UserId } from "@/core/domain/identity/valueObject";
import { CommentLike } from "@/core/domain/space/entity";
import type { ThreadCommentId } from "@/core/domain/space/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { ToggleLikeOutput } from "./dto";
import { assertSpaceMember } from "./helpers";

export type ToggleCommentLikeInput = {
  readonly operatorId: string;
  readonly commentId: string;
};

export async function toggleCommentLike({
  container,
  input,
}: ServiceArgs<ToggleCommentLikeInput>): Promise<ToggleLikeOutput> {
  const operatorId = input.operatorId as UserId;
  const commentId = input.commentId as ThreadCommentId;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const comment = await ctx.threadCommentRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Comment ${input.commentId} not found`,
      );
    }
    await assertSpaceMember(ctx, comment.spaceId, operatorId);

    const existing = await ctx.commentLikeRepository.exists(
      commentId,
      operatorId,
    );
    if (existing) {
      await ctx.commentLikeRepository.delete(commentId, operatorId);
      return { liked: false };
    }

    const { entity: like } = CommentLike.create({
      commentId,
      userId: operatorId,
    });
    await ctx.commentLikeRepository.save(like);
    return { liked: true };
  });
}
