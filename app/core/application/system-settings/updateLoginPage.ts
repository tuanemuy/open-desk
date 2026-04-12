import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { SystemSetting } from "@/core/domain/system-settings/entity";
import type { LoginPage } from "@/core/domain/system-settings/valueObject";
import type { LoginPageOutput } from "./dto";

export type UpdateLoginPageInput = {
  title: string;
  backgroundImageFileId: string | null;
};

export async function updateLoginPage({
  container,
  input,
}: ServiceArgs<UpdateLoginPageInput>): Promise<LoginPageOutput> {
  if (input.title.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "title must not be empty",
    );
  }

  const loginPage: LoginPage = {
    title: input.title,
    backgroundImageFileId: input.backgroundImageFileId,
  };

  const setting = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.systemSettingsRepository.findByKey("login_page");
    },
  );

  if (!setting) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      'Setting "login_page" not found',
    );
  }

  const updated = SystemSetting.updateValue(setting, loginPage);

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.systemSettingsRepository.save(updated);
  });

  return loginPage;
}
