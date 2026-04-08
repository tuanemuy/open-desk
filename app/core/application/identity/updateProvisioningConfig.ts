import type { ServiceArgs } from "@/core/application/types";
import { ProvisioningConfig } from "@/core/domain/identity/entity";
import type { UpdateProvisioningConfigOutput } from "./dto";

export type UpdateProvisioningConfigInput = {
  isEnabled?: boolean;
  regenerateToken?: boolean;
};

export async function updateProvisioningConfig({
  container,
  input,
}: ServiceArgs<UpdateProvisioningConfigInput>): Promise<UpdateProvisioningConfigOutput> {
  let config = await container.unitOfWorkProvider.transaction(async (ctx) => {
    return ctx.provisioningConfigRepository.find();
  });

  let generatedToken: string | null = null;

  if (input.regenerateToken === true) {
    const token = container.bearerTokenHasher.generate();
    const hashedToken = container.bearerTokenHasher.hash(token);
    const { entity: updatedConfig } = ProvisioningConfig.setToken(
      config,
      hashedToken,
      new Date(),
    );
    config = updatedConfig;
    generatedToken = token;
  }

  if (input.isEnabled !== undefined) {
    if (input.isEnabled) {
      const { entity: enabledConfig } = ProvisioningConfig.enable(config);
      config = enabledConfig;
    } else {
      const { entity: disabledConfig } = ProvisioningConfig.disable(config);
      config = disabledConfig;
    }
  }

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.provisioningConfigRepository.save(config);
  });

  return {
    isEnabled: config.isEnabled,
    hasToken: config.bearerTokenHash !== null,
    tokenIssuedAt: config.tokenIssuedAt,
    updatedAt: config.updatedAt,
    generatedToken,
  };
}
