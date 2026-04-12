import {
  ConflictError,
  ConflictErrorCode,
  ForbiddenError,
  ForbiddenErrorCode,
  UnauthenticatedError,
  UnauthenticatedErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { Group, ScimExternalMapping } from "@/core/domain/identity/entity";
import {
  BearerToken,
  ExternalId,
  ScimResourceType,
  UserId,
} from "@/core/domain/identity/valueObject";
import type { ScimGroupOutput } from "./dto";

export type ScimCreateGroupInput = {
  bearerToken: string;
  externalId: string;
  displayName: string;
  memberExternalIds?: string[];
};

export async function scimCreateGroup({
  container,
  input,
}: ServiceArgs<ScimCreateGroupInput>): Promise<ScimGroupOutput> {
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
  if (input.displayName.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Display name is required",
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

  const existingMapping = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.scimExternalMappingRepository.findByExternalId({
        externalId,
        resourceType: groupResourceType,
      });
    },
  );

  if (existingMapping) {
    throw new ConflictError(
      ConflictErrorCode.Conflict,
      `SCIM external mapping for externalId '${input.externalId}' already exists`,
    );
  }

  const groupCode = input.displayName;

  const existingByCode = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.groupRepository.findByCode(groupCode);
    },
  );

  if (existingByCode) {
    throw new ConflictError(
      ConflictErrorCode.Conflict,
      `Group code '${groupCode}' is already in use`,
    );
  }

  const { entity: group } = Group.create({
    name: input.displayName,
    code: groupCode,
  });

  const { entity: mapping } = ScimExternalMapping.create({
    externalId,
    resourceType: groupResourceType,
    internalId: group.groupId,
  });

  const memberExternalIds = input.memberExternalIds ?? [];
  const userResourceType = ScimResourceType.create("User");

  let memberCount = 0;

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.groupRepository.save(group);
    await ctx.scimExternalMappingRepository.save(mapping);

    for (const memberExtId of memberExternalIds) {
      const memberExternalId = ExternalId.create(memberExtId);
      const memberMapping =
        await ctx.scimExternalMappingRepository.findByExternalId({
          externalId: memberExternalId,
          resourceType: userResourceType,
        });

      if (memberMapping) {
        const userId = UserId.create(memberMapping.internalId);
        await ctx.membershipRepository.addUserToGroup({
          userId,
          groupId: group.groupId,
        });
        memberCount += 1;
      }
    }
  });

  return {
    id: group.groupId,
    externalId: input.externalId,
    displayName: group.name,
    memberCount,
    createdAt: new Date(),
  };
}
