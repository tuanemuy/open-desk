import type { Notification } from "@/core/domain/notification/entity";
import type { EmailNotificationSender } from "@/core/domain/notification/ports/emailNotificationSender";
import type { EmailNotificationFormat as EmailNotificationFormatType } from "@/core/domain/notification/valueObject";
import { StubNotImplementedError } from "./error";

export class StubEmailNotificationSender implements EmailNotificationSender {
  send(
    _notification: Notification,
    _recipientEmail: string,
    _format: EmailNotificationFormatType,
  ): Promise<void> {
    throw new StubNotImplementedError("EmailNotificationSender");
  }

  sendBatch(
    _items: ReadonlyArray<{
      notification: Notification;
      recipientEmail: string;
      format: EmailNotificationFormatType;
    }>,
  ): Promise<void> {
    throw new StubNotImplementedError("EmailNotificationSender");
  }
}
