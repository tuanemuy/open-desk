import type { UserAccessUsage } from "@/core/domain/audit/entity";
import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";

/**
 * Repository port for UserAccessUsage entity persistence and querying.
 */
export interface UserAccessUsageRepository {
  /**
   * Find user access usage by user ID.
   * @returns The user access usage, or null if not found.
   */
  findByUserId(userId: UserIdType): Promise<UserAccessUsage | null>;

  /**
   * Find all user access usages ordered by user name.
   */
  findAll(): Promise<UserAccessUsage[]>;

  /**
   * Find all user access usages for CSV export ordered by user name.
   */
  findAllForExport(): Promise<UserAccessUsage[]>;

  /**
   * Save a user access usage (insert or update).
   */
  save(usage: UserAccessUsage): Promise<void>;

  /**
   * Delete user access usage by user ID.
   */
  deleteByUserId(userId: UserIdType): Promise<void>;

  /**
   * Find access dates within the last 30 days for a specific user.
   * Used for recalculating accessDaysLast30.
   * @returns Array of dates the user accessed within the last 30 days.
   */
  findAccessDatesLast30Days(userId: UserIdType): Promise<Date[]>;
}
