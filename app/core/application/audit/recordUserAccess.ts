import { ValidationError, ValidationErrorCode } from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { UserAccessUsage } from "@/core/domain/audit/entity";
import { UserId } from "@/core/domain/identity/valueObject";
import type { UserAccessUsageOutput } from "./dto";

export type RecordUserAccessInput = {
  userId: string;
  accessDate: Date;
};

export async function recordUserAccess({
  container,
  input,
}: ServiceArgs<RecordUserAccessInput>): Promise<UserAccessUsageOutput> {
  if (input.accessDate > new Date()) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Access date must not be in the future",
    );
  }

  const userId = UserId.create(input.userId);

  const existingUsage = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.userAccessUsageRepository.findByUserId(userId);
    },
  );

  const currentUsage =
    existingUsage ??
    UserAccessUsage.create({
      userId,
      lastAccessDate: null,
      accessDaysLast30: 0,
    });

  const updatedUsage = UserAccessUsage.recordAccess(
    currentUsage,
    input.accessDate,
  );

  const accessDates = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      await ctx.userAccessUsageRepository.save(updatedUsage);
      return ctx.userAccessUsageRepository.findAccessDatesLast30Days(userId);
    },
  );

  const recalculatedUsage = UserAccessUsage.recalculateAccessDays(
    updatedUsage,
    accessDates,
  );

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.userAccessUsageRepository.save(recalculatedUsage);
  });

  return {
    userId: recalculatedUsage.userId,
    lastAccessDate: recalculatedUsage.lastAccessDate,
    accessDaysLast30: recalculatedUsage.accessDaysLast30,
  };
}
