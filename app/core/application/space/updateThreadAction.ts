import type { UserId } from "@/core/domain/identity/valueObject";
import { ThreadAction } from "@/core/domain/space/entity";
import type {
  AppId,
  ThreadActionFieldMapping,
  ThreadActionId,
} from "@/core/domain/space/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { ThreadActionDto } from "./dto";
import { assertSystemAdminForSpace } from "./helpers";

export type UpdateThreadActionInput = {
  readonly operatorId: string;
  readonly threadActionId: string;
  readonly actionName?: string;
  readonly destinationAppId?: string;
  readonly fieldMappings?: readonly ThreadActionFieldMapping[];
};

export async function updateThreadAction({
  container,
  input,
}: ServiceArgs<UpdateThreadActionInput>): Promise<ThreadActionDto> {
  const operatorId = input.operatorId as UserId;
  const threadActionId = input.threadActionId as unknown as ThreadActionId;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    await assertSystemAdminForSpace(ctx, operatorId);

    let action = await ctx.threadActionRepository.findById(threadActionId);
    if (!action) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Thread action ${input.threadActionId} not found`,
      );
    }

    if (input.actionName !== undefined) {
      action = ThreadAction.rename(action, input.actionName);
    }

    if (input.destinationAppId !== undefined) {
      const app = await ctx.appRepository.findById(
        input.destinationAppId as unknown as import("@/core/domain/app/valueObject").AppId,
      );
      if (!app) {
        throw new NotFoundError(
          NotFoundErrorCode.NotFound,
          `Destination app ${input.destinationAppId} not found`,
        );
      }
      action = ThreadAction.setDestinationApp(
        action,
        input.destinationAppId as unknown as AppId,
      );
    }

    if (input.fieldMappings !== undefined) {
      action = ThreadAction.setFieldMappings(action, input.fieldMappings);
    }

    action = ThreadAction.updateModifier(action, operatorId);

    await ctx.threadActionRepository.save(action);

    return {
      threadActionId: action.threadActionId,
      actionName: action.actionName,
      destinationAppId: action.destinationAppId,
      fieldMappings: action.fieldMappings,
      modifierId: action.modifierId,
      modifiedAt: action.modifiedAt,
      createdAt: action.createdAt,
    };
  });
}
