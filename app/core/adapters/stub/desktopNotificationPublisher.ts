import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import type { Notification } from "@/core/domain/notification/entity";
import type { DesktopNotificationPublisher } from "@/core/domain/notification/ports/desktopNotificationPublisher";
import { StubNotImplementedError } from "./error";

export class StubDesktopNotificationPublisher
  implements DesktopNotificationPublisher
{
  publish(
    _recipientId: UserIdType,
    _notification: Notification,
  ): Promise<void> {
    throw new StubNotImplementedError("DesktopNotificationPublisher");
  }
}
