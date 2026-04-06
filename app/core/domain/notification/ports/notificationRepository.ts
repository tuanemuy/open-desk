import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import type { Notification } from "@/core/domain/notification/entity";
import type {
  NotificationId as NotificationIdType,
  NotificationType as NotificationTypeType,
} from "@/core/domain/notification/valueObject";

/**
 * Repository port for Notification entity persistence.
 */
export interface NotificationRepository {
  /**
   * Find a notification by its unique identifier.
   * @returns The notification, or null if not found.
   */
  findById(notificationId: NotificationIdType): Promise<Notification | null>;

  /**
   * Find notifications by recipient user ID with filtering and pagination.
   * Supports filtering by read status, read later flag, and notification type.
   *
   * @param recipientId The recipient user ID
   * @param params Search parameters
   * @returns Notifications and total count
   */
  findByRecipientId(
    recipientId: UserIdType,
    params: {
      isRead?: boolean;
      isReadLater?: boolean;
      notificationType?: NotificationTypeType;
      offset: number;
      limit: number;
    },
  ): Promise<{ notifications: Notification[]; totalCount: number }>;

  /**
   * Save a notification (insert or update).
   */
  save(notification: Notification): Promise<Notification>;

  /**
   * Save multiple notifications in batch (used during notification generation).
   * @param notifications The notifications to save
   * @returns The saved notifications
   */
  saveBatch(notifications: Notification[]): Promise<Notification[]>;

  /**
   * Delete a notification.
   * @param notificationId The notification ID to delete
   */
  delete(notificationId: NotificationIdType): Promise<void>;

  /**
   * Mark multiple notifications as read in batch.
   * If notificationIds is omitted, all unread notifications for the recipient are marked as read.
   *
   * @param recipientId The recipient user ID
   * @param notificationIds Optional list of specific notification IDs to mark as read
   * @returns The number of notifications marked as read
   */
  markAsReadBatch(
    recipientId: UserIdType,
    notificationIds?: NotificationIdType[],
  ): Promise<number>;

  /**
   * Count unread notifications for a recipient.
   * Used for the header badge display.
   *
   * @param recipientId The recipient user ID
   * @returns The unread notification count
   */
  countUnread(recipientId: UserIdType): Promise<number>;

  /**
   * Delete expired notifications in batch (for maintenance).
   * @param before Delete notifications created before this date
   * @returns The number of deleted notifications
   */
  deleteExpired(before: Date): Promise<number>;
}
