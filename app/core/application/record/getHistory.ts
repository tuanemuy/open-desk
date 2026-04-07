import type { AppId } from "@/core/domain/app/valueObject";
import { RecordId } from "@/core/domain/record/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { GetHistoryOutput, RecordHistoryDto } from "./dto";

export type GetHistoryInput = {
  readonly appId: string;
  readonly recordId: string;
};

export async function getHistory({
  container,
  input,
}: ServiceArgs<GetHistoryInput>): Promise<GetHistoryOutput> {
  const appId = input.appId as AppId;
  const recordId = RecordId.create(input.recordId);

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const record = await ctx.recordRepository.findById(appId, recordId);
    if (!record) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Record ${input.recordId} not found`,
      );
    }

    const histories = await ctx.recordHistoryRepository.findByRecordId(
      appId,
      recordId,
    );

    const historyDtos: RecordHistoryDto[] = histories.map((h) => ({
      historyId: h.historyId,
      recordId: h.recordId,
      appId: h.appId,
      version: h.version,
      changedFields: h.changedFields,
      modifierId: h.modifierId,
      modifiedAt: h.modifiedAt,
    }));

    return { histories: historyDtos };
  });
}
