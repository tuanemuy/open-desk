import type { ServiceArgs } from "@/core/application/types";
import { AuditLogSetting } from "@/core/domain/audit/entity";
import type { AuditLogSettingOutput } from "./dto";

export type UpdateAuditLogSettingsInput = {
  settings: Record<string, unknown>;
};

export async function updateAuditLogSettings({
  container,
  input,
}: ServiceArgs<UpdateAuditLogSettingsInput>): Promise<AuditLogSettingOutput> {
  const currentSetting = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.auditLogSettingRepository.find();
    },
  );

  const updatedSetting = AuditLogSetting.updateSettings(
    currentSetting,
    input.settings,
  );

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.auditLogSettingRepository.save(updatedSetting);
  });

  return {
    setting: {
      settings: updatedSetting.settings,
      createdAt: updatedSetting.createdAt,
      updatedAt: updatedSetting.updatedAt,
    },
  };
}
