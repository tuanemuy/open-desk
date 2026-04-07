import type { AppId } from "@/core/domain/app/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";
import { Record } from "@/core/domain/record/entity";
import { RecordId } from "@/core/domain/record/valueObject";
import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";
import type { BulkChangeStatusOutput } from "./dto";

const MAX_BATCH_SIZE = 100;

export type BulkChangeStatusInput = {
  readonly appId: string;
  readonly records: readonly {
    readonly recordId: string;
    readonly revision?: number;
  }[];
  readonly action: string;
  readonly assignee?: string;
};

export async function bulkChangeStatus({
  container,
  input,
}: ServiceArgs<BulkChangeStatusInput>): Promise<BulkChangeStatusOutput> {
  if (input.records.length > MAX_BATCH_SIZE) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      `Batch size cannot exceed ${MAX_BATCH_SIZE} records`,
    );
  }

  const appId = input.appId as AppId;
  const assignee = input.assignee ? (input.assignee as UserId) : undefined;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const updatedRecords: import("@/core/domain/record/entity").Record[] = [];

    for (const rec of input.records) {
      const recordId = RecordId.create(rec.recordId);
      const record = await ctx.recordRepository.findById(appId, recordId);
      if (!record) {
        throw new NotFoundError(
          NotFoundErrorCode.NotFound,
          `Record ${rec.recordId} not found`,
        );
      }

      Record.checkRevision(record, rec.revision ?? -1);

      const { entity: updatedRecord } =
        await container.processExecutionService.executeTransition(
          record,
          input.action,
          assignee,
        );

      updatedRecords.push(updatedRecord);
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
