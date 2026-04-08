import { NotFoundError, NotFoundErrorCode } from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { SystemSetting } from "@/core/domain/system-settings/entity";
import type { ExternalIntegration } from "@/core/domain/system-settings/valueObject";
import type { ExternalIntegrationOutput } from "./dto";

export type UpdateExternalIntegrationInput = {
  allowIframe: boolean;
  referrerPolicySameOrigin: boolean;
  allowWebhook: boolean;
};

export async function updateExternalIntegration({
  container,
  input,
}: ServiceArgs<UpdateExternalIntegrationInput>): Promise<ExternalIntegrationOutput> {
  const externalIntegration: ExternalIntegration = {
    allowIframe: input.allowIframe,
    referrerPolicySameOrigin: input.referrerPolicySameOrigin,
    allowWebhook: input.allowWebhook,
  };

  const setting = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.systemSettingsRepository.findByKey("external_integration");
    },
  );

  if (!setting) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      'Setting "external_integration" not found',
    );
  }

  const updated = SystemSetting.updateValue(setting, externalIntegration);

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.systemSettingsRepository.save(updated);
  });

  return externalIntegration;
}
