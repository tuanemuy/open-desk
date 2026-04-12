import type { ServiceArgs } from "@/core/application/types";
import type { AuditLogSettingOutput } from "./dto";

export type GetAuditLogSettingsInput = undefined;

export async function getAuditLogSettings({
  container,
}: ServiceArgs<GetAuditLogSettingsInput>): Promise<AuditLogSettingOutput> {
  const setting = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.auditLogSettingRepository.find();
    },
  );

  return {
    setting: {
      settings: setting.settings,
      createdAt: setting.createdAt,
      updatedAt: setting.updatedAt,
    },
  };
}
