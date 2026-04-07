import type { AppId } from "@/core/domain/app/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";
import { Record, RecordHistory } from "@/core/domain/record/entity";
import type { FieldValue } from "@/core/domain/record/valueObject";
import { FieldCode } from "@/core/domain/record/valueObject";
import type { ServiceArgs } from "../types";
import type { CreateRecordOutput } from "./dto";

export type CreateRecordInput = {
  readonly appId: string;
  readonly fieldValues: ReadonlyMap<string, FieldValue>;
  readonly creatorId: string;
};

export async function createRecord({
  container,
  input,
}: ServiceArgs<CreateRecordInput>): Promise<CreateRecordOutput> {
  const appId = input.appId as AppId;
  const creatorId = input.creatorId as UserId;

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
    false,
  );

  const { entity: record } = Record.create({ appId, creatorId });
  const { entity: recordWithFields } = Record.updateFieldValues(
    record,
    fieldValues,
    false,
  );

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.recordRepository.save(recordWithFields);

    const history = RecordHistory.create({
      recordId: recordWithFields.recordId,
      appId,
      version: 1,
      changedFields: [],
      modifierId: creatorId,
    });
    await ctx.recordHistoryRepository.save(history);

    return {
      recordId: recordWithFields.recordId,
      revision: recordWithFields.revision,
    };
  });
}
