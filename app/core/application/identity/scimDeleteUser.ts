import {
  ForbiddenError,
  ForbiddenErrorCode,
  NotFoundError,
  NotFoundErrorCode,
  UnauthenticatedError,
  UnauthenticatedErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import {
  BearerToken,
  ExternalId,
  ScimResourceType,
  UserId,
} from "@/core/domain/identity/valueObject";

export type ScimDeleteUserInput = {
  bearerToken: string;
  externalId: string;
};

export async function scimDeleteUser({
  container,
  input,
}: ServiceArgs<ScimDeleteUserInput>): Promise<void> {
  if (input.bearerToken.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Bearer token is required",
    );
  }
  if (input.externalId.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "External ID is required",
    );
  }

  const config = await container.unitOfWorkProvider.transaction(async (ctx) => {
    return ctx.provisioningConfigRepository.find();
  });

  if (!config.isEnabled) {
    throw new ForbiddenError(
      ForbiddenErrorCode.InsufficientPermissions,
      "Provisioning is not enabled",
    );
  }

  const token = BearerToken.create(input.bearerToken);
  if (!config.bearerTokenHash) {
    throw new UnauthenticatedError(
      UnauthenticatedErrorCode.InvalidToken,
      "Bearer token is not configured",
    );
  }
  const isValid = container.bearerTokenHasher.verify(
    token,
    config.bearerTokenHash,
  );
  if (!isValid) {
    throw new UnauthenticatedError(
      UnauthenticatedErrorCode.InvalidToken,
      "Invalid bearer token",
    );
  }

  const externalId = ExternalId.create(input.externalId);
  const resourceType = ScimResourceType.create("User");

  const mapping = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.scimExternalMappingRepository.findByExternalId({
        externalId,
        resourceType,
      });
    },
  );

  if (!mapping) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      `SCIM mapping for externalId '${input.externalId}' not found`,
    );
  }

  const userId = UserId.create(mapping.internalId);

  const user = await container.unitOfWorkProvider.transaction(async (ctx) => {
    return ctx.userRepository.findById(userId);
  });

  if (!user) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      `User for externalId '${input.externalId}' not found`,
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

    const titleIds =
      await ctx.titleAssignmentRepository.getTitleIdsByUserId(userId);
    for (const titleId of titleIds) {
      await ctx.titleAssignmentRepository.unassign({ userId, titleId });
    }

    await ctx.userRepository.delete(userId);
    await ctx.scimExternalMappingRepository.delete({
      externalId,
      resourceType,
    });
  });
}
