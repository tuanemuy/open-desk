import { NotFoundError, NotFoundErrorCode } from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { SystemSetting } from "@/core/domain/system-settings/entity";
import type { JsCssCustomizationOutput } from "./dto";

export async function getJsCssCustomization({
  container,
}: ServiceArgs): Promise<JsCssCustomizationOutput> {
  const setting = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.systemSettingsRepository.findByKey("js_css_customization");
    },
  );

  if (!setting) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      'Setting "js_css_customization" not found',
    );
  }

  return SystemSetting.getTypedValue(setting, "js_css_customization");
}
