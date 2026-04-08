import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { TitleId, UserId } from "@/core/domain/identity/valueObject";

export type RemoveTitleFromUserInput = {
  userId: string;
  titleId: string;
};

export async function removeTitleFromUser({
  container,
  input,
}: ServiceArgs<RemoveTitleFromUserInput>): Promise<void> {
  if (input.userId.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "User ID is required",
    );
  }
  if (input.titleId.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Title ID is required",
    );
  }

  const userId = UserId.create(input.userId);
  const titleId = TitleId.create(input.titleId);

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    const user = await ctx.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `User ${input.userId} not found`,
      );
    }

    const title = await ctx.titleRepository.findById(titleId);
    if (!title) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Title ${input.titleId} not found`,
      );
    }

    await ctx.titleAssignmentRepository.unassign({ userId, titleId });
  });
}
