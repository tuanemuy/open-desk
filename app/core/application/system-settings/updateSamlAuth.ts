import { NotFoundError, NotFoundErrorCode } from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { SystemSetting } from "@/core/domain/system-settings/entity";
import type { SamlAuth } from "@/core/domain/system-settings/valueObject";
import type { SamlAuthOutput } from "./dto";

export type UpdateSamlAuthInput = {
  enabled: boolean;
};

export async function updateSamlAuth({
  container,
  input,
}: ServiceArgs<UpdateSamlAuthInput>): Promise<SamlAuthOutput> {
  const samlAuth: SamlAuth = {
    enabled: input.enabled,
  };

  const setting = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.systemSettingsRepository.findByKey("saml_auth");
    },
  );

  if (!setting) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      'Setting "saml_auth" not found',
    );
  }

  const updated = SystemSetting.updateValue(setting, samlAuth);

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.systemSettingsRepository.save(updated);
  });

  return samlAuth;
}
