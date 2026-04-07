import type { NotificationSourceResolver } from "@/core/domain/notification/ports/notificationSourceResolver";
import type {
  NotificationSource as NotificationSourceType,
  SourceType as SourceTypeType,
} from "@/core/domain/notification/valueObject";

export class StubNotificationSourceResolver
  implements NotificationSourceResolver
{
  resolve(
    _sourceType: SourceTypeType,
    _sourceId: string,
  ): Promise<NotificationSourceType | null> {
    throw new Error("Not implemented");
  }
}
