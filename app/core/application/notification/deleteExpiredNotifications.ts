import { ValidationError, ValidationErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { DeleteExpiredNotificationsOutput } from "./dto";

export type DeleteExpiredNotificationsInput = {
  readonly retentionDays: number;
};

export async function deleteExpiredNotifications({
  container,
  input,
}: ServiceArgs<DeleteExpiredNotificationsInput>): Promise<DeleteExpiredNotificationsOutput> {
  if (input.retentionDays < 1) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "retentionDays must be at least 1",
    );
  }

  const now = new Date();
  const before = new Date(
    now.getTime() - input.retentionDays * 24 * 60 * 60 * 1000,
  );

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const deletedCount = await ctx.notificationRepository.deleteExpired(before);
    return { deletedCount };
  });
}
