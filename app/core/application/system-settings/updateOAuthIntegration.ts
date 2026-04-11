import { NotFoundError, NotFoundErrorCode } from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { SystemSetting } from "@/core/domain/system-settings/entity";
import type { OAuthIntegrations } from "@/core/domain/system-settings/valueObject";
import type { OAuthIntegrationsOutput } from "./dto";

export type UpdateOAuthIntegrationInput = {
  integrationId: string;
  enabled: boolean;
};

const DEFAULT_OAUTH_INTEGRATIONS: OAuthIntegrations = {
  items: [
    {
      id: "power-automate",
      name: "Microsoft Power Automate",
      description: "Power Automateとの連携を有効にします",
      enabled: false,
    },
    {
      id: "slack",
      name: "Slack",
      description: "Slackとの連携を有効にします",
      enabled: false,
    },
  ],
};

export async function updateOAuthIntegration({
  container,
  input,
}: ServiceArgs<UpdateOAuthIntegrationInput>): Promise<OAuthIntegrationsOutput> {
  const existing = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.systemSettingsRepository.findByKey("oauth_integrations");
    },
  );

  const current: OAuthIntegrations = existing
    ? SystemSetting.getTypedValue(existing, "oauth_integrations")
    : DEFAULT_OAUTH_INTEGRATIONS;

  const targetItem = current.items.find(
    (item) => item.id === input.integrationId,
  );
  if (!targetItem) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      `OAuth integration "${input.integrationId}" not found`,
    );
  }

  const updatedItems = current.items.map((item) =>
    item.id === input.integrationId
      ? { ...item, enabled: input.enabled }
      : item,
  );

  const updatedValue: OAuthIntegrations = { items: updatedItems };

  if (existing) {
    const updatedSetting = SystemSetting.updateValue(existing, updatedValue);
    await container.unitOfWorkProvider.transaction(async (ctx) => {
      await ctx.systemSettingsRepository.save(updatedSetting);
    });
  } else {
    const newSetting = SystemSetting.create({
      key: "oauth_integrations",
      value: updatedValue,
    });
    await container.unitOfWorkProvider.transaction(async (ctx) => {
      await ctx.systemSettingsRepository.save(newSetting);
    });
  }

  return updatedValue;
}
