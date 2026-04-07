import type { InferSelectModel } from "drizzle-orm";
import { and, asc, desc, eq } from "drizzle-orm";
import {
  recordCommentLikes,
  recordComments,
} from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { AppId } from "@/core/domain/app/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";
import type { RecordComment } from "@/core/domain/record/entity";
import type {
  CommentListResult,
  RecordCommentRepository,
} from "@/core/domain/record/ports/recordCommentRepository";
import type {
  CommentId,
  Mention,
  RecordId,
} from "@/core/domain/record/valueObject";
import type { Executor } from "../client";

type RecordCommentDataModel = InferSelectModel<typeof recordComments>;
type RecordCommentLikeDataModel = InferSelectModel<typeof recordCommentLikes>;

const DEFAULT_COMMENT_LIMIT = 10;
const MAX_COMMENT_LIMIT = 10;

export class DrizzleSqliteRecordCommentRepository
  implements RecordCommentRepository
{
  constructor(private readonly executor: Executor) {}

  private into(
    data: RecordCommentDataModel,
    likes: RecordCommentLikeDataModel[],
  ): RecordComment {
    return {
      commentId: data.id as CommentId,
      recordId: data.recordId as RecordId,
      appId: data.appId as AppId,
      text: data.text,
      mentions: (data.mentions as unknown as Mention[]) ?? [],
      likes: new Set(likes.map((like) => like.userId as UserId)),
      creatorId: data.creatorId as UserId,
      createdAt: data.createdAt,
    };
  }

  async findByRecordId(
    appId: AppId,
    recordId: RecordId,
    order: "asc" | "desc" = "desc",
    offset = 0,
    limit: number = DEFAULT_COMMENT_LIMIT,
  ): Promise<CommentListResult> {
    const effectiveLimit = Math.min(limit, MAX_COMMENT_LIMIT);

    try {
      const orderFn = order === "asc" ? asc : desc;

      // Fetch one extra to determine if there are more comments
      const commentRows = await this.executor
        .select()
        .from(recordComments)
        .where(
          and(
            eq(recordComments.appId, appId as string),
            eq(recordComments.recordId, recordId as string),
          ),
        )
        .orderBy(orderFn(recordComments.createdAt))
        .limit(effectiveLimit + 1)
        .offset(offset);

      const hasMore = commentRows.length > effectiveLimit;
      const trimmedRows = hasMore
        ? commentRows.slice(0, effectiveLimit)
        : commentRows;

      // Fetch likes for all comments
      const comments: RecordComment[] = [];
      for (const row of trimmedRows) {
        const likes = await this.executor
          .select()
          .from(recordCommentLikes)
          .where(eq(recordCommentLikes.commentId, row.id));
        comments.push(this.into(row, likes));
      }

      const older = order === "desc" ? hasMore : offset > 0;
      const newer = order === "desc" ? offset > 0 : hasMore;

      return {
        comments,
        older,
        newer,
      };
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find comments by record ID",
        error,
      );
    }
  }

  async findById(commentId: CommentId): Promise<RecordComment | null> {
    try {
      const results = await this.executor
        .select()
        .from(recordComments)
        .where(eq(recordComments.id, commentId as string));

      if (results.length === 0) {
        return null;
      }

      const likes = await this.executor
        .select()
        .from(recordCommentLikes)
        .where(eq(recordCommentLikes.commentId, commentId as string));

      return this.into(results[0], likes);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find comment by ID",
        error,
      );
    }
  }

  async save(comment: RecordComment): Promise<RecordComment> {
    try {
      const values = {
        id: comment.commentId as string,
        recordId: comment.recordId as string,
        appId: comment.appId as string,
        text: comment.text,
        mentions: [...comment.mentions] as unknown,
        creatorId: comment.creatorId as string,
        likeCount: comment.likes.size,
        createdAt: comment.createdAt,
      };

      await this.executor
        .insert(recordComments)
        .values(values)
        .onConflictDoUpdate({
          target: recordComments.id,
          set: {
            likeCount: values.likeCount,
          },
        });

      // Sync likes: delete all and re-insert
      await this.executor
        .delete(recordCommentLikes)
        .where(eq(recordCommentLikes.commentId, comment.commentId as string));

      for (const userId of comment.likes) {
        await this.executor.insert(recordCommentLikes).values({
          commentId: comment.commentId as string,
          userId: userId as string,
        });
      }

      return comment;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save comment",
        error,
      );
    }
  }

  async delete(commentId: CommentId): Promise<void> {
    try {
      await this.executor
        .delete(recordComments)
        .where(eq(recordComments.id, commentId as string));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete comment",
        error,
      );
    }
  }
}
