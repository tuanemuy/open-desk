import {
  ConflictError,
  ConflictErrorCode,
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { Organization } from "@/core/domain/identity/entity";
import { validateMove } from "@/core/domain/identity/services/organizationService";
import { OrganizationId } from "@/core/domain/identity/valueObject";
import type { OrganizationOutput } from "./dto";

export type UpdateOrganizationInput = {
  organizationId: string;
  name?: string;
  parentOrganizationId?: string | null;
  orderIndex?: number;
};

export async function updateOrganization({
  container,
  input,
}: ServiceArgs<UpdateOrganizationInput>): Promise<OrganizationOutput> {
  if (input.organizationId.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Organization ID is required",
    );
  }

  const organizationId = OrganizationId.create(input.organizationId);

  const existingOrg = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.organizationRepository.findById(organizationId);
    },
  );

  if (!existingOrg) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      `Organization ${input.organizationId} not found`,
    );
  }

  let organization = existingOrg;

  if (input.name !== undefined) {
    const { entity: renamed } = Organization.rename(organization, input.name);
    organization = renamed;
  }

  if (input.parentOrganizationId !== undefined) {
    const newParentId =
      input.parentOrganizationId !== null
        ? OrganizationId.create(input.parentOrganizationId)
        : null;

    const moveResult = await container.unitOfWorkProvider.transaction(
      async (ctx) => {
        return validateMove(
          { organizationRepository: ctx.organizationRepository },
          {
            organizationId,
            newParentOrganizationId: newParentId,
          },
        );
      },
    );

    if (!moveResult.ok) {
      if (moveResult.error.kind === "CircularReference") {
        throw new ConflictError(
          ConflictErrorCode.Conflict,
          "Moving the organization would create a circular reference",
        );
      }
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        "Target parent organization not found",
      );
    }

    const { entity: moved } = Organization.moveTo(organization, newParentId);
    organization = moved;
  }

  if (input.orderIndex !== undefined) {
    const { entity: reordered } = Organization.reorder(
      organization,
      input.orderIndex,
    );
    organization = reordered;
  }

  const orgToSave = organization;
  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.organizationRepository.save(orgToSave);
  });

  return {
    organizationId: organization.organizationId,
    name: organization.name,
    code: organization.code,
    parentOrganizationId: organization.parentOrganizationId,
    orderIndex: organization.orderIndex,
  };
}
