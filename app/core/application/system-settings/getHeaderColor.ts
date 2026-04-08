import { NotFoundError, NotFoundErrorCode } from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { SystemSetting } from "@/core/domain/system-settings/entity";
import type { HeaderColorOutput } from "./dto";

export async function getHeaderColor({
  container,
}: ServiceArgs): Promise<HeaderColorOutput> {
  const setting = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.systemSettingsRepository.findByKey("header_color");
    },
  );

  if (!setting) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      'Setting "header_color" not found',
    );
  }

  const value = SystemSetting.getTypedValue(setting, "header_color");
  return { hex: value.hex };
}
