import type { AppNotificationConfig } from "../entity";
import type { AppId } from "../valueObject";

export interface AppNotificationConfigRepository {
  findByAppId(appId: AppId): Promise<AppNotificationConfig | null>;
  save(config: AppNotificationConfig): Promise<void>;
}
