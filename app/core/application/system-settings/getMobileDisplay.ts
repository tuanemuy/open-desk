import { NotFoundError, NotFoundErrorCode } from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { SystemSetting } from "@/core/domain/system-settings/entity";
import type { MobileDisplayOutput } from "./dto";

export async function getMobileDisplay({
  container,
}: ServiceArgs): Promise<MobileDisplayOutput> {
  const setting = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.systemSettingsRepository.findByKey("mobile_display");
    },
  );

  if (!setting) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      'Setting "mobile_display" not found',
    );
  }

  return SystemSetting.getTypedValue(setting, "mobile_display");
}
