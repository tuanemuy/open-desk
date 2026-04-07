import { evaluateBatch } from "@/core/domain/access-control/services/aclEvaluationService";
import type { RecordId } from "@/core/domain/access-control/valueObject";
import { FieldValue as AclFieldValue } from "@/core/domain/access-control/valueObject";
import type {
  FieldCode as AppFieldCode,
  AppId,
} from "@/core/domain/app/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";
import { ValidationError, ValidationErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import { buildUserAclContext } from "./buildUserAclContext";
import type { EvaluateBatchOutput } from "./dto";

const MAX_RECORDS = 100;

export type EvaluateBatchRecordPermissionsInput = {
  readonly operatorId: string;
  readonly appId: string;
  readonly recordIds: readonly string[];
};

export async function evaluateBatchRecordPermissions({
  container,
  input,
}: ServiceArgs<EvaluateBatchRecordPermissionsInput>): Promise<EvaluateBatchOutput> {
  if (input.recordIds.length > MAX_RECORDS) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      `Cannot evaluate more than ${MAX_RECORDS} records`,
    );
  }

  const appId = input.appId as AppId;
  const operatorId = input.operatorId as UserId;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const userContext = await buildUserAclContext(ctx, operatorId);

    const appAcl = await ctx.appAclRepository.findByAppId(appId);
    const recordAcl = await ctx.recordAclRepository.findByAppId(appId);
    const fieldAcl = await ctx.fieldAclRepository.findByAppId(appId);

    const records: {
      readonly recordId: RecordId;
      readonly fieldValues: ReadonlyMap<
        AppFieldCode,
        ReturnType<typeof AclFieldValue.create>
      >;
    }[] = [];

    for (const id of input.recordIds) {
      const record = await ctx.recordRepository.findById(
        appId,
        id as unknown as import("@/core/domain/record/valueObject").RecordId,
      );
      if (record) {
        const aclFieldValues = new Map<
          AppFieldCode,
          ReturnType<typeof AclFieldValue.create>
        >();
        for (const [fieldCode, fieldValue] of record.fieldValues) {
          aclFieldValues.set(
            fieldCode as unknown as AppFieldCode,
            AclFieldValue.create(fieldValue.type, fieldValue.value),
          );
        }
        records.push({
          recordId: id as unknown as RecordId,
          fieldValues: aclFieldValues,
        });
      }
    }

    const appFields = await ctx.fieldRepository.findByAppId(appId);
    const fieldCodes = appFields.map((f) => f.fieldCode);

    const results = evaluateBatch(
      { filterCondEvaluator: container.filterCondEvaluator },
      appAcl,
      recordAcl,
      fieldAcl,
      userContext,
      false,
      records,
      fieldCodes,
    );

    return { results };
  });
}
