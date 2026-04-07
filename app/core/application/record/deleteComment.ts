import type { UserId } from "@/core/domain/identity/valueObject";
import { RecordComment } from "@/core/domain/record/entity";
import { CommentId } from "@/core/domain/record/valueObject";
import {
  ForbiddenError,
  ForbiddenErrorCode,
  NotFoundError,
  NotFoundErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";

export type DeleteCommentInput = {
  readonly appId: string;
  readonly recordId: string;
  readonly commentId: string;
  readonly requesterId: string;
};

export async function deleteComment({
  container,
  input,
}: ServiceArgs<DeleteCommentInput>): Promise<void> {
  const commentId = CommentId.create(input.commentId);
  const requesterId = input.requesterId as UserId;

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    const comment = await ctx.recordCommentRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Comment ${input.commentId} not found`,
      );
    }

    if (!RecordComment.isOwnedBy(comment, requesterId)) {
      throw new ForbiddenError(
        ForbiddenErrorCode.InsufficientPermissions,
        "Only the comment creator can delete it",
      );
    }

    await ctx.recordCommentRepository.delete(commentId);
  });
}
