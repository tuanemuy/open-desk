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
  GroupId,
  ScimResourceType,
} from "@/core/domain/identity/valueObject";

export type ScimDeleteGroupInput = {
  bearerToken: string;
  externalId: string;
};

export async function scimDeleteGroup({
  container,
  input,
}: ServiceArgs<ScimDeleteGroupInput>): Promise<void> {
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
  const groupResourceType = ScimResourceType.create("Group");

  const mapping = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.scimExternalMappingRepository.findByExternalId({
        externalId,
        resourceType: groupResourceType,
      });
    },
  );

  if (!mapping) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      `SCIM mapping for externalId '${input.externalId}' not found`,
    );
  }

  const groupId = GroupId.create(mapping.internalId);

  const group = await container.unitOfWorkProvider.transaction(async (ctx) => {
    return ctx.groupRepository.findById(groupId);
  });

  if (!group) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      `Group for externalId '${input.externalId}' not found`,
    );
  }

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    const members = await ctx.userRepository.findByGroupId(groupId);
    for (const member of members) {
      await ctx.membershipRepository.removeUserFromGroup({
        userId: member.userId,
        groupId,
      });
    }

    await ctx.groupRepository.delete(groupId);
    await ctx.scimExternalMappingRepository.delete({
      externalId,
      resourceType: groupResourceType,
    });
  });
}
