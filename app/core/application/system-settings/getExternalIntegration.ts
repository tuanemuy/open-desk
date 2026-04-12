import { NotFoundError, NotFoundErrorCode } from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { SystemSetting } from "@/core/domain/system-settings/entity";
import type { ExternalIntegrationOutput } from "./dto";

export async function getExternalIntegration({
  container,
}: ServiceArgs): Promise<ExternalIntegrationOutput> {
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

  return SystemSetting.getTypedValue(setting, "external_integration");
}
