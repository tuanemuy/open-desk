import type { AppId } from "@/core/domain/app/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";
import { Record } from "@/core/domain/record/entity";
import { RecordId } from "@/core/domain/record/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { ChangeStatusOutput } from "./dto";

export type ChangeStatusInput = {
  readonly appId: string;
  readonly recordId: string;
  readonly action: string;
  readonly assignee?: string;
  readonly revision?: number;
};

export async function changeStatus({
  container,
  input,
}: ServiceArgs<ChangeStatusInput>): Promise<ChangeStatusOutput> {
  const appId = input.appId as AppId;
  const recordId = RecordId.create(input.recordId);
  const assignee = input.assignee ? (input.assignee as UserId) : undefined;
  const revision = input.revision ?? -1;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const record = await ctx.recordRepository.findById(appId, recordId);
    if (!record) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Record ${input.recordId} not found`,
      );
    }

    Record.checkRevision(record, revision);

    const { entity: updatedRecord } =
      await container.processExecutionService.executeTransition(
        record,
        input.action,
        assignee,
      );

    await ctx.recordRepository.save(updatedRecord);

    return { revision: updatedRecord.revision };
  });
}
