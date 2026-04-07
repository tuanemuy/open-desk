import { WebhookConfig } from "@/core/domain/app/entity";
import { AppErrorCode } from "@/core/domain/app/errorCode";
import type { WebhookEvent } from "@/core/domain/app/valueObject";
import {
  AppId,
  AppStatus,
  WebhookId,
  WebhookUrl,
} from "@/core/domain/app/valueObject";
import { BusinessRuleError } from "@/core/domain/error";
import { UserId } from "@/core/domain/identity/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { ConfigureWebhookOutput } from "./dto";

const MAX_WEBHOOKS_PER_APP = 10;

export type ConfigureWebhookInput = {
  appId: string;
  webhookId: string | null;
  url: string;
  description: string;
  events: WebhookEvent[];
  isActive: boolean;
  executorId: string;
};

export async function configureWebhook({
  container,
  input,
}: ServiceArgs<ConfigureWebhookInput>): Promise<ConfigureWebhookOutput> {
  const appId = AppId.create(input.appId);
  const _executorId = UserId.create(input.executorId);
  const url = WebhookUrl.create(input.url);

  return await container.unitOfWorkProvider.transaction(async (repos) => {
    const app = await repos.appRepository.findById(appId);
    if (app === null) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `App ${input.appId} not found`,
      );
    }
    if (AppStatus.isDeleted(app.status)) {
      throw new BusinessRuleError(
        AppErrorCode.DeletedAppModification,
        "Cannot modify a deleted app",
      );
    }

    let webhook: ReturnType<typeof WebhookConfig.create>;

    if (input.webhookId === null) {
      // Create new webhook
      const webhookCount =
        await repos.webhookConfigRepository.countByAppId(appId);
      if (webhookCount >= MAX_WEBHOOKS_PER_APP) {
        throw new BusinessRuleError(
          AppErrorCode.EmptyWebhookEvents,
          `Cannot create more than ${MAX_WEBHOOKS_PER_APP} webhooks per app`,
        );
      }
      webhook = WebhookConfig.create({
        appId,
        url,
        description: input.description,
        events: input.events,
      });
    } else {
      // Update existing webhook
      const webhookId = WebhookId.create(input.webhookId);
      const existing = await repos.webhookConfigRepository.findById(webhookId);
      if (existing === null) {
        throw new NotFoundError(
          NotFoundErrorCode.NotFound,
          `Webhook ${input.webhookId} not found`,
        );
      }
      webhook = WebhookConfig.setUrl(existing, url);
      webhook = WebhookConfig.setDescription(webhook, input.description);
      webhook = WebhookConfig.setEvents(webhook, input.events);
      webhook = input.isActive
        ? WebhookConfig.activate(webhook)
        : WebhookConfig.deactivate(webhook);
    }

    await repos.webhookConfigRepository.save(webhook);

    return {
      webhookId: webhook.webhookId,
      url: webhook.url,
      events: [...webhook.events],
      isActive: webhook.isActive,
    };
  });
}
