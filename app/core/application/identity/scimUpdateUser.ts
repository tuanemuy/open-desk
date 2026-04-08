import {
  ConflictError,
  ConflictErrorCode,
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
  Email,
  ExternalId,
  ScimResourceType,
  UserId,
} from "@/core/domain/identity/valueObject";
import type { ScimUserUpdateOutput } from "./dto";

export type ScimUpdateUserInput = {
  bearerToken: string;
  externalId: string;
  displayName?: string;
  email?: string;
};

export async function scimUpdateUser({
  container,
  input,
}: ServiceArgs<ScimUpdateUserInput>): Promise<ScimUserUpdateOutput> {
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

  let user = await container.unitOfWorkProvider.transaction(async (ctx) => {
    return ctx.userRepository.findById(userId);
  });

  if (!user) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      `User for externalId '${input.externalId}' not found`,
    );
  }

  if (input.displayName !== undefined) {
    if (input.displayName.length === 0) {
      throw new ValidationError(
        ValidationErrorCode.InvalidInput,
        "Display name cannot be empty",
      );
    }
    const { entity: updatedUser } = User.updateProfile(user, {
      displayName: input.displayName,
      timezone: user.timezone,
      language: user.language,
      timeFormat: user.timeFormat,
    });
    user = updatedUser;
  }

  if (input.email !== undefined) {
    const newEmail = Email.create(input.email);
    if (newEmail !== user.email) {
      const existingByEmail = await container.unitOfWorkProvider.transaction(
        async (ctx) => {
          return ctx.userRepository.findByEmail(newEmail);
        },
      );

      if (existingByEmail && existingByEmail.userId !== userId) {
        throw new ConflictError(
          ConflictErrorCode.Conflict,
          "Email is already in use by another user",
        );
      }

      user = {
        ...user,
        email: newEmail,
        updatedAt: new Date(),
      };
    }
  }

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.userRepository.save(user);
  });

  return {
    id: user.userId,
    externalId: input.externalId,
    userName: user.loginName,
    displayName: user.displayName,
    email: user.email,
    active: user.isActive,
    updatedAt: user.updatedAt,
  };
}
