import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { SystemSetting } from "@/core/domain/system-settings/entity";
import type { Logo } from "@/core/domain/system-settings/valueObject";
import type { LogoOutput } from "./dto";

export type UpdateLogoInput = {
  imageFileId: string | null;
  linkUrl: string;
};

export async function updateLogo({
  container,
  input,
}: ServiceArgs<UpdateLogoInput>): Promise<LogoOutput> {
  if (input.linkUrl.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "linkUrl must not be empty",
    );
  }

  const logo: Logo = {
    imageFileId: input.imageFileId,
    linkUrl: input.linkUrl,
  };

  const setting = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.systemSettingsRepository.findByKey("logo");
    },
  );

  if (!setting) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      'Setting "logo" not found',
    );
  }

  const updated = SystemSetting.updateValue(setting, logo);

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.systemSettingsRepository.save(updated);
  });

  return logo;
}
