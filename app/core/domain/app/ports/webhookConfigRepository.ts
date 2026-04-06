import type { WebhookConfig } from "../entity";
import type { AppId, WebhookId } from "../valueObject";

export interface WebhookConfigRepository {
  findById(webhookId: WebhookId): Promise<WebhookConfig | null>;
  findByAppId(appId: AppId): Promise<readonly WebhookConfig[]>;
  save(config: WebhookConfig): Promise<void>;
  delete(webhookId: WebhookId): Promise<void>;
  countByAppId(appId: AppId): Promise<number>;
}
