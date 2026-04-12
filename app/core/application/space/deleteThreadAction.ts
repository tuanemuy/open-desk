import type { UserId } from "@/core/domain/identity/valueObject";
import type { ThreadActionId } from "@/core/domain/space/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import { assertSystemAdminForSpace } from "./helpers";

export type DeleteThreadActionInput = {
  readonly operatorId: string;
  readonly threadActionId: string;
};

export async function deleteThreadAction({
  container,
  input,
}: ServiceArgs<DeleteThreadActionInput>): Promise<void> {
  const operatorId = input.operatorId as UserId;
  const threadActionId = input.threadActionId as unknown as ThreadActionId;

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await assertSystemAdminForSpace(ctx, operatorId);

    const action = await ctx.threadActionRepository.findById(threadActionId);
    if (!action) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Thread action ${input.threadActionId} not found`,
      );
    }

    await ctx.threadActionRepository.delete(threadActionId);
  });
}
