import type { UserId } from "@/core/domain/identity/valueObject";
import { ThreadAction } from "@/core/domain/space/entity";
import type {
  AppId,
  ThreadActionFieldMapping,
} from "@/core/domain/space/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { ThreadActionDto } from "./dto";
import { assertSystemAdminForSpace } from "./helpers";

export type CreateThreadActionInput = {
  readonly operatorId: string;
  readonly actionName: string;
  readonly destinationAppId: string;
  readonly fieldMappings: readonly ThreadActionFieldMapping[];
};

export async function createThreadAction({
  container,
  input,
}: ServiceArgs<CreateThreadActionInput>): Promise<ThreadActionDto> {
  const operatorId = input.operatorId as UserId;
  const destinationAppId = input.destinationAppId as unknown as AppId;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    await assertSystemAdminForSpace(ctx, operatorId);

    const app = await ctx.appRepository.findById(
      input.destinationAppId as unknown as import("@/core/domain/app/valueObject").AppId,
    );
    if (!app) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Destination app ${input.destinationAppId} not found`,
      );
    }

    const action = ThreadAction.create({
      actionName: input.actionName,
      destinationAppId,
      fieldMappings: input.fieldMappings,
      modifierId: operatorId,
    });

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
