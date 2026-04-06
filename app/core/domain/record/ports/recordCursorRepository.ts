import type { AppId } from "@/core/domain/app/valueObject";
import type { RecordCursor } from "@/core/domain/record/entity";
import type {
  CursorId as CursorIdType,
  FieldCode as FieldCodeType,
} from "@/core/domain/record/valueObject";

/**
 * Repository port for RecordCursor entity persistence.
 */
export interface RecordCursorRepository {
  /**
   * Create a new cursor for batch record retrieval.
   * @throws CursorLimitExceededError if the domain already has 10 active cursors
   * @throws CursorCreationTimeoutError if cursor creation does not complete within 5 minutes
   */
  create(
    appId: AppId,
    query: string | null,
    fields: readonly FieldCodeType[],
    size: number,
  ): Promise<RecordCursor>;

  /**
   * Find a cursor by its ID.
   * @returns The cursor, or null if not found or expired
   */
  findById(cursorId: CursorIdType): Promise<RecordCursor | null>;

  /**
   * Delete a cursor. Called automatically after all records are retrieved.
   */
  delete(cursorId: CursorIdType): Promise<void>;

  /**
   * Count the number of active cursors in the current domain.
   * Used for limit checking when creating new cursors.
   */
  countByDomain(): Promise<number>;
}
