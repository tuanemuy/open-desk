import type { UserId } from "@/core/domain/identity/valueObject";
import { NotificationFilter } from "@/core/domain/notification/entity";
import type {
  FilterNotificationType,
  LocationCondition,
  LocationFilterMode,
  NotificationFilterId,
  SenderCondition,
} from "@/core/domain/notification/valueObject";
import {
  ForbiddenError,
  ForbiddenErrorCode,
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";
import type { FilterDto } from "./dto";

export type UpdateFilterInput = {
  readonly operatorId: string;
  readonly filterId: string;
  readonly name?: string;
  readonly notificationType?: FilterNotificationType;
  readonly locationMode?: LocationFilterMode;
  readonly locationConditions?: readonly LocationCondition[];
  readonly senderConditions?: readonly SenderCondition[];
};

export async function updateFilter({
  container,
  input,
}: ServiceArgs<UpdateFilterInput>): Promise<FilterDto> {
  const operatorId = input.operatorId as UserId;
  const filterId = input.filterId as NotificationFilterId;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    let filter = await ctx.notificationFilterRepository.findById(filterId);
    if (!filter)
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Filter ${input.filterId} not found`,
      );
    if (!NotificationFilter.isOwnedBy(filter, operatorId))
      throw new ForbiddenError(
        ForbiddenErrorCode.InsufficientPermissions,
        "Filter access denied",
      );
    if (filter.isBuiltIn)
      throw new ValidationError(
        ValidationErrorCode.InvalidInput,
        "Built-in filters cannot be modified",
      );

    if (input.name !== undefined) {
      const { entity } = NotificationFilter.rename(filter, input.name);
      filter = entity;
    }
    if (input.notificationType !== undefined) {
      const { entity } = NotificationFilter.changeNotificationType(
        filter,
        input.notificationType,
      );
      filter = entity;
    }
    if (input.locationMode !== undefined) {
      const { entity } = NotificationFilter.updateLocationConditions(
        filter,
        input.locationMode,
        input.locationConditions ?? [],
      );
      filter = entity;
    }
    if (input.senderConditions !== undefined) {
      const { entity } = NotificationFilter.updateSenderConditions(
        filter,
        input.senderConditions,
      );
      filter = entity;
    }

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
