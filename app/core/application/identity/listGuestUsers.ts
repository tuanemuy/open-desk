import { ValidationError, ValidationErrorCode } from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import type { GuestUserListOutput } from "./dto";

export type ListGuestUsersInput = {
  offset?: number;
  limit?: number;
};

export async function listGuestUsers({
  container,
  input,
}: ServiceArgs<ListGuestUsersInput>): Promise<GuestUserListOutput> {
  const offset = input.offset ?? 0;
  const limit = input.limit ?? 100;

  if (offset < 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Offset must be non-negative",
    );
  }
  if (limit < 1 || limit > 100) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Limit must be between 1 and 100",
    );
  }

  const result = await container.unitOfWorkProvider.transaction(async (ctx) => {
    return ctx.userRepository.listGuestUsers({ offset, limit });
  });

  return {
    guestUsers: result.guestUsers.map((entry) => ({
      userId: entry.user.userId,
      displayName: entry.user.displayName,
      email: entry.user.email,
      isActive: entry.user.isActive,
      guestSpaceNames: [...entry.guestSpaceNames],
      licenseType: entry.licenseType,
      trialExpiresAt: entry.trialExpiresAt,
      lastLoginAt: entry.lastLoginAt,
    })),
    totalCount: result.totalCount,
    trialCount: result.trialCount,
    paidCount: result.paidCount,
    licensedCount: result.licensedCount,
  };
}
