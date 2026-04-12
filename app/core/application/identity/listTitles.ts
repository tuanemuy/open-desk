import { ValidationError, ValidationErrorCode } from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import type { TitleListOutput } from "./dto";

export type ListTitlesInput = {
  offset?: number;
  limit?: number;
  keyword?: string;
};

export async function listTitles({
  container,
  input,
}: ServiceArgs<ListTitlesInput>): Promise<TitleListOutput> {
  const offset = input.offset ?? 0;
  const limit = input.limit ?? 100;

  if (offset < 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Offset must be non-negative",
    );
  }
  if (limit < 1 || limit > 100) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Limit must be between 1 and 100",
    );
  }

  const result = await container.unitOfWorkProvider.transaction(async (ctx) => {
    return ctx.titleRepository.list({ offset, limit, keyword: input.keyword });
  });

  return {
    titles: result.titles.map((title) => ({
      titleId: title.titleId,
      name: title.name,
      orderIndex: title.orderIndex,
      createdAt: title.createdAt,
      updatedAt: title.updatedAt,
    })),
    totalCount: result.totalCount,
  };
}
