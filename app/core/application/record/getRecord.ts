import type { AppId } from "@/core/domain/app/valueObject";
import { RecordId } from "@/core/domain/record/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { GetRecordOutput, RecordDto } from "./dto";

export type GetRecordInput = {
  readonly appId: string;
  readonly recordId: string;
};

function toRecordDto(
  record: import("@/core/domain/record/entity").Record,
): RecordDto {
  return {
    recordId: record.recordId,
    appId: record.appId,
    revision: record.revision,
    fieldValues: record.fieldValues,
    status: record.status,
    statusAssignees: record.statusAssignees.map((id) => id as string),
    creatorId: record.creatorId,
    createdAt: record.createdAt,
    modifierId: record.modifierId,
    updatedAt: record.updatedAt,
  };
}

export { toRecordDto };

export async function getRecord({
  container,
  input,
}: ServiceArgs<GetRecordInput>): Promise<GetRecordOutput> {
  const appId = input.appId as AppId;
  const recordId = RecordId.create(input.recordId);

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const record = await ctx.recordRepository.findById(appId, recordId);
    if (!record) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Record ${input.recordId} not found in app ${input.appId}`,
      );
    }

    return { record: toRecordDto(record) };
  });
}
