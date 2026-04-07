import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { User } from "@/core/domain/identity/entity";
import {
  Language,
  TimeFormat,
  Timezone,
  UserId,
} from "@/core/domain/identity/valueObject";
import type { UpdateUserProfileOutput } from "./dto";

export type UpdateUserProfileInput = {
  userId: string;
  displayName: string;
  timezone: string;
  language: string;
  timeFormat: string;
};

export async function updateUserProfile({
  container,
  input,
}: ServiceArgs<UpdateUserProfileInput>): Promise<UpdateUserProfileOutput> {
  if (input.userId.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "User ID is required",
    );
  }

  const userId = UserId.create(input.userId);
  const timezone = Timezone.create(input.timezone);
  const language = Language.create(input.language);
  const timeFormat = TimeFormat.create(input.timeFormat);

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

  const { entity: updatedUser } = User.updateProfile(existingUser, {
    displayName: input.displayName,
    timezone,
    language,
    timeFormat,
  });

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.userRepository.save(updatedUser);
  });

  return {
    userId: updatedUser.userId,
    displayName: updatedUser.displayName,
    timezone: updatedUser.timezone,
    language: updatedUser.language,
    timeFormat: updatedUser.timeFormat,
    updatedAt: updatedUser.updatedAt,
  };
}
