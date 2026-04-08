import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { SystemSetting } from "@/core/domain/system-settings/entity";
import type {
  FeatureToggle,
  UpdateChannel,
  UpdateOption,
} from "@/core/domain/system-settings/valueObject";
import type { UpdateOptionOutput } from "./dto";

export type UpdateUpdateOptionInput = {
  channel: string;
  disabledFeatures: FeatureToggle[];
  disabledLatestOnlyFeatures: FeatureToggle[];
  earlyAccessFeatures: FeatureToggle[];
  experimentalFeatures: FeatureToggle[];
  apiLabFeatures: FeatureToggle[];
};

const VALID_CHANNELS: readonly string[] = ["LATEST", "MONTHLY"];

export async function updateUpdateOption({
  container,
  input,
}: ServiceArgs<UpdateUpdateOptionInput>): Promise<UpdateOptionOutput> {
  if (!VALID_CHANNELS.includes(input.channel)) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      `channel must be "LATEST" or "MONTHLY", got "${input.channel}"`,
    );
  }

  const updateOption: UpdateOption = {
    channel: input.channel as UpdateChannel,
    disabledFeatures: input.disabledFeatures,
    disabledLatestOnlyFeatures: input.disabledLatestOnlyFeatures,
    earlyAccessFeatures: input.earlyAccessFeatures,
    experimentalFeatures: input.experimentalFeatures,
    apiLabFeatures: input.apiLabFeatures,
  };

  const setting = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.systemSettingsRepository.findByKey("update_option");
    },
  );

  if (!setting) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      'Setting "update_option" not found',
    );
  }

  const updated = SystemSetting.updateValue(setting, updateOption);

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.systemSettingsRepository.save(updated);
  });

  return updateOption;
}
