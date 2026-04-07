import type { UserId } from "@/core/domain/identity/valueObject";
import { NotificationFilter } from "@/core/domain/notification/entity";
import type {
  FilterNotificationType,
  LocationCondition,
  LocationFilterMode,
  SenderCondition,
} from "@/core/domain/notification/valueObject";
import type { ServiceArgs } from "../types";
import type { FilterDto } from "./dto";

export type CreateFilterInput = {
  readonly operatorId: string;
  readonly name: string;
  readonly notificationType: FilterNotificationType;
  readonly locationMode: LocationFilterMode;
  readonly locationConditions: readonly LocationCondition[];
  readonly senderConditions: readonly SenderCondition[];
};

export async function createFilter({
  container,
  input,
}: ServiceArgs<CreateFilterInput>): Promise<FilterDto> {
  const operatorId = input.operatorId as UserId;

  const { entity: filter } = NotificationFilter.create({
    userId: operatorId,
    name: input.name,
    notificationType: input.notificationType,
    locationMode: input.locationMode,
    locationConditions: input.locationConditions,
    senderConditions: input.senderConditions,
  });

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.notificationFilterRepository.save(filter);
    return {
      filterId: filter.filterId,
      name: filter.name,
      notificationType: filter.notificationType,
      locationMode: filter.locationMode,
      locationConditions: filter.locationConditions,
      senderConditions: filter.senderConditions,
      createdAt: filter.createdAt,
      updatedAt: filter.updatedAt,
    };
  });
}
