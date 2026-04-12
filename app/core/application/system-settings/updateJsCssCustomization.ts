import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { SystemSetting } from "@/core/domain/system-settings/entity";
import type {
  CustomFile,
  CustomizationScope,
  JsCssCustomization,
} from "@/core/domain/system-settings/valueObject";
import type { JsCssCustomizationOutput } from "./dto";

export type UpdateJsCssCustomizationInput = {
  scope: string;
  pcJsFiles: CustomFile[];
  mobileJsFiles: CustomFile[];
  pcCssFiles: CustomFile[];
  mobileCssFiles: CustomFile[];
};

const VALID_SCOPES: readonly string[] = ["ALL_USERS", "ADMIN_ONLY", "DISABLED"];
const VALID_FILE_TYPES: readonly string[] = ["URL", "UPLOAD"];

function validateCustomFiles(files: readonly CustomFile[]): void {
  for (const file of files) {
    if (!VALID_FILE_TYPES.includes(file.type)) {
      throw new ValidationError(
        ValidationErrorCode.InvalidInput,
        `Custom file type must be "URL" or "UPLOAD", got "${file.type}"`,
      );
    }
  }
}

export async function updateJsCssCustomization({
  container,
  input,
}: ServiceArgs<UpdateJsCssCustomizationInput>): Promise<JsCssCustomizationOutput> {
  if (!VALID_SCOPES.includes(input.scope)) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      `scope must be "ALL_USERS", "ADMIN_ONLY", or "DISABLED", got "${input.scope}"`,
    );
  }

  validateCustomFiles(input.pcJsFiles);
  validateCustomFiles(input.mobileJsFiles);
  validateCustomFiles(input.pcCssFiles);
  validateCustomFiles(input.mobileCssFiles);

  const jsCssCustomization: JsCssCustomization = {
    scope: input.scope as CustomizationScope,
    pcJsFiles: input.pcJsFiles,
    mobileJsFiles: input.mobileJsFiles,
    pcCssFiles: input.pcCssFiles,
    mobileCssFiles: input.mobileCssFiles,
  };

  const setting = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.systemSettingsRepository.findByKey("js_css_customization");
    },
  );

  if (!setting) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      'Setting "js_css_customization" not found',
    );
  }

  const updated = SystemSetting.updateValue(setting, jsCssCustomization);

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.systemSettingsRepository.save(updated);
  });

  return jsCssCustomization;
}
