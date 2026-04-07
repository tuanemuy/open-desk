import type { UserId } from "@/core/domain/identity/valueObject";
import type { ThreadCommentId } from "@/core/domain/space/valueObject";
import {
  ForbiddenError,
  ForbiddenErrorCode,
  NotFoundError,
  NotFoundErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";

export type DeleteThreadCommentInput = {
  readonly operatorId: string;
  readonly commentId: string;
};

export async function deleteThreadComment({
  container,
  input,
}: ServiceArgs<DeleteThreadCommentInput>): Promise<void> {
  const operatorId = input.operatorId as UserId;
  const commentId = input.commentId as ThreadCommentId;

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    const comment = await ctx.threadCommentRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Comment ${input.commentId} not found`,
      );
    }

    const member = await ctx.spaceMemberRepository.findBySpaceIdAndUserId(
      comment.spaceId,
      operatorId,
    );
    const isAdmin = member?.isAdmin ?? false;
    const isCreator = comment.creatorId === operatorId;
    if (!isAdmin && !isCreator) {
      throw new ForbiddenError(
        ForbiddenErrorCode.InsufficientPermissions,
        "Only comment creator or space admin can delete",
      );
    }

    await ctx.commentLikeRepository.deleteByCommentId(commentId);
    await ctx.threadCommentRepository.delete(commentId);
  });
}
