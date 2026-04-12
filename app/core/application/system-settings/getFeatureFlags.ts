import { NotFoundError, NotFoundErrorCode } from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { SystemSetting } from "@/core/domain/system-settings/entity";
import type { FeatureFlagsOutput } from "./dto";

export async function getFeatureFlags({
  container,
}: ServiceArgs): Promise<FeatureFlagsOutput> {
  const setting = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.systemSettingsRepository.findByKey("feature_flags");
    },
  );

  if (!setting) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      'Setting "feature_flags" not found',
    );
  }

  return SystemSetting.getTypedValue(setting, "feature_flags");
}
