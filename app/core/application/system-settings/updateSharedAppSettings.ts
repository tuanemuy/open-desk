import { NotFoundError, NotFoundErrorCode } from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { SystemSetting } from "@/core/domain/system-settings/entity";
import type { SharedAppSettings } from "@/core/domain/system-settings/valueObject";
import type { SharedAppSettingsOutput } from "./dto";

export type UpdateSharedAppSettingsInput = {
  prohibitEveryoneAdmin: boolean;
};

export async function updateSharedAppSettings({
  container,
  input,
}: ServiceArgs<UpdateSharedAppSettingsInput>): Promise<SharedAppSettingsOutput> {
  const sharedAppSettings: SharedAppSettings = {
    prohibitEveryoneAdmin: input.prohibitEveryoneAdmin,
  };

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

  const updated = SystemSetting.updateValue(setting, sharedAppSettings);

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.systemSettingsRepository.save(updated);
  });

  return sharedAppSettings;
}
