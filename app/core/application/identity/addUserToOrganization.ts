import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { OrganizationId, UserId } from "@/core/domain/identity/valueObject";
import type { MembershipOutput } from "./dto";

export type AddUserToOrganizationInput = {
  userId: string;
  organizationId: string;
};

export async function addUserToOrganization({
  container,
  input,
}: ServiceArgs<AddUserToOrganizationInput>): Promise<MembershipOutput> {
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

    await ctx.membershipRepository.addUserToOrganization({
      userId,
      organizationId,
    });
  });

  return {
    userId: input.userId,
    organizationId: input.organizationId,
  };
}
