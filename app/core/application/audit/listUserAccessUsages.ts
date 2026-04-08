import type { ServiceArgs } from "@/core/application/types";
import type { UserAccessUsageListOutput } from "./dto";

export type ListUserAccessUsagesInput = undefined;

export async function listUserAccessUsages({
  container,
}: ServiceArgs<ListUserAccessUsagesInput>): Promise<UserAccessUsageListOutput> {
  const usages = await container.unitOfWorkProvider.transaction(async (ctx) => {
    return ctx.userAccessUsageRepository.findAll();
  });

  return {
    usages: usages.map((usage) => ({
      userId: usage.userId,
      lastAccessDate: usage.lastAccessDate,
      accessDaysLast30: usage.accessDaysLast30,
    })),
  };
}
