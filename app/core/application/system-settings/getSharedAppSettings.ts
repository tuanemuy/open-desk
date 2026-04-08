import { NotFoundError, NotFoundErrorCode } from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { SystemSetting } from "@/core/domain/system-settings/entity";
import type { SharedAppSettingsOutput } from "./dto";

export async function getSharedAppSettings({
  container,
}: ServiceArgs): Promise<SharedAppSettingsOutput> {
  const setting = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.systemSettingsRepository.findByKey("shared_app_settings");
    },
  );

  if (!setting) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      'Setting "shared_app_settings" not found',
    );
  }

  return SystemSetting.getTypedValue(setting, "shared_app_settings");
}
