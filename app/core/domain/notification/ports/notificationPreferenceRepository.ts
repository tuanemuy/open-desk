import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import type { NotificationPreference } from "@/core/domain/notification/entity";

/**
 * Repository port for NotificationPreference entity persistence.
 */
export interface NotificationPreferenceRepository {
  /**
   * Find the notification preference for the specified user.
   * @returns The preference, or null if not found
   *          (normally not null since it is auto-created on user creation).
   */
  findByUserId(userId: UserIdType): Promise<NotificationPreference | null>;

  /**
   * Save a notification preference (insert or update).
   * @returns The saved preference
   */
  save(preference: NotificationPreference): Promise<NotificationPreference>;

  /**
   * Delete a notification preference (used on user account deletion).
   * @param userId The user ID whose preference to delete
   */
  delete(userId: UserIdType): Promise<void>;
}
