import { ValidationError, ValidationErrorCode } from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import type { ListApiTokensOutput } from "./dto";

export type ListApiTokensInput = {
  offset: number;
  limit: number;
};

export async function listApiTokens({
  container,
  input,
}: ServiceArgs<ListApiTokensInput>): Promise<ListApiTokensOutput> {
  if (input.offset < 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Offset must be non-negative",
    );
  }
  if (input.limit <= 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Limit must be a positive integer",
    );
  }

  const result = await container.unitOfWorkProvider.transaction(async (ctx) => {
    return ctx.apiTokenRecordRepository.listAll({
      offset: input.offset,
      limit: input.limit,
    });
  });

  return {
    tokens: result.items.map((record) => ({
      id: record.id,
      summary: record.summary,
      scopes: [...record.scopes],
      userId: record.userId,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
      isRevoked: record.revokedAt !== null,
    })),
    totalCount: result.totalCount,
  };
}
