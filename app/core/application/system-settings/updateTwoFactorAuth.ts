import { NotFoundError, NotFoundErrorCode } from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { SystemSetting } from "@/core/domain/system-settings/entity";
import type { TwoFactorAuth } from "@/core/domain/system-settings/valueObject";
import type { TwoFactorAuthOutput } from "./dto";

export type UpdateTwoFactorAuthInput = {
  enabled: boolean;
};

export async function updateTwoFactorAuth({
  container,
  input,
}: ServiceArgs<UpdateTwoFactorAuthInput>): Promise<TwoFactorAuthOutput> {
  const twoFactorAuth: TwoFactorAuth = {
    enabled: input.enabled,
  };

  const setting = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.systemSettingsRepository.findByKey("two_factor_auth");
    },
  );

  if (!setting) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      'Setting "two_factor_auth" not found',
    );
  }

  const updated = SystemSetting.updateValue(setting, twoFactorAuth);

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.systemSettingsRepository.save(updated);
  });

  return twoFactorAuth;
}
