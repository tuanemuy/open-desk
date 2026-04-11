import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { ApiTokenRecord } from "@/core/domain/identity/entity";
import type { ApiScope } from "@/core/domain/identity/valueObject";
import { BearerToken, UserId } from "@/core/domain/identity/valueObject";
import type { IssueApiTokenOutput } from "./dto";

const VALID_SCOPES: readonly ApiScope[] = [
  "k:app_record:read",
  "k:app_record:write",
  "k:app_settings:read",
  "k:app_settings:write",
  "k:file:read",
  "k:file:write",
];

export type IssueApiTokenInput = {
  userId: string;
  scopes: string[];
  summary: string;
  expiresAt?: Date | null;
};

export async function issueApiToken({
  container,
  input,
}: ServiceArgs<IssueApiTokenInput>): Promise<IssueApiTokenOutput> {
  if (input.userId.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "User ID is required",
    );
  }
  if (input.scopes.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "At least one scope is required",
    );
  }
  if (input.summary.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Summary is required",
    );
  }

  const validatedScopes: ApiScope[] = [];
  for (const scope of input.scopes) {
    if (!VALID_SCOPES.includes(scope as ApiScope)) {
      throw new ValidationError(
        ValidationErrorCode.InvalidInput,
        `Invalid scope: ${scope}`,
      );
    }
    validatedScopes.push(scope as ApiScope);
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

  const rawToken = container.bearerTokenHasher.generate();
  const hashedToken = container.bearerTokenHasher.hash(rawToken);

  const record = ApiTokenRecord.create({
    userId,
    tokenHash: hashedToken.value,
    summary: input.summary,
    scopes: validatedScopes,
    expiresAt: input.expiresAt ?? null,
  });

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.apiTokenRecordRepository.save(record);
  });

  return {
    id: record.id,
    token: BearerToken.create(rawToken),
    summary: record.summary,
    scopes: [...record.scopes],
    createdAt: record.createdAt,
    expiresAt: record.expiresAt,
  };
}
