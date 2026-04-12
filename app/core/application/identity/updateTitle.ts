import {
  ConflictError,
  ConflictErrorCode,
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { Title } from "@/core/domain/identity/entity";
import { TitleId } from "@/core/domain/identity/valueObject";
import type { UpdateTitleOutput } from "./dto";

export type UpdateTitleInput = {
  titleId: string;
  name: string;
};

export async function updateTitle({
  container,
  input,
}: ServiceArgs<UpdateTitleInput>): Promise<UpdateTitleOutput> {
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

  const existingByName = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.titleRepository.findByName(input.name);
    },
  );

  if (existingByName && existingByName.titleId !== titleId) {
    throw new ConflictError(
      ConflictErrorCode.Conflict,
      `Title name '${input.name}' is already in use`,
    );
  }

  const { entity: updatedTitle } = Title.rename(existingTitle, input.name);

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.titleRepository.save(updatedTitle);
  });

  return {
    titleId: updatedTitle.titleId,
    name: updatedTitle.name,
    orderIndex: updatedTitle.orderIndex,
    updatedAt: updatedTitle.updatedAt,
  };
}
