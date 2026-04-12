import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { SystemSetting } from "@/core/domain/system-settings/entity";
import type {
  Locale,
  SupportedLanguage,
} from "@/core/domain/system-settings/valueObject";
import type { LocaleOutput } from "./dto";

export type UpdateLocaleInput = {
  timezone: string;
  language: string;
};

const VALID_LANGUAGES: readonly string[] = [
  "ja",
  "en_US",
  "zh_CN",
  "zh_TW",
  "es",
  "pt_BR",
  "th",
];

export async function updateLocale({
  container,
  input,
}: ServiceArgs<UpdateLocaleInput>): Promise<LocaleOutput> {
  if (input.timezone.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "timezone must not be empty",
    );
  }

  if (!VALID_LANGUAGES.includes(input.language)) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      `language must be one of ${VALID_LANGUAGES.join(", ")}, got "${input.language}"`,
    );
  }

  const locale: Locale = {
    timezone: input.timezone,
    language: input.language as SupportedLanguage,
  };

  const setting = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.systemSettingsRepository.findByKey("locale");
    },
  );

  if (!setting) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      'Setting "locale" not found',
    );
  }

  const updated = SystemSetting.updateValue(setting, locale);

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.systemSettingsRepository.save(updated);
  });

  return locale;
}
