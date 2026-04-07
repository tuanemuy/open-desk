import {
  ConflictError,
  ConflictErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { User } from "@/core/domain/identity/entity";
import {
  Email,
  Language,
  LoginName,
  Password,
  PasswordPolicy,
  Timezone,
} from "@/core/domain/identity/valueObject";
import type { CreateUserOutput } from "./dto";

export type CreateUserInput = {
  loginName: string;
  displayName: string;
  email: string;
  password: string;
  timezone?: string;
  language?: string;
};

export async function createUser({
  container,
  input,
}: ServiceArgs<CreateUserInput>): Promise<CreateUserOutput> {
  if (input.displayName.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Display name is required",
    );
  }
  if (input.password.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Password is required",
    );
  }

  const loginName = LoginName.create(input.loginName);
  const email = Email.create(input.email);
  const timezone = input.timezone
    ? Timezone.create(input.timezone)
    : Timezone.default();
  const language = input.language
    ? Language.create(input.language)
    : Language.default();

  const passwordPolicy = PasswordPolicy.default();
  Password.create(input.password, passwordPolicy, input.loginName);

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

  const hashedPassword = await container.passwordHasher.hash(input.password);

  const { entity: user } = User.create({
    loginName,
    displayName: input.displayName,
    email,
    timezone,
    language,
  });

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.userRepository.save(user);
    await ctx.userRepository.savePassword(user.userId, hashedPassword);
  });

  return {
    userId: user.userId,
    loginName: user.loginName,
    displayName: user.displayName,
    email: user.email,
    timezone: user.timezone,
    language: user.language,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}
