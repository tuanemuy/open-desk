import { NotFoundError, NotFoundErrorCode } from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { SystemSetting } from "@/core/domain/system-settings/entity";
import type { AccessRestrictionOutput } from "./dto";

export async function getAccessRestriction({
  container,
}: ServiceArgs): Promise<AccessRestrictionOutput> {
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

  const value = SystemSetting.getTypedValue(setting, "access_restriction");
  return {
    ipRestrictionEnabled: value.ipRestrictionEnabled,
    allowedIps: value.allowedIps,
    basicAuthEnabled: value.basicAuthEnabled,
    basicAuthUsername: value.basicAuthUsername,
  };
}
