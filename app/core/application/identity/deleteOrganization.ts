import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { OrganizationId } from "@/core/domain/identity/valueObject";

export type DeleteOrganizationInput = {
  organizationId: string;
};

export async function deleteOrganization({
  container,
  input,
}: ServiceArgs<DeleteOrganizationInput>): Promise<void> {
  if (input.organizationId.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Organization ID is required",
    );
  }

  const organizationId = OrganizationId.create(input.organizationId);

  const organization = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.organizationRepository.findById(organizationId);
    },
  );

  if (!organization) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      `Organization ${input.organizationId} not found`,
    );
  }

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.organizationRepository.delete(organizationId);
  });
}
