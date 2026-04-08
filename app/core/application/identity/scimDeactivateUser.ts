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
import { User } from "@/core/domain/identity/entity";
import {
  BearerToken,
  ExternalId,
  ScimResourceType,
  UserId,
} from "@/core/domain/identity/valueObject";
import type { ScimUserDeactivateOutput } from "./dto";

export type ScimDeactivateUserInput = {
  bearerToken: string;
  externalId: string;
};

export async function scimDeactivateUser({
  container,
  input,
}: ServiceArgs<ScimDeactivateUserInput>): Promise<ScimUserDeactivateOutput> {
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

  const { entity: deactivatedUser } = User.deactivate(user);

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.userRepository.save(deactivatedUser);
    await ctx.sessionRepository.deleteByUserId(userId);
  });

  return {
    id: deactivatedUser.userId,
    externalId: input.externalId,
    active: deactivatedUser.isActive,
    updatedAt: deactivatedUser.updatedAt,
  };
}
