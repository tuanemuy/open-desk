import type { InferSelectModel } from "drizzle-orm";
import { and, eq } from "drizzle-orm";
import { threadCommentLikes } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import type { CommentLike } from "@/core/domain/space/entity";
import type { CommentLikeRepository } from "@/core/domain/space/ports/commentLikeRepository";
import type {
  CommentLikeId as CommentLikeIdType,
  ThreadCommentId as ThreadCommentIdType,
} from "@/core/domain/space/valueObject";
import type { Executor } from "../client";

type CommentLikeDataModel = InferSelectModel<typeof threadCommentLikes>;

export class DrizzleSqliteCommentLikeRepository
  implements CommentLikeRepository
{
  constructor(private readonly executor: Executor) {}

  private into(data: CommentLikeDataModel): CommentLike {
    return {
      likeId: data.id as CommentLikeIdType,
      commentId: data.commentId as ThreadCommentIdType,
      userId: data.userId as UserIdType,
      createdAt: data.createdAt,
    };
  }

  async findByCommentId(
    commentId: ThreadCommentIdType,
  ): Promise<CommentLike[]> {
    try {
      const results = await this.executor
        .select()
        .from(threadCommentLikes)
        .where(eq(threadCommentLikes.commentId, commentId));

      return results.map((r) => this.into(r));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find comment likes by comment id",
        error,
      );
    }
  }

  async exists(
    commentId: ThreadCommentIdType,
    userId: UserIdType,
  ): Promise<boolean> {
    try {
      const results = await this.executor
        .select()
        .from(threadCommentLikes)
        .where(
          and(
            eq(threadCommentLikes.commentId, commentId),
            eq(threadCommentLikes.userId, userId),
          ),
        )
        .limit(1);

      return results.length > 0;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to check comment like existence",
        error,
      );
    }
  }

  async save(like: CommentLike): Promise<void> {
    try {
      await this.executor
        .insert(threadCommentLikes)
        .values({
          id: like.likeId,
          commentId: like.commentId,
          userId: like.userId,
          createdAt: like.createdAt,
        })
        .onConflictDoUpdate({
          target: [threadCommentLikes.commentId, threadCommentLikes.userId],
          set: {
            createdAt: like.createdAt,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save comment like",
        error,
      );
    }
  }

  async delete(
    commentId: ThreadCommentIdType,
    userId: UserIdType,
  ): Promise<void> {
    try {
      await this.executor
        .delete(threadCommentLikes)
        .where(
          and(
            eq(threadCommentLikes.commentId, commentId),
            eq(threadCommentLikes.userId, userId),
          ),
        );
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete comment like",
        error,
      );
    }
  }

  async deleteByCommentId(commentId: ThreadCommentIdType): Promise<void> {
    try {
      await this.executor
        .delete(threadCommentLikes)
        .where(eq(threadCommentLikes.commentId, commentId));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete comment likes by comment id",
        error,
      );
    }
  }
}
