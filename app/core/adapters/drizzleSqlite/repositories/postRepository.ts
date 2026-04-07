import type { InferSelectModel } from "drizzle-orm";
import { count, eq, inArray, sql } from "drizzle-orm";
import { postMentions, posts } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import type { Post } from "@/core/domain/people/entity";
import type {
  PostListParams,
  PostListResult,
  PostRepository,
} from "@/core/domain/people/ports/postRepository";
import type {
  FileKey as FileKeyType,
  Mention as MentionType,
  PostId as PostIdType,
  RichTextHtml as RichTextHtmlType,
} from "@/core/domain/people/valueObject";
import type { Executor } from "../client";

type PostDataModel = InferSelectModel<typeof posts>;
type PostMentionDataModel = InferSelectModel<typeof postMentions>;

export class DrizzleSqlitePostRepository implements PostRepository {
  constructor(private readonly executor: Executor) {}

  private into(data: PostDataModel, mentions: PostMentionDataModel[]): Post {
    return {
      postId: data.id as PostIdType,
      authorId: data.authorId as UserIdType,
      content: data.content as RichTextHtmlType,
      mentions: mentions.map(
        (m) =>
          ({
            type: m.mentionType,
            targetId: m.targetId,
          }) as MentionType,
      ),
      attachmentFileKeys:
        data.attachmentFileKeys as unknown as readonly FileKeyType[],
      createdAt: data.createdAt,
    };
  }

  async findById(postId: PostIdType): Promise<Post | null> {
    try {
      const results = await this.executor
        .select()
        .from(posts)
        .where(eq(posts.id, postId))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      const mentions = await this.executor
        .select()
        .from(postMentions)
        .where(eq(postMentions.postId, postId));

      return this.into(results[0], mentions);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find post by id",
        error,
      );
    }
  }

  async findByAuthorId(params: PostListParams): Promise<PostListResult> {
    try {
      const [items, countResult] = await Promise.all([
        this.executor
          .select()
          .from(posts)
          .where(eq(posts.authorId, params.authorId))
          .orderBy(sql`${posts.createdAt} DESC`)
          .limit(params.limit)
          .offset(params.offset),
        this.executor
          .select({ count: count() })
          .from(posts)
          .where(eq(posts.authorId, params.authorId)),
      ]);

      if (items.length === 0) {
        return { posts: [], totalCount: countResult[0]?.count ?? 0 };
      }

      const postIds = items.map((item) => item.id);
      const allMentions = await this.executor
        .select()
        .from(postMentions)
        .where(inArray(postMentions.postId, postIds));

      return {
        posts: items.map((item) =>
          this.into(
            item,
            allMentions.filter((m) => m.postId === item.id),
          ),
        ),
        totalCount: countResult[0]?.count ?? 0,
      };
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find posts by author id",
        error,
      );
    }
  }

  async save(post: Post): Promise<void> {
    try {
      await this.executor
        .insert(posts)
        .values({
          id: post.postId,
          authorId: post.authorId,
          content: post.content,
          attachmentFileKeys: post.attachmentFileKeys as unknown as string[],
          createdAt: post.createdAt,
        })
        .onConflictDoUpdate({
          target: posts.id,
          set: {
            content: post.content,
            attachmentFileKeys: post.attachmentFileKeys as unknown as string[],
          },
        });

      // Replace mentions
      await this.executor
        .delete(postMentions)
        .where(eq(postMentions.postId, post.postId));

      if (post.mentions.length > 0) {
        await this.executor.insert(postMentions).values(
          post.mentions.map((m) => ({
            postId: post.postId,
            mentionType: m.type,
            targetId: m.targetId,
          })),
        );
      }
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save post",
        error,
      );
    }
  }

  async delete(postId: PostIdType): Promise<void> {
    try {
      await this.executor.delete(posts).where(eq(posts.id, postId));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete post",
        error,
      );
    }
  }
}
