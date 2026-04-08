import { NotFoundError, NotFoundErrorCode } from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { SystemSetting } from "@/core/domain/system-settings/entity";
import type { LoginPageOutput } from "./dto";

export async function getLoginPage({
  container,
}: ServiceArgs): Promise<LoginPageOutput> {
  const setting = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.systemSettingsRepository.findByKey("login_page");
    },
  );

  if (!setting) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      'Setting "login_page" not found',
    );
  }

  return SystemSetting.getTypedValue(setting, "login_page");
}
