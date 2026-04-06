import type { AppId } from "@/core/domain/app/valueObject";
import type { Record } from "@/core/domain/record/entity";
import type {
  FieldCode as FieldCodeType,
  RecordId as RecordIdType,
  RecordQuery,
} from "@/core/domain/record/valueObject";

/**
 * Repository port for Record entity persistence.
 */
export interface RecordRepository {
  /**
   * Find a record by app ID and record ID.
   * @returns The record, or null if not found
   */
  findById(appId: AppId, recordId: RecordIdType): Promise<Record | null>;

  /**
   * Find records matching a query condition.
   * @param appId - App ID
   * @param query - Query condition (filter, sort, limit, offset)
   * @param fields - Field codes to retrieve (all fields if omitted)
   * @param totalCount - If true, also count and return total matching records
   * @returns Array of records and optional total count
   */
  findByQuery(
    appId: AppId,
    query: RecordQuery,
    fields?: readonly FieldCodeType[],
    totalCount?: boolean,
  ): Promise<{ records: Record[]; totalCount: number | null }>;

  /**
   * Save a single record (insert or update).
   * @returns The saved record with confirmed ID and revision
   */
  save(record: Record): Promise<Record>;

  /**
   * Save multiple records in a batch. Maximum 100 records.
   * Processed within a transaction; rolls back all on any failure.
   */
  saveBatch(records: readonly Record[]): Promise<Record[]>;

  /**
   * Delete multiple records in a batch. Maximum 100 records.
   * Processed within a transaction; rolls back all on any failure.
   */
  delete(appId: AppId, recordIds: readonly RecordIdType[]): Promise<void>;

  /**
   * Count records matching a query condition.
   * @param query - If omitted, counts all records in the app
   */
  count(appId: AppId, query?: RecordQuery): Promise<number>;
}
