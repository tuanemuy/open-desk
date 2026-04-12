import { NotFoundError, NotFoundErrorCode } from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { SystemSetting } from "@/core/domain/system-settings/entity";
import type { GuestAuthOutput } from "./dto";

export async function getGuestAuth({
  container,
}: ServiceArgs): Promise<GuestAuthOutput> {
  const setting = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.systemSettingsRepository.findByKey("guest_auth");
    },
  );

  if (!setting) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      'Setting "guest_auth" not found',
    );
  }

  return SystemSetting.getTypedValue(setting, "guest_auth");
}
