import type { AppId } from "@/core/domain/app/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";
import { Record, RecordHistory } from "@/core/domain/record/entity";
import type { FieldValue } from "@/core/domain/record/valueObject";
import { FieldCode } from "@/core/domain/record/valueObject";
import { ValidationError, ValidationErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { BulkCreateRecordOutput } from "./dto";

const MAX_BATCH_SIZE = 100;

export type BulkCreateRecordsInput = {
  readonly appId: string;
  readonly records: readonly {
    readonly fieldValues: ReadonlyMap<string, FieldValue>;
  }[];
  readonly creatorId: string;
};

export async function bulkCreateRecords({
  container,
  input,
}: ServiceArgs<BulkCreateRecordsInput>): Promise<BulkCreateRecordOutput> {
  if (input.records.length > MAX_BATCH_SIZE) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      `Batch size cannot exceed ${MAX_BATCH_SIZE} records`,
    );
  }

  const appId = input.appId as AppId;
  const creatorId = input.creatorId as UserId;

  const parsedRecords: {
    fieldValues: Map<ReturnType<typeof FieldCode.create>, FieldValue>;
  }[] = [];
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
      false,
    );
    parsedRecords.push({ fieldValues });
  }

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const entities: (typeof Record.create extends (...args: never[]) => {
      entity: infer E;
    }
      ? E
      : never)[] = [];

    for (const rec of parsedRecords) {
      const { entity: record } = Record.create({ appId, creatorId });
      const { entity: recordWithFields } = Record.updateFieldValues(
        record,
        rec.fieldValues,
        false,
      );
      entities.push(recordWithFields);
    }

    await ctx.recordRepository.saveBatch(entities);

    for (const entity of entities) {
      const history = RecordHistory.create({
        recordId: entity.recordId,
        appId,
        version: 1,
        changedFields: [],
        modifierId: creatorId,
      });
      await ctx.recordHistoryRepository.save(history);
    }

    return {
      ids: entities.map((e) => e.recordId),
      revisions: entities.map((e) => e.revision),
    };
  });
}
