import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { SystemSetting } from "@/core/domain/system-settings/entity";
import type {
  AutoLoginExpiration,
  SessionPolicy,
} from "@/core/domain/system-settings/valueObject";
import type { SessionPolicyOutput } from "./dto";

export type UpdateSessionPolicyInput = {
  sessionLifetimeMinutes: number;
  allowAutoComplete: boolean;
  allowBrowserSave: boolean;
  allowAutoLogin: boolean;
  autoLoginExpiration: string | null;
  allowMismatchedApiAuth: boolean;
};

const VALID_AUTO_LOGIN_EXPIRATIONS: readonly string[] = [
  "1_DAY",
  "1_WEEK",
  "1_MONTH",
];

export async function updateSessionPolicy({
  container,
  input,
}: ServiceArgs<UpdateSessionPolicyInput>): Promise<SessionPolicyOutput> {
  if (
    !Number.isInteger(input.sessionLifetimeMinutes) ||
    input.sessionLifetimeMinutes <= 0
  ) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "sessionLifetimeMinutes must be a positive integer",
    );
  }

  let autoLoginExpiration: AutoLoginExpiration | null = null;
  if (input.allowAutoLogin) {
    if (
      !input.autoLoginExpiration ||
      !VALID_AUTO_LOGIN_EXPIRATIONS.includes(input.autoLoginExpiration)
    ) {
      throw new ValidationError(
        ValidationErrorCode.InvalidInput,
        `autoLoginExpiration must be one of "1_DAY", "1_WEEK", "1_MONTH" when allowAutoLogin is true`,
      );
    }
    autoLoginExpiration = input.autoLoginExpiration as AutoLoginExpiration;
  }

  const sessionPolicy: SessionPolicy = {
    sessionLifetimeMinutes: input.sessionLifetimeMinutes,
    allowAutoComplete: input.allowAutoComplete,
    allowBrowserSave: input.allowBrowserSave,
    allowAutoLogin: input.allowAutoLogin,
    autoLoginExpiration,
    allowMismatchedApiAuth: input.allowMismatchedApiAuth,
  };

  const setting = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.systemSettingsRepository.findByKey("session_policy");
    },
  );

  if (!setting) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      'Setting "session_policy" not found',
    );
  }

  const updated = SystemSetting.updateValue(setting, sessionPolicy);

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.systemSettingsRepository.save(updated);
  });

  return sessionPolicy;
}
