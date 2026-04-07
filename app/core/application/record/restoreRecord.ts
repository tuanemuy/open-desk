import type { AppId } from "@/core/domain/app/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";
import { Record, RecordHistory } from "@/core/domain/record/entity";
import type { FieldValue } from "@/core/domain/record/valueObject";
import { type FieldCode, RecordId } from "@/core/domain/record/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { RestoreRecordOutput } from "./dto";
import { buildFieldDiffs } from "./helpers";

export type RestoreRecordInput = {
  readonly appId: string;
  readonly recordId: string;
  readonly version: number;
  readonly modifierId: string;
};

export async function restoreRecord({
  container,
  input,
}: ServiceArgs<RestoreRecordInput>): Promise<RestoreRecordOutput> {
  const appId = input.appId as AppId;
  const recordId = RecordId.create(input.recordId);
  const modifierId = input.modifierId as UserId;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const record = await ctx.recordRepository.findById(appId, recordId);
    if (!record) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Record ${input.recordId} not found`,
      );
    }

    const historyEntry = await ctx.recordHistoryRepository.findByVersion(
      appId,
      recordId,
      input.version,
    );
    if (!historyEntry) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `History version ${input.version} not found for record ${input.recordId}`,
      );
    }

    const restoreRawValues = RecordHistory.buildRestoreValues(historyEntry);

    const restoreValues = new Map<
      ReturnType<typeof FieldCode.create>,
      FieldValue
    >();
    for (const [fieldCode, rawValue] of restoreRawValues) {
      const existingFieldValue = record.fieldValues.get(fieldCode);
      if (existingFieldValue) {
        restoreValues.set(fieldCode, {
          ...existingFieldValue,
          value: JSON.parse(rawValue),
        } as FieldValue);
      }
    }

    await container.recordValidationService.validateFieldValues(
      appId,
      restoreValues,
      true,
    );

    const previousFieldValues = record.fieldValues;
    const { entity: restoredRecord } = Record.updateFieldValues(
      record,
      restoreValues,
      true,
    );
    const incrementedRecord = Record.incrementRevision(restoredRecord);
    const finalRecord = Record.setModifier(incrementedRecord, modifierId);

    await ctx.recordRepository.save(finalRecord);

    const diffs = buildFieldDiffs(previousFieldValues, finalRecord.fieldValues);
    const allHistories = await ctx.recordHistoryRepository.findByRecordId(
      appId,
      recordId,
    );
    const nextVersion =
      allHistories.length > 0 ? allHistories[0].version + 1 : 2;

    const history = RecordHistory.create({
      recordId: finalRecord.recordId,
      appId,
      version: nextVersion,
      changedFields: diffs,
      modifierId,
    });
    await ctx.recordHistoryRepository.save(history);

    return { revision: finalRecord.revision };
  });
}
