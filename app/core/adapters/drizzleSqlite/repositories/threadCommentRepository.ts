import type { InferSelectModel } from "drizzle-orm";
import { count, eq } from "drizzle-orm";
import { threadComments } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import type { ThreadComment } from "@/core/domain/space/entity";
import type { ThreadCommentRepository } from "@/core/domain/space/ports/threadCommentRepository";
import type {
  CommentFile as CommentFileType,
  Mention as MentionType,
  SpaceId as SpaceIdType,
  ThreadCommentId as ThreadCommentIdType,
  ThreadId as ThreadIdType,
} from "@/core/domain/space/valueObject";
import type { Executor } from "../client";

type ThreadCommentDataModel = InferSelectModel<typeof threadComments>;

export class DrizzleSqliteThreadCommentRepository
  implements ThreadCommentRepository
{
  constructor(private readonly executor: Executor) {}

  private into(data: ThreadCommentDataModel): ThreadComment {
    return {
      commentId: data.id as ThreadCommentIdType,
      threadId: data.threadId as ThreadIdType,
      spaceId: data.spaceId as SpaceIdType,
      text: data.text,
      mentions: data.mentions as unknown as readonly MentionType[],
      files: data.files as unknown as readonly CommentFileType[],
      creatorId: data.creatorId as UserIdType,
      createdAt: data.createdAt,
    };
  }

  async findById(
    commentId: ThreadCommentIdType,
  ): Promise<ThreadComment | null> {
    try {
      const results = await this.executor
        .select()
        .from(threadComments)
        .where(eq(threadComments.id, commentId))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find thread comment by id",
        error,
      );
    }
  }

  async findByThreadId(
    threadId: ThreadIdType,
    offset: number,
    limit: number,
  ): Promise<{ comments: ThreadComment[]; totalCount: number }> {
    try {
      const [items, countResult] = await Promise.all([
        this.executor
          .select()
          .from(threadComments)
          .where(eq(threadComments.threadId, threadId))
          .limit(limit)
          .offset(offset),
        this.executor
          .select({ count: count() })
          .from(threadComments)
          .where(eq(threadComments.threadId, threadId)),
      ]);

      return {
        comments: items.map((item) => this.into(item)),
        totalCount: countResult[0]?.count ?? 0,
      };
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find thread comments by thread id",
        error,
      );
    }
  }

  async save(comment: ThreadComment): Promise<void> {
    try {
      await this.executor
        .insert(threadComments)
        .values({
          id: comment.commentId,
          threadId: comment.threadId,
          spaceId: comment.spaceId,
          text: comment.text,
          mentions: comment.mentions as unknown as Record<string, unknown>[],
          files: comment.files as unknown as Record<string, unknown>[],
          creatorId: comment.creatorId,
          createdAt: comment.createdAt,
        })
        .onConflictDoUpdate({
          target: threadComments.id,
          set: {
            text: comment.text,
            mentions: comment.mentions as unknown as Record<string, unknown>[],
            files: comment.files as unknown as Record<string, unknown>[],
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save thread comment",
        error,
      );
    }
  }

  async delete(commentId: ThreadCommentIdType): Promise<void> {
    try {
      await this.executor
        .delete(threadComments)
        .where(eq(threadComments.id, commentId));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete thread comment",
        error,
      );
    }
  }

  async deleteByThreadId(threadId: ThreadIdType): Promise<void> {
    try {
      await this.executor
        .delete(threadComments)
        .where(eq(threadComments.threadId, threadId));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete thread comments by thread id",
        error,
      );
    }
  }
}
