import type { UserId } from "@/core/domain/identity/valueObject";
import type { ServiceArgs } from "../types";
import type { FilterListOutput } from "./dto";

export type ListFiltersInput = { readonly operatorId: string };

export async function listFilters({
  container,
  input,
}: ServiceArgs<ListFiltersInput>): Promise<FilterListOutput> {
  const operatorId = input.operatorId as UserId;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const filters =
      await ctx.notificationFilterRepository.findByUserId(operatorId);

    const builtInFilters = filters
      .filter((f) => f.isBuiltIn)
      .map((f) => ({
        filterId: f.filterId as string,
        name: f.name as string,
        builtInType: f.name as "MENTION" | "READ_LATER" | "ALL",
      }));

    const customFilters = filters
      .filter((f) => !f.isBuiltIn)
      .map((f) => ({
        filterId: f.filterId as string,
        name: f.name as string,
        notificationType: f.notificationType,
        locationMode: f.locationMode,
        createdAt: f.createdAt,
      }));

    return { builtInFilters, customFilters };
  });
}
