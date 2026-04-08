import { NotFoundError, NotFoundErrorCode } from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { SystemSetting } from "@/core/domain/system-settings/entity";
import type { GuestAuth } from "@/core/domain/system-settings/valueObject";
import type { GuestAuthOutput } from "./dto";

export type UpdateGuestAuthInput = {
  twoFactorEnabled: boolean;
};

export async function updateGuestAuth({
  container,
  input,
}: ServiceArgs<UpdateGuestAuthInput>): Promise<GuestAuthOutput> {
  const guestAuth: GuestAuth = {
    twoFactorEnabled: input.twoFactorEnabled,
  };

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

  const updated = SystemSetting.updateValue(setting, guestAuth);

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.systemSettingsRepository.save(updated);
  });

  return guestAuth;
}
