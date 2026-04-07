import type { InferSelectModel } from "drizzle-orm";
import { count, eq } from "drizzle-orm";
import { webhookConfigs } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { WebhookConfig } from "@/core/domain/app/entity";
import type { WebhookConfigRepository } from "@/core/domain/app/ports/webhookConfigRepository";
import type {
  AppId as AppIdType,
  WebhookEvent as WebhookEventType,
  WebhookId as WebhookIdType,
  WebhookUrl as WebhookUrlType,
} from "@/core/domain/app/valueObject";
import type { Executor } from "../client";

type WebhookConfigDataModel = InferSelectModel<typeof webhookConfigs>;

export class DrizzleSqliteWebhookConfigRepository
  implements WebhookConfigRepository
{
  constructor(private readonly executor: Executor) {}

  private into(data: WebhookConfigDataModel): WebhookConfig {
    return {
      webhookId: data.id as WebhookIdType,
      appId: data.appId as AppIdType,
      url: data.url as WebhookUrlType,
      description: data.description,
      events: data.events as unknown as readonly WebhookEventType[],
      isActive: data.isActive,
    };
  }

  async findById(webhookId: WebhookIdType): Promise<WebhookConfig | null> {
    try {
      const results = await this.executor
        .select()
        .from(webhookConfigs)
        .where(eq(webhookConfigs.id, webhookId))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find webhook config by id",
        error,
      );
    }
  }

  async findByAppId(appId: AppIdType): Promise<readonly WebhookConfig[]> {
    try {
      const results = await this.executor
        .select()
        .from(webhookConfigs)
        .where(eq(webhookConfigs.appId, appId));

      return results.map((r) => this.into(r));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find webhook configs by app id",
        error,
      );
    }
  }

  async save(config: WebhookConfig): Promise<void> {
    try {
      await this.executor
        .insert(webhookConfigs)
        .values({
          id: config.webhookId,
          appId: config.appId,
          url: config.url,
          description: config.description,
          events: config.events as unknown as Record<string, unknown>[],
          isActive: config.isActive,
        })
        .onConflictDoUpdate({
          target: webhookConfigs.id,
          set: {
            appId: config.appId,
            url: config.url,
            description: config.description,
            events: config.events as unknown as Record<string, unknown>[],
            isActive: config.isActive,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save webhook config",
        error,
      );
    }
  }

  async delete(webhookId: WebhookIdType): Promise<void> {
    try {
      await this.executor
        .delete(webhookConfigs)
        .where(eq(webhookConfigs.id, webhookId));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete webhook config",
        error,
      );
    }
  }

  async countByAppId(appId: AppIdType): Promise<number> {
    try {
      const results = await this.executor
        .select({ count: count() })
        .from(webhookConfigs)
        .where(eq(webhookConfigs.appId, appId));

      return results[0]?.count ?? 0;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to count webhook configs by app id",
        error,
      );
    }
  }
}
