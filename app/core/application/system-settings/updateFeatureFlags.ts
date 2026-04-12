import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { SystemSetting } from "@/core/domain/system-settings/entity";
import type { FeatureFlags } from "@/core/domain/system-settings/valueObject";
import type { FeatureFlagsOutput } from "./dto";

export type UpdateFeatureFlagsInput = {
  emailNotification: {
    enabled: boolean;
    defaultReceive: string;
    format: string;
    allowUserFormatChange: boolean;
    notifyRestApi: boolean;
  };
  space: {
    enabled: boolean;
    allowStandaloneApp: boolean;
  };
  guestSpace: {
    enabled: boolean;
  };
  peopleAndMessage: {
    enabled: boolean;
  };
  usageDashboard: {
    enabled: boolean;
  };
};

export async function updateFeatureFlags({
  container,
  input,
}: ServiceArgs<UpdateFeatureFlagsInput>): Promise<FeatureFlagsOutput> {
  if (
    input.emailNotification.defaultReceive !== "SELF_ONLY" &&
    input.emailNotification.defaultReceive !== "NONE"
  ) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      `defaultReceive must be "SELF_ONLY" or "NONE", got "${input.emailNotification.defaultReceive}"`,
    );
  }

  if (
    input.emailNotification.format !== "HTML" &&
    input.emailNotification.format !== "TEXT"
  ) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      `format must be "HTML" or "TEXT", got "${input.emailNotification.format}"`,
    );
  }

  const featureFlags: FeatureFlags = {
    emailNotification: {
      enabled: input.emailNotification.enabled,
      defaultReceive: input.emailNotification
        .defaultReceive as FeatureFlags["emailNotification"]["defaultReceive"],
      format: input.emailNotification
        .format as FeatureFlags["emailNotification"]["format"],
      allowUserFormatChange: input.emailNotification.allowUserFormatChange,
      notifyRestApi: input.emailNotification.notifyRestApi,
    },
    space: input.space,
    guestSpace: input.guestSpace,
    peopleAndMessage: input.peopleAndMessage,
    usageDashboard: input.usageDashboard,
  };

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

  const updated = SystemSetting.updateValue(setting, featureFlags);

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.systemSettingsRepository.save(updated);
  });

  return featureFlags;
}
