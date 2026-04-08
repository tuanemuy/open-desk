import {
  ConflictError,
  ConflictErrorCode,
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { TitleId } from "@/core/domain/identity/valueObject";

export type DeleteTitleInput = {
  titleId: string;
};

export async function deleteTitle({
  container,
  input,
}: ServiceArgs<DeleteTitleInput>): Promise<void> {
  if (input.titleId.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Title ID is required",
    );
  }

  const titleId = TitleId.create(input.titleId);

  const existingTitle = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.titleRepository.findById(titleId);
    },
  );

  if (!existingTitle) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      `Title ${input.titleId} not found`,
    );
  }

  const assignedUserIds = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.titleAssignmentRepository.getUserIdsByTitleId(titleId);
    },
  );

  if (assignedUserIds.length > 0) {
    throw new ConflictError(
      ConflictErrorCode.Conflict,
      "Cannot delete a title that still has assigned users",
    );
  }

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.titleRepository.delete(titleId);
  });
}
