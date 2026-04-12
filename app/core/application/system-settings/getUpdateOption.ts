import { NotFoundError, NotFoundErrorCode } from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { SystemSetting } from "@/core/domain/system-settings/entity";
import type { UpdateOptionOutput } from "./dto";

export async function getUpdateOption({
  container,
}: ServiceArgs): Promise<UpdateOptionOutput> {
  const setting = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.systemSettingsRepository.findByKey("update_option");
    },
  );

  if (!setting) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      'Setting "update_option" not found',
    );
  }

  return SystemSetting.getTypedValue(setting, "update_option");
}
