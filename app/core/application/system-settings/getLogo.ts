import { NotFoundError, NotFoundErrorCode } from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { SystemSetting } from "@/core/domain/system-settings/entity";
import type { LogoOutput } from "./dto";

export async function getLogo({ container }: ServiceArgs): Promise<LogoOutput> {
  const setting = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.systemSettingsRepository.findByKey("logo");
    },
  );

  if (!setting) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      'Setting "logo" not found',
    );
  }

  return SystemSetting.getTypedValue(setting, "logo");
}
