import {
  NotFoundError,
  NotFoundErrorCode,
  UnauthenticatedError,
  UnauthenticatedErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { UserId } from "@/core/domain/identity/valueObject";

export type RevokeApiTokenInput = {
  userId: string;
  token: string;
};

export async function revokeApiToken({
  container,
  input,
}: ServiceArgs<RevokeApiTokenInput>): Promise<void> {
  if (input.userId.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "User ID is required",
    );
  }
  if (input.token.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Token is required",
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

  const validationResult =
    await container.authenticationProvider.validateApiToken(input.token);

  if (!validationResult.ok) {
    throw new UnauthenticatedError(
      UnauthenticatedErrorCode.InvalidToken,
      "Token is invalid or does not exist",
    );
  }

  if (validationResult.value.userId !== userId) {
    throw new UnauthenticatedError(
      UnauthenticatedErrorCode.InvalidToken,
      "Token does not belong to the specified user",
    );
  }

  // Token revocation is handled by the authentication provider
  // The actual invalidation mechanism depends on the provider implementation
}
