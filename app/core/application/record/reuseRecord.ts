import type { AppId } from "@/core/domain/app/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";
import { Record } from "@/core/domain/record/entity";
import { RecordId } from "@/core/domain/record/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { ReuseRecordOutput } from "./dto";

export type ReuseRecordInput = {
  readonly appId: string;
  readonly recordId: string;
  readonly creatorId: string;
};

export async function reuseRecord({
  container,
  input,
}: ServiceArgs<ReuseRecordInput>): Promise<ReuseRecordOutput> {
  const appId = input.appId as AppId;
  const recordId = RecordId.create(input.recordId);
  const creatorId = input.creatorId as UserId;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const record = await ctx.recordRepository.findById(appId, recordId);
    if (!record) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Record ${input.recordId} not found`,
      );
    }

    const draft = Record.reuse(record, creatorId);

    return { fieldValues: draft.fieldValues };
  });
}
