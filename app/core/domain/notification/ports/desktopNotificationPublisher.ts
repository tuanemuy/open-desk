import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import type { Notification } from "@/core/domain/notification/entity";

/**
 * Port interface for publishing desktop notifications (Web Push).
 * The actual display is handled by the browser-side Service Worker.
 */
export interface DesktopNotificationPublisher {
  /**
   * Publish a desktop notification for the specified recipient.
   *
   * @param recipientId The recipient user ID
   * @param notification The notification content
   */
  publish(recipientId: UserIdType, notification: Notification): Promise<void>;
}
