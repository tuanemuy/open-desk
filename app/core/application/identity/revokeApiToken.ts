import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { ApiTokenRecord } from "@/core/domain/identity/entity";
import { ApiTokenRecordId } from "@/core/domain/identity/valueObject";

export type RevokeApiTokenInput = {
  tokenId: string;
};

export async function revokeApiToken({
  container,
  input,
}: ServiceArgs<RevokeApiTokenInput>): Promise<void> {
  if (input.tokenId.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Token ID is required",
    );
  }

  const tokenRecordId = ApiTokenRecordId.create(input.tokenId);

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    const record = await ctx.apiTokenRecordRepository.findById(tokenRecordId);

    if (!record) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `API token record ${input.tokenId} not found`,
      );
    }

    const revokedRecord = ApiTokenRecord.revoke(record);
    await ctx.apiTokenRecordRepository.save(revokedRecord);
  });
}
