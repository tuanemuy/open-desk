import { NotFoundError, NotFoundErrorCode } from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { SystemSetting } from "@/core/domain/system-settings/entity";
import type { LoginSecurityOutput } from "./dto";

export async function getLoginSecurity({
  container,
}: ServiceArgs): Promise<LoginSecurityOutput> {
  const [
    passwordPolicySetting,
    lockoutPolicySetting,
    sessionPolicySetting,
    samlAuthSetting,
    twoFactorAuthSetting,
  ] = await container.unitOfWorkProvider.transaction(async (ctx) => {
    return Promise.all([
      ctx.systemSettingsRepository.findByKey("password_policy"),
      ctx.systemSettingsRepository.findByKey("lockout_policy"),
      ctx.systemSettingsRepository.findByKey("session_policy"),
      ctx.systemSettingsRepository.findByKey("saml_auth"),
      ctx.systemSettingsRepository.findByKey("two_factor_auth"),
    ]);
  });

  if (!passwordPolicySetting) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      'Setting "password_policy" not found',
    );
  }
  if (!lockoutPolicySetting) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      'Setting "lockout_policy" not found',
    );
  }
  if (!sessionPolicySetting) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      'Setting "session_policy" not found',
    );
  }
  if (!samlAuthSetting) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      'Setting "saml_auth" not found',
    );
  }
  if (!twoFactorAuthSetting) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      'Setting "two_factor_auth" not found',
    );
  }

  return {
    passwordPolicy: SystemSetting.getTypedValue(
      passwordPolicySetting,
      "password_policy",
    ),
    lockoutPolicy: SystemSetting.getTypedValue(
      lockoutPolicySetting,
      "lockout_policy",
    ),
    sessionPolicy: SystemSetting.getTypedValue(
      sessionPolicySetting,
      "session_policy",
    ),
    samlAuth: SystemSetting.getTypedValue(samlAuthSetting, "saml_auth"),
    twoFactorAuth: SystemSetting.getTypedValue(
      twoFactorAuthSetting,
      "two_factor_auth",
    ),
  };
}
