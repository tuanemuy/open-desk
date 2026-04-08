import type { AuditLog } from "@/core/domain/audit/entity";
import type {
  AuditFilter as AuditFilterType,
  AuditLogId as AuditLogIdType,
} from "@/core/domain/audit/valueObject";

/**
 * Repository port for AuditLog entity persistence and querying.
 */
export interface AuditLogRepository {
  /**
   * Find an audit log by its unique identifier.
   * @returns The audit log, or null if not found.
   */
  findById(auditLogId: AuditLogIdType): Promise<AuditLog | null>;

  /**
   * Find audit logs matching the given filter conditions (descending by timestamp).
   * Only logs within the retention period (< 6 weeks) are included.
   * @returns Matching audit logs and the total count.
   */
  findByFilter(
    filter: AuditFilterType,
    limit: number,
    offset: number,
  ): Promise<{ logs: AuditLog[]; totalCount: number }>;

  /**
   * Find audit logs matching the given filter for CSV export (descending by timestamp).
   * Returns up to 100,000 records.
   */
  findForExport(filter: AuditFilterType): Promise<AuditLog[]>;

  /**
   * Save an audit log (insert only -- audit logs are immutable).
   */
  save(auditLog: AuditLog): Promise<void>;

  /**
   * Delete audit logs that have exceeded the retention period.
   * @param retentionWeeks Retention period in weeks.
   * @returns The number of deleted records.
   */
  deleteExpired(retentionWeeks: number): Promise<number>;
}
