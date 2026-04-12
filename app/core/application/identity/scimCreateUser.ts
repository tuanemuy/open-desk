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
import { ScimExternalMapping, User } from "@/core/domain/identity/entity";
import {
  BearerToken,
  Email,
  ExternalId,
  LoginName,
  Password,
  PasswordPolicy,
  ScimResourceType,
} from "@/core/domain/identity/valueObject";
import type { ScimUserOutput } from "./dto";

export type ScimCreateUserInput = {
  bearerToken: string;
  externalId: string;
  userName: string;
  displayName: string;
  email: string;
  active?: boolean;
};

export async function scimCreateUser({
  container,
  input,
}: ServiceArgs<ScimCreateUserInput>): Promise<ScimUserOutput> {
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

  const existingMapping = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.scimExternalMappingRepository.findByExternalId({
        externalId,
        resourceType,
      });
    },
  );

  if (existingMapping) {
    throw new ConflictError(
      ConflictErrorCode.Conflict,
      `SCIM external mapping for externalId '${input.externalId}' already exists`,
    );
  }

  const loginName = LoginName.create(input.userName);
  const email = Email.create(input.email);

  if (input.displayName.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Display name is required",
    );
  }

  const existingByLoginName = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.userRepository.findByLoginName(loginName);
    },
  );

  if (existingByLoginName) {
    throw new ConflictError(
      ConflictErrorCode.Conflict,
      "Login name is already in use",
    );
  }

  const existingByEmail = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.userRepository.findByEmail(email);
    },
  );

  if (existingByEmail) {
    throw new ConflictError(
      ConflictErrorCode.Conflict,
      "Email is already in use",
    );
  }

  const passwordPolicy = PasswordPolicy.default();
  const randomPassword = crypto.randomUUID() + crypto.randomUUID();
  Password.create(randomPassword, passwordPolicy);
  const hashedPassword = await container.passwordHasher.hash(randomPassword);

  const active = input.active ?? true;

  const { entity: user } = User.create({
    loginName,
    displayName: input.displayName,
    email,
  });

  const userToSave = active ? user : { ...user, isActive: false };

  const { entity: mapping } = ScimExternalMapping.create({
    externalId,
    resourceType,
    internalId: user.userId,
  });

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.userRepository.save(userToSave);
    await ctx.userRepository.savePassword(userToSave.userId, hashedPassword);
    await ctx.scimExternalMappingRepository.save(mapping);
  });

  return {
    id: userToSave.userId,
    externalId: input.externalId,
    userName: userToSave.loginName,
    displayName: userToSave.displayName,
    email: userToSave.email,
    active: userToSave.isActive,
    createdAt: userToSave.createdAt,
  };
}
