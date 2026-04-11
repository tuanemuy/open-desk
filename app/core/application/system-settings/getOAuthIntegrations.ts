import type { ServiceArgs } from "@/core/application/types";
import { SystemSetting } from "@/core/domain/system-settings/entity";
import type { OAuthIntegrations } from "@/core/domain/system-settings/valueObject";
import type { OAuthIntegrationsOutput } from "./dto";

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

export async function getOAuthIntegrations({
  container,
}: ServiceArgs): Promise<OAuthIntegrationsOutput> {
  const setting = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.systemSettingsRepository.findByKey("oauth_integrations");
    },
  );

  if (!setting) {
    return DEFAULT_OAUTH_INTEGRATIONS;
  }

  return SystemSetting.getTypedValue(setting, "oauth_integrations");
}
