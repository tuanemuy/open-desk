import type { ServiceArgs } from "@/core/application/types";
import type { UserAccessUsageListOutput } from "./dto";

export type ExportUserAccessUsagesCsvInput = undefined;

export async function exportUserAccessUsagesCsv({
  container,
}: ServiceArgs<ExportUserAccessUsagesCsvInput>): Promise<UserAccessUsageListOutput> {
  const usages = await container.unitOfWorkProvider.transaction(async (ctx) => {
    return ctx.userAccessUsageRepository.findAllForExport();
  });

  return {
    usages: usages.map((usage) => ({
      userId: usage.userId,
      lastAccessDate: usage.lastAccessDate,
      accessDaysLast30: usage.accessDaysLast30,
    })),
  };
}
