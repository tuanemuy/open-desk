import type { AppId } from "@/core/domain/app/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";
import { Record, RecordHistory } from "@/core/domain/record/entity";
import type { FieldValue } from "@/core/domain/record/valueObject";
import { FieldCode, RecordId } from "@/core/domain/record/valueObject";
import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";
import type { BulkUpdateRecordOutput } from "./dto";
import { buildFieldDiffs } from "./helpers";

const MAX_BATCH_SIZE = 100;

export type BulkUpdateRecordsInput = {
  readonly appId: string;
  readonly records: readonly {
    readonly recordId: string;
    readonly fieldValues: ReadonlyMap<string, FieldValue>;
    readonly revision?: number;
  }[];
  readonly modifierId: string;
};

export async function bulkUpdateRecords({
  container,
  input,
}: ServiceArgs<BulkUpdateRecordsInput>): Promise<BulkUpdateRecordOutput> {
  if (input.records.length > MAX_BATCH_SIZE) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      `Batch size cannot exceed ${MAX_BATCH_SIZE} records`,
    );
  }

  const appId = input.appId as AppId;
  const modifierId = input.modifierId as UserId;

  for (const rec of input.records) {
    const fieldValues = new Map<
      ReturnType<typeof FieldCode.create>,
      FieldValue
    >();
    for (const [key, value] of rec.fieldValues) {
      fieldValues.set(FieldCode.create(key), value);
    }
    await container.recordValidationService.validateFieldValues(
      appId,
      fieldValues,
      true,
    );
  }

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const updatedRecords: import("@/core/domain/record/entity").Record[] = [];

    for (const rec of input.records) {
      const recordId = RecordId.create(rec.recordId);
      const existing = await ctx.recordRepository.findById(appId, recordId);
      if (!existing) {
        throw new NotFoundError(
          NotFoundErrorCode.NotFound,
          `Record ${rec.recordId} not found`,
        );
      }

      Record.checkRevision(existing, rec.revision ?? -1);

      const fieldValues = new Map<
        ReturnType<typeof FieldCode.create>,
        FieldValue
      >();
      for (const [key, value] of rec.fieldValues) {
        fieldValues.set(FieldCode.create(key), value);
      }

      const previousFieldValues = existing.fieldValues;
      const { entity: updatedRecord } = Record.updateFieldValues(
        existing,
        fieldValues,
        true,
      );
      const incrementedRecord = Record.incrementRevision(updatedRecord);
      const finalRecord = Record.setModifier(incrementedRecord, modifierId);
      updatedRecords.push(finalRecord);

      const diffs = buildFieldDiffs(
        previousFieldValues,
        finalRecord.fieldValues,
      );
      const latestHistory = await ctx.recordHistoryRepository.findByRecordId(
        appId,
        finalRecord.recordId,
      );
      const nextVersion =
        latestHistory.length > 0 ? latestHistory[0].version + 1 : 2;

      const history = RecordHistory.create({
        recordId: finalRecord.recordId,
        appId,
        version: nextVersion,
        changedFields: diffs,
        modifierId,
      });
      await ctx.recordHistoryRepository.save(history);
    }

    await ctx.recordRepository.saveBatch(updatedRecords);

    return {
      records: updatedRecords.map((r) => ({
        recordId: r.recordId,
        revision: r.revision,
      })),
    };
  });
}
