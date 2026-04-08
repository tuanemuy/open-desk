import { NotFoundError, NotFoundErrorCode } from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { SystemSetting } from "@/core/domain/system-settings/entity";
import { LockoutPolicy } from "@/core/domain/system-settings/valueObject";
import type { LockoutPolicyOutput } from "./dto";

export type UpdateLockoutPolicyInput = {
  maxFailedAttempts: number | null;
  lockoutDurationMinutes: number | null;
  failedLoginMessage: Record<string, string>;
};

export async function updateLockoutPolicy({
  container,
  input,
}: ServiceArgs<UpdateLockoutPolicyInput>): Promise<LockoutPolicyOutput> {
  const lockoutPolicy = LockoutPolicy.create({
    maxFailedAttempts: input.maxFailedAttempts,
    lockoutDurationMinutes: input.lockoutDurationMinutes,
    failedLoginMessage: input.failedLoginMessage,
  });

  const setting = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.systemSettingsRepository.findByKey("lockout_policy");
    },
  );

  if (!setting) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      'Setting "lockout_policy" not found',
    );
  }

  const updated = SystemSetting.updateValue(setting, lockoutPolicy);

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.systemSettingsRepository.save(updated);
  });

  return lockoutPolicy;
}
