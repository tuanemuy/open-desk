import { UserId } from "@/core/domain/identity/valueObject";
import { ValidationError, ValidationErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { ListPostsOutput } from "./dto";

export type ListPostsInput = {
  targetUserId: string;
  offset: number;
  limit: number;
};

export async function listPosts({
  container,
  input,
}: ServiceArgs<ListPostsInput>): Promise<ListPostsOutput> {
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

  const targetUserId = UserId.create(input.targetUserId);

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const result = await ctx.postRepository.findByAuthorId({
      authorId: targetUserId,
      offset: input.offset,
      limit: input.limit,
    });

    return {
      posts: result.posts.map((post) => ({
        postId: post.postId,
        authorId: post.authorId,
        content: post.content,
        mentions: post.mentions.map((m) => ({
          type: m.type,
          targetId: m.targetId,
        })),
        attachmentFileKeys: post.attachmentFileKeys.map((k) => k as string),
        createdAt: post.createdAt,
      })),
      totalCount: result.totalCount,
      offset: input.offset,
      limit: input.limit,
    };
  });
}
