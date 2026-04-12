import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { SystemSetting } from "@/core/domain/system-settings/entity";
import {
  type AccessRestriction,
  IpRestrictionEntry,
} from "@/core/domain/system-settings/valueObject";
import type { AccessRestrictionOutput } from "./dto";

export type UpdateAccessRestrictionInput = {
  ipRestrictionEnabled: boolean;
  allowedIps: { cidr: string; description: string }[];
  basicAuthEnabled: boolean;
  basicAuthUsername: string | null;
  basicAuthPassword: string | null;
};

export async function updateAccessRestriction({
  container,
  input,
}: ServiceArgs<UpdateAccessRestrictionInput>): Promise<AccessRestrictionOutput> {
  const validatedIps = input.allowedIps.map((ip) =>
    IpRestrictionEntry.create(ip.cidr, ip.description),
  );

  if (input.basicAuthEnabled && !input.basicAuthUsername) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "basicAuthUsername is required when basicAuthEnabled is true",
    );
  }

  const setting = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.systemSettingsRepository.findByKey("access_restriction");
    },
  );

  if (!setting) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      'Setting "access_restriction" not found',
    );
  }

  const existingValue = SystemSetting.getTypedValue(
    setting,
    "access_restriction",
  );

  let passwordHash = existingValue.basicAuthPasswordHash;
  if (input.basicAuthPassword !== null) {
    const hashed = await container.passwordHasher.hash(input.basicAuthPassword);
    passwordHash = hashed.value;
  }

  const accessRestriction: AccessRestriction = {
    ipRestrictionEnabled: input.ipRestrictionEnabled,
    allowedIps: validatedIps,
    basicAuthEnabled: input.basicAuthEnabled,
    basicAuthUsername: input.basicAuthUsername,
    basicAuthPasswordHash: passwordHash,
  };

  const updated = SystemSetting.updateValue(setting, accessRestriction);

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.systemSettingsRepository.save(updated);
  });

  return {
    ipRestrictionEnabled: accessRestriction.ipRestrictionEnabled,
    allowedIps: accessRestriction.allowedIps,
    basicAuthEnabled: accessRestriction.basicAuthEnabled,
    basicAuthUsername: accessRestriction.basicAuthUsername,
  };
}
