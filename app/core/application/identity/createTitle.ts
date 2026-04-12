import {
  ConflictError,
  ConflictErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { Title } from "@/core/domain/identity/entity";
import type { CreateTitleOutput } from "./dto";

export type CreateTitleInput = {
  name: string;
  orderIndex?: number;
};

export async function createTitle({
  container,
  input,
}: ServiceArgs<CreateTitleInput>): Promise<CreateTitleOutput> {
  if (input.name.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Title name is required",
    );
  }

  const orderIndex = input.orderIndex ?? 0;
  if (orderIndex < 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Order index must be non-negative",
    );
  }

  const existingByName = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.titleRepository.findByName(input.name);
    },
  );

  if (existingByName) {
    throw new ConflictError(
      ConflictErrorCode.Conflict,
      `Title name '${input.name}' is already in use`,
    );
  }

  const { entity: title } = Title.create({
    name: input.name,
    orderIndex,
  });

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.titleRepository.save(title);
  });

  return {
    titleId: title.titleId,
    name: title.name,
    orderIndex: title.orderIndex,
    createdAt: title.createdAt,
  };
}
