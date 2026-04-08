import type { ServiceArgs } from "@/core/application/types";
import type { ProvisioningConfigOutput } from "./dto";

export async function getProvisioningConfig({
  container,
}: ServiceArgs): Promise<ProvisioningConfigOutput> {
  const config = await container.unitOfWorkProvider.transaction(async (ctx) => {
    return ctx.provisioningConfigRepository.find();
  });

  return {
    isEnabled: config.isEnabled,
    hasToken: config.bearerTokenHash !== null,
    tokenIssuedAt: config.tokenIssuedAt,
    updatedAt: config.updatedAt,
  };
}
