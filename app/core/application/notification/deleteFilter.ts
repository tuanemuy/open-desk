import type { UserId } from "@/core/domain/identity/valueObject";
import { NotificationFilter } from "@/core/domain/notification/entity";
import type { NotificationFilterId } from "@/core/domain/notification/valueObject";
import {
  ForbiddenError,
  ForbiddenErrorCode,
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";

export type DeleteFilterInput = {
  readonly operatorId: string;
  readonly filterId: string;
};

export async function deleteFilter({
  container,
  input,
}: ServiceArgs<DeleteFilterInput>): Promise<void> {
  const operatorId = input.operatorId as UserId;
  const filterId = input.filterId as NotificationFilterId;

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    const filter = await ctx.notificationFilterRepository.findById(filterId);
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
        "Built-in filters cannot be deleted",
      );

    await ctx.notificationFilterRepository.delete(filterId);
  });
}
