import { NotFoundError, NotFoundErrorCode } from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { SystemSetting } from "@/core/domain/system-settings/entity";
import {
  type PasswordComplexity,
  PasswordPolicy,
} from "@/core/domain/system-settings/valueObject";
import type { PasswordPolicyOutput } from "./dto";

export type UpdatePasswordPolicyInput = {
  userMinLength: number;
  adminMinLength: number;
  complexity: PasswordComplexity;
  allowSameAsLoginName: boolean;
  expirationDays: number | null;
  historyCount: number;
  allowUserChange: boolean;
  requireChangeOnNextLogin: boolean;
  allowUserReset: boolean;
};

export async function updatePasswordPolicy({
  container,
  input,
}: ServiceArgs<UpdatePasswordPolicyInput>): Promise<PasswordPolicyOutput> {
  const passwordPolicy = PasswordPolicy.create({
    userMinLength: input.userMinLength,
    adminMinLength: input.adminMinLength,
    complexity: input.complexity,
    allowSameAsLoginName: input.allowSameAsLoginName,
    expirationDays: input.expirationDays,
    historyCount: input.historyCount,
    allowUserChange: input.allowUserChange,
    requireChangeOnNextLogin: input.requireChangeOnNextLogin,
    allowUserReset: input.allowUserReset,
  });

  const setting = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.systemSettingsRepository.findByKey("password_policy");
    },
  );

  if (!setting) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      'Setting "password_policy" not found',
    );
  }

  const updated = SystemSetting.updateValue(setting, passwordPolicy);

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.systemSettingsRepository.save(updated);
  });

  return passwordPolicy;
}
