import {
  NotFoundError,
  NotFoundErrorCode,
  UnauthenticatedError,
  UnauthenticatedErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import {
  Password,
  PasswordPolicy,
  UserId,
} from "@/core/domain/identity/valueObject";

export type ChangePasswordInput = {
  userId: string;
  currentPassword: string;
  newPassword: string;
};

export async function changePassword({
  container,
  input,
}: ServiceArgs<ChangePasswordInput>): Promise<void> {
  if (input.userId.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "User ID is required",
    );
  }
  if (input.currentPassword.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Current password is required",
    );
  }
  if (input.newPassword.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "New password is required",
    );
  }

  const userId = UserId.create(input.userId);

  const user = await container.unitOfWorkProvider.transaction(async (ctx) => {
    return ctx.userRepository.findById(userId);
  });

  if (!user) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      `User ${input.userId} not found`,
    );
  }

  const credentials = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.userRepository.findCredentialsByLoginName(user.loginName);
    },
  );

  if (!credentials) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      "User credentials not found",
    );
  }

  const isCurrentPasswordValid = await container.passwordHasher.verify(
    input.currentPassword,
    credentials.hashedPassword,
  );

  if (!isCurrentPasswordValid) {
    throw new UnauthenticatedError(
      UnauthenticatedErrorCode.InvalidCredentials,
      "Current password is incorrect",
    );
  }

  const passwordPolicy = PasswordPolicy.default();
  Password.create(input.newPassword, passwordPolicy, user.loginName);

  const hashedPassword = await container.passwordHasher.hash(input.newPassword);

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.userRepository.savePassword(userId, hashedPassword);
  });
}
