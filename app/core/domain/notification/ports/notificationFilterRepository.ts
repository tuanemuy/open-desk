import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import type { NotificationFilter } from "@/core/domain/notification/entity";
import type { NotificationFilterId as NotificationFilterIdType } from "@/core/domain/notification/valueObject";

/**
 * Repository port for NotificationFilter entity persistence.
 */
export interface NotificationFilterRepository {
  /**
   * Find a filter by its unique identifier.
   * @returns The filter, or null if not found.
   */
  findById(
    filterId: NotificationFilterIdType,
  ): Promise<NotificationFilter | null>;

  /**
   * Find all filters for the specified user, ordered by createdAt ascending.
   * Includes both built-in and custom filters.
   *
   * @param userId The filter owner's user ID
   * @returns The list of filters
   */
  findByUserId(userId: UserIdType): Promise<NotificationFilter[]>;

  /**
   * Save a filter (insert or update).
   * @returns The saved filter
   */
  save(filter: NotificationFilter): Promise<NotificationFilter>;

  /**
   * Delete a filter by its unique identifier.
   * @param filterId The filter ID to delete
   */
  delete(filterId: NotificationFilterIdType): Promise<void>;
}
