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
import { OrganizationId } from "@/core/domain/identity/valueObject";
import type { OrganizationOutput } from "./dto";

export type CreateOrganizationInput = {
  name: string;
  code: string;
  parentOrganizationId?: string;
  orderIndex?: number;
};

export async function createOrganization({
  container,
  input,
}: ServiceArgs<CreateOrganizationInput>): Promise<OrganizationOutput> {
  if (input.name.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Organization name is required",
    );
  }
  if (input.code.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Organization code is required",
    );
  }
  if (input.orderIndex !== undefined && input.orderIndex < 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Order index must be non-negative",
    );
  }

  const parentOrganizationId = input.parentOrganizationId
    ? OrganizationId.create(input.parentOrganizationId)
    : undefined;

  if (parentOrganizationId) {
    const parentOrg = await container.unitOfWorkProvider.transaction(
      async (ctx) => {
        return ctx.organizationRepository.findById(parentOrganizationId);
      },
    );

    if (!parentOrg) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Parent organization ${input.parentOrganizationId} not found`,
      );
    }
  }

  const existingByCode = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.organizationRepository.findByCode(input.code);
    },
  );

  if (existingByCode) {
    throw new ConflictError(
      ConflictErrorCode.Conflict,
      `Organization code '${input.code}' is already in use`,
    );
  }

  const { entity: organization } = Organization.create({
    name: input.name,
    code: input.code,
    parentOrganizationId: parentOrganizationId ?? null,
    orderIndex: input.orderIndex,
  });

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.organizationRepository.save(organization);
  });

  return {
    organizationId: organization.organizationId,
    name: organization.name,
    code: organization.code,
    parentOrganizationId: organization.parentOrganizationId,
    orderIndex: organization.orderIndex,
  };
}
