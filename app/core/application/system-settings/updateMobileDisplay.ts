import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { SystemSetting } from "@/core/domain/system-settings/entity";
import type { MobileDisplay } from "@/core/domain/system-settings/valueObject";
import type { MobileDisplayOutput } from "./dto";

export type UpdateMobileDisplayInput = {
  displayMode: string;
  allowUserToggle: boolean;
};

export async function updateMobileDisplay({
  container,
  input,
}: ServiceArgs<UpdateMobileDisplayInput>): Promise<MobileDisplayOutput> {
  if (input.displayMode !== "MOBILE" && input.displayMode !== "PC") {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      `displayMode must be "MOBILE" or "PC", got "${input.displayMode}"`,
    );
  }

  const mobileDisplay: MobileDisplay = {
    displayMode: input.displayMode as MobileDisplay["displayMode"],
    allowUserToggle: input.allowUserToggle,
  };

  const setting = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.systemSettingsRepository.findByKey("mobile_display");
    },
  );

  if (!setting) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      'Setting "mobile_display" not found',
    );
  }

  const updated = SystemSetting.updateValue(setting, mobileDisplay);

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.systemSettingsRepository.save(updated);
  });

  return mobileDisplay;
}
