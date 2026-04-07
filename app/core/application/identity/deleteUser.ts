import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { UserId } from "@/core/domain/identity/valueObject";

export type DeleteUserInput = {
  userId: string;
};

export async function deleteUser({
  container,
  input,
}: ServiceArgs<DeleteUserInput>): Promise<void> {
  if (input.userId.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "User ID is required",
    );
  }

  const userId = UserId.create(input.userId);

  const existingUser = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.userRepository.findById(userId);
    },
  );

  if (!existingUser) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      `User ${input.userId} not found`,
    );
  }

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.sessionRepository.deleteByUserId(userId);

    const organizationIds =
      await ctx.membershipRepository.getOrganizationIdsByUserId(userId);
    for (const orgId of organizationIds) {
      await ctx.membershipRepository.removeUserFromOrganization({
        userId,
        organizationId: orgId,
      });
    }

    const groupIds = await ctx.membershipRepository.getGroupIdsByUserId(userId);
    for (const groupId of groupIds) {
      await ctx.membershipRepository.removeUserFromGroup({
        userId,
        groupId,
      });
    }

    await ctx.userRepository.delete(userId);
  });
}
