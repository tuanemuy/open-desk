import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { User } from "@/core/domain/identity/entity";
import { OrganizationId, UserId } from "@/core/domain/identity/valueObject";

export type RemoveUserFromOrganizationInput = {
  userId: string;
  organizationId: string;
};

export async function removeUserFromOrganization({
  container,
  input,
}: ServiceArgs<RemoveUserFromOrganizationInput>): Promise<void> {
  if (input.userId.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "User ID is required",
    );
  }
  if (input.organizationId.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Organization ID is required",
    );
  }

  const userId = UserId.create(input.userId);
  const organizationId = OrganizationId.create(input.organizationId);

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    const user = await ctx.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `User ${input.userId} not found`,
      );
    }

    const organization =
      await ctx.organizationRepository.findById(organizationId);
    if (!organization) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Organization ${input.organizationId} not found`,
      );
    }

    await ctx.membershipRepository.removeUserFromOrganization({
      userId,
      organizationId,
    });

    if (user.primaryOrganizationId === organizationId) {
      const { entity: updatedUser } = User.clearPrimaryOrganization(user);
      await ctx.userRepository.save(updatedUser);
    }
  });
}
