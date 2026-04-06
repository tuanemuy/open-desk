import type { AppId } from "@/core/domain/app/valueObject";
import type { RecordHistory } from "@/core/domain/record/entity";
import type { RecordId as RecordIdType } from "@/core/domain/record/valueObject";

/**
 * Repository port for RecordHistory entity persistence.
 */
export interface RecordHistoryRepository {
  /**
   * Find change history entries for a record, ordered by newest version first.
   * @returns Array of history entries in descending version order
   */
  findByRecordId(
    appId: AppId,
    recordId: RecordIdType,
  ): Promise<RecordHistory[]>;

  /**
   * Find a specific version of a record's change history.
   * @returns The history entry, or null if not found
   */
  findByVersion(
    appId: AppId,
    recordId: RecordIdType,
    version: number,
  ): Promise<RecordHistory | null>;

  /**
   * Save a history entry (insert only; history entries are immutable).
   */
  save(history: RecordHistory): Promise<RecordHistory>;
}
