import { UserId } from "@/core/domain/identity/valueObject";
import { Post } from "@/core/domain/people/entity";
import { PostId } from "@/core/domain/people/valueObject";
import {
  ForbiddenError,
  ForbiddenErrorCode,
  NotFoundError,
  NotFoundErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";
import type { DeletePostOutput } from "./dto";

export type DeletePostInput = {
  operatorId: string;
  postId: string;
};

export async function deletePost({
  container,
  input,
}: ServiceArgs<DeletePostInput>): Promise<DeletePostOutput> {
  const operatorId = UserId.create(input.operatorId);
  const postId = PostId.create(input.postId);

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const post = await ctx.postRepository.findById(postId);
    if (!post) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Post not found: ${input.postId}`,
      );
    }

    if (!Post.isOwnedBy(post, operatorId)) {
      throw new ForbiddenError(
        ForbiddenErrorCode.InsufficientPermissions,
        "Only the author can delete this post",
      );
    }

    await ctx.postRepository.delete(postId);

    return {
      postId: post.postId,
    };
  });
}
