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
import { Group } from "@/core/domain/identity/entity";
import {
  BearerToken,
  ExternalId,
  GroupId,
  ScimResourceType,
  UserId,
} from "@/core/domain/identity/valueObject";
import type { ScimGroupUpdateOutput } from "./dto";

export type ScimUpdateGroupInput = {
  bearerToken: string;
  externalId: string;
  displayName?: string;
  memberExternalIds?: string[];
};

export async function scimUpdateGroup({
  container,
  input,
}: ServiceArgs<ScimUpdateGroupInput>): Promise<ScimGroupUpdateOutput> {
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

  let group = await container.unitOfWorkProvider.transaction(async (ctx) => {
    return ctx.groupRepository.findById(groupId);
  });

  if (!group) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      `Group for externalId '${input.externalId}' not found`,
    );
  }

  if (input.displayName !== undefined) {
    if (input.displayName.length === 0) {
      throw new ValidationError(
        ValidationErrorCode.InvalidInput,
        "Display name cannot be empty",
      );
    }
    const { entity: renamedGroup } = Group.rename(group, input.displayName);
    group = renamedGroup;
  }

  const userResourceType = ScimResourceType.create("User");

  const memberCount = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      await ctx.groupRepository.save(group);

      if (input.memberExternalIds !== undefined) {
        const currentMembers = await ctx.userRepository.findByGroupId(groupId);
        const currentMemberIds = new Set(
          currentMembers.map((u) => u.userId as string),
        );

        const newMemberIds = new Set<string>();
        for (const memberExtId of input.memberExternalIds) {
          const memberExternalId = ExternalId.create(memberExtId);
          const memberMapping =
            await ctx.scimExternalMappingRepository.findByExternalId({
              externalId: memberExternalId,
              resourceType: userResourceType,
            });
          if (memberMapping) {
            newMemberIds.add(memberMapping.internalId);
          }
        }

        for (const currentId of currentMemberIds) {
          if (!newMemberIds.has(currentId)) {
            await ctx.membershipRepository.removeUserFromGroup({
              userId: UserId.create(currentId),
              groupId,
            });
          }
        }

        for (const newId of newMemberIds) {
          if (!currentMemberIds.has(newId)) {
            await ctx.membershipRepository.addUserToGroup({
              userId: UserId.create(newId),
              groupId,
            });
          }
        }

        return newMemberIds.size;
      }

      const members = await ctx.userRepository.findByGroupId(groupId);
      return members.length;
    },
  );

  return {
    id: group.groupId,
    externalId: input.externalId,
    displayName: group.name,
    memberCount,
    updatedAt: new Date(),
  };
}
