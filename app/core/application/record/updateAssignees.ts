import type { AppId } from "@/core/domain/app/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";
import { Record } from "@/core/domain/record/entity";
import { RecordId } from "@/core/domain/record/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { UpdateAssigneesOutput } from "./dto";

export type UpdateAssigneesInput = {
  readonly appId: string;
  readonly recordId: string;
  readonly assignees: readonly string[];
  readonly revision?: number;
};

export async function updateAssignees({
  container,
  input,
}: ServiceArgs<UpdateAssigneesInput>): Promise<UpdateAssigneesOutput> {
  const appId = input.appId as AppId;
  const recordId = RecordId.create(input.recordId);
  const assignees = input.assignees.map((id) => id as UserId);
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
      await container.processExecutionService.updateAssignees(
        record,
        assignees,
      );

    await ctx.recordRepository.save(updatedRecord);

    return { revision: updatedRecord.revision };
  });
}
