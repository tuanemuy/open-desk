import type { AppId } from "@/core/domain/app/valueObject";
import type { RecordComment } from "@/core/domain/record/entity";
import type {
  CommentId as CommentIdType,
  RecordId as RecordIdType,
} from "@/core/domain/record/valueObject";

/**
 * Result of a paginated comment listing.
 */
export type CommentListResult = {
  readonly comments: readonly RecordComment[];
  readonly older: boolean;
  readonly newer: boolean;
};

/**
 * Repository port for RecordComment entity persistence.
 */
export interface RecordCommentRepository {
  /**
   * Find comments for a record with pagination.
   * @param appId - App ID
   * @param recordId - Record ID
   * @param order - Sort order ("asc" | "desc", default "desc")
   * @param offset - Number of comments to skip (default 0)
   * @param limit - Maximum number of comments to return (max 10, default 10)
   * @returns Comments and flags indicating if older/newer comments exist
   */
  findByRecordId(
    appId: AppId,
    recordId: RecordIdType,
    order?: "asc" | "desc",
    offset?: number,
    limit?: number,
  ): Promise<CommentListResult>;

  /**
   * Find a single comment by its ID.
   * @returns The comment, or null if not found
   */
  findById(commentId: CommentIdType): Promise<RecordComment | null>;

  /**
   * Save a comment (insert only; comments cannot be updated).
   * @returns The saved comment with confirmed ID
   */
  save(comment: RecordComment): Promise<RecordComment>;

  /**
   * Delete a comment.
   */
  delete(commentId: CommentIdType): Promise<void>;
}
