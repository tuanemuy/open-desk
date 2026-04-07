import type { AppId } from "@/core/domain/app/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";
import { Record, RecordHistory } from "@/core/domain/record/entity";
import type { FieldValue } from "@/core/domain/record/valueObject";
import { FieldCode } from "@/core/domain/record/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { UpdateRecordOutput } from "./dto";
import { buildFieldDiffs } from "./helpers";

export type UpdateRecordInput = {
  readonly appId: string;
  readonly recordId: string;
  readonly fieldValues: ReadonlyMap<string, FieldValue>;
  readonly revision?: number;
  readonly modifierId: string;
};

export async function updateRecord({
  container,
  input,
}: ServiceArgs<UpdateRecordInput>): Promise<UpdateRecordOutput> {
  const appId = input.appId as AppId;
  const modifierId = input.modifierId as UserId;
  const revision = input.revision ?? -1;

  const fieldValues = new Map<
    ReturnType<typeof FieldCode.create>,
    FieldValue
  >();
  for (const [key, value] of input.fieldValues) {
    fieldValues.set(FieldCode.create(key), value);
  }

  await container.recordValidationService.validateFieldValues(
    appId,
    fieldValues,
    true,
  );

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const existing = await ctx.recordRepository.findById(
      appId,
      input.recordId as ReturnType<typeof FieldCode.create> extends never
        ? never
        : ReturnType<
            typeof import("@/core/domain/record/valueObject").RecordId["create"]
          >,
    );
    if (!existing) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Record ${input.recordId} not found`,
      );
    }

    Record.checkRevision(existing, revision);

    const previousFieldValues = existing.fieldValues;

    const { entity: updatedRecord } = Record.updateFieldValues(
      existing,
      fieldValues,
      true,
    );
    const incrementedRecord = Record.incrementRevision(updatedRecord);
    const finalRecord = Record.setModifier(incrementedRecord, modifierId);

    await ctx.recordRepository.save(finalRecord);

    const diffs = buildFieldDiffs(previousFieldValues, finalRecord.fieldValues);
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

    return { revision: finalRecord.revision };
  });
}
