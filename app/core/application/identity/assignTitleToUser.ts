import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { TitleId, UserId } from "@/core/domain/identity/valueObject";
import type { TitleAssignmentOutput } from "./dto";

export type AssignTitleToUserInput = {
  userId: string;
  titleId: string;
};

export async function assignTitleToUser({
  container,
  input,
}: ServiceArgs<AssignTitleToUserInput>): Promise<TitleAssignmentOutput> {
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

    await ctx.titleAssignmentRepository.assign({ userId, titleId });
  });

  return {
    userId: input.userId,
    titleId: input.titleId,
  };
}
