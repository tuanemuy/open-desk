import { NotFoundError, NotFoundErrorCode } from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { SystemSetting } from "@/core/domain/system-settings/entity";
import type { LocaleOutput } from "./dto";

export async function getLocale({
  container,
}: ServiceArgs): Promise<LocaleOutput> {
  const setting = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.systemSettingsRepository.findByKey("locale");
    },
  );

  if (!setting) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      'Setting "locale" not found',
    );
  }

  return SystemSetting.getTypedValue(setting, "locale");
}
