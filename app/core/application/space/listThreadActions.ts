import type { UserId } from "@/core/domain/identity/valueObject";
import type { ServiceArgs } from "../types";
import type { ThreadActionListOutput } from "./dto";
import { assertSystemAdminForSpace } from "./helpers";

export type ListThreadActionsInput = {
  readonly operatorId: string;
  readonly offset?: number;
  readonly limit?: number;
};

export async function listThreadActions({
  container,
  input,
}: ServiceArgs<ListThreadActionsInput>): Promise<ThreadActionListOutput> {
  const operatorId = input.operatorId as UserId;
  const offset = input.offset ?? 0;
  const limit = input.limit ?? 100;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    await assertSystemAdminForSpace(ctx, operatorId);

    const { actions, totalCount } = await ctx.threadActionRepository.list(
      offset,
      limit,
    );

    return {
      actions: actions.map((action) => ({
        threadActionId: action.threadActionId,
        actionName: action.actionName,
        destinationAppId: action.destinationAppId,
        fieldMappings: action.fieldMappings,
        modifierId: action.modifierId,
        modifiedAt: action.modifiedAt,
        createdAt: action.createdAt,
      })),
      totalCount,
    };
  });
}
