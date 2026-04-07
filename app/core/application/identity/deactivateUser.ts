import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { User } from "@/core/domain/identity/entity";
import { UserId } from "@/core/domain/identity/valueObject";
import type { UserStatusOutput } from "./dto";

export type DeactivateUserInput = {
  userId: string;
};

export async function deactivateUser({
  container,
  input,
}: ServiceArgs<DeactivateUserInput>): Promise<UserStatusOutput> {
  if (input.userId.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "User ID is required",
    );
  }

  const userId = UserId.create(input.userId);

  const existingUser = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.userRepository.findById(userId);
    },
  );

  if (!existingUser) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      `User ${input.userId} not found`,
    );
  }

  const { entity: deactivatedUser } = User.deactivate(existingUser);

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.userRepository.save(deactivatedUser);
    await ctx.sessionRepository.deleteByUserId(userId);
  });

  return {
    userId: deactivatedUser.userId,
    isActive: deactivatedUser.isActive,
    updatedAt: deactivatedUser.updatedAt,
  };
}
