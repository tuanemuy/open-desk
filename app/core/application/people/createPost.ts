import { UserId } from "@/core/domain/identity/valueObject";
import { Post } from "@/core/domain/people/entity";
import { FileKey, Mention } from "@/core/domain/people/valueObject";
import type { ServiceArgs } from "../types";
import type { CreatePostOutput } from "./dto";

export type CreatePostInput = {
  authorId: string;
  content: string;
  mentions: { type: string; targetId: string }[];
  attachmentFileKeys: string[];
};

export async function createPost({
  container,
  input,
}: ServiceArgs<CreatePostInput>): Promise<CreatePostOutput> {
  const authorId = UserId.create(input.authorId);
  const mentions = input.mentions.map((m) =>
    Mention.create({ type: m.type, targetId: m.targetId }),
  );
  const attachmentFileKeys = input.attachmentFileKeys.map((k) =>
    FileKey.create(k),
  );

  const { entity: post } = Post.create({
    authorId,
    content: input.content,
    mentions,
    attachmentFileKeys,
  });

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.postRepository.save(post);
  });

  return {
    postId: post.postId,
    authorId: post.authorId,
    content: post.content,
    mentions: post.mentions.map((m) => ({
      type: m.type,
      targetId: m.targetId,
    })),
    attachmentFileKeys: post.attachmentFileKeys.map((k) => k as string),
    createdAt: post.createdAt,
  };
}
