import { NotFoundError, NotFoundErrorCode } from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { SystemSetting } from "@/core/domain/system-settings/entity";
import type { SystemMailOutput } from "./dto";

export async function getSystemMail({
  container,
}: ServiceArgs): Promise<SystemMailOutput> {
  const setting = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.systemSettingsRepository.findByKey("system_mail");
    },
  );

  if (!setting) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      'Setting "system_mail" not found',
    );
  }

  return SystemSetting.getTypedValue(setting, "system_mail");
}
