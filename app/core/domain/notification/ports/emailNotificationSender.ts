import type { Notification } from "@/core/domain/notification/entity";
import type { EmailNotificationFormat as EmailNotificationFormatType } from "@/core/domain/notification/valueObject";

/**
 * Port interface for sending email notifications.
 */
export interface EmailNotificationSender {
  /**
   * Send a notification via email.
   *
   * @param notification The notification to send
   * @param recipientEmail The recipient's email address
   * @param format The email format (HTML or TEXT)
   */
  send(
    notification: Notification,
    recipientEmail: string,
    format: EmailNotificationFormatType,
  ): Promise<void>;

  /**
   * Send multiple notification emails in batch.
   *
   * @param items The list of items to send
   */
  sendBatch(
    items: ReadonlyArray<{
      notification: Notification;
      recipientEmail: string;
      format: EmailNotificationFormatType;
    }>,
  ): Promise<void>;
}
