import type { AppId } from "@/core/domain/app/valueObject";
import { Record } from "@/core/domain/record/entity";
import { RecordId } from "@/core/domain/record/valueObject";
import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";

const MAX_BATCH_SIZE = 100;

export type DeleteRecordsInput = {
  readonly appId: string;
  readonly recordIds: readonly string[];
  readonly revisions?: ReadonlyMap<string, number>;
};

export async function deleteRecords({
  container,
  input,
}: ServiceArgs<DeleteRecordsInput>): Promise<void> {
  if (input.recordIds.length > MAX_BATCH_SIZE) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      `Batch size cannot exceed ${MAX_BATCH_SIZE} records`,
    );
  }

  const appId = input.appId as AppId;
  const recordIds = input.recordIds.map((id) => RecordId.create(id));

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    for (const recordId of recordIds) {
      const record = await ctx.recordRepository.findById(appId, recordId);
      if (!record) {
        throw new NotFoundError(
          NotFoundErrorCode.NotFound,
          `Record ${recordId} not found`,
        );
      }

      if (input.revisions) {
        const expectedRevision = input.revisions.get(recordId as string);
        if (expectedRevision !== undefined) {
          Record.checkRevision(record, expectedRevision);
        }
      }
    }

    await ctx.recordRepository.delete(appId, recordIds);
  });
}
