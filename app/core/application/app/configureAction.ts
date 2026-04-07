import { AppAction } from "@/core/domain/app/entity";
import { AppErrorCode } from "@/core/domain/app/errorCode";
import type {
  ActionAllowedEntity,
  ActionFieldMapping,
} from "@/core/domain/app/valueObject";
import { AppActionId, AppId, AppStatus } from "@/core/domain/app/valueObject";
import { BusinessRuleError } from "@/core/domain/error";
import { UserId } from "@/core/domain/identity/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { ConfigureActionOutput } from "./dto";

export type ConfigureActionInput = {
  appId: string;
  actionId: string | null;
  actionName: string;
  destinationAppId: string;
  fieldMappings: ActionFieldMapping[];
  allowedEntities: ActionAllowedEntity[];
  filterCondition: string | null;
  index: number | null;
  executorId: string;
};

export async function configureAction({
  container,
  input,
}: ServiceArgs<ConfigureActionInput>): Promise<ConfigureActionOutput> {
  const appId = AppId.create(input.appId);
  const destinationAppId = AppId.create(input.destinationAppId);
  const _executorId = UserId.create(input.executorId);

  return await container.unitOfWorkProvider.transaction(async (repos) => {
    const app = await repos.appRepository.findById(appId);
    if (app === null) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `App ${input.appId} not found`,
      );
    }
    if (AppStatus.isDeleted(app.status)) {
      throw new BusinessRuleError(
        AppErrorCode.DeletedAppModification,
        "Cannot modify a deleted app",
      );
    }

    // Verify destination app exists
    const destApp = await repos.appRepository.findById(destinationAppId);
    if (destApp === null) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Destination app ${input.destinationAppId} not found`,
      );
    }

    let action: ReturnType<typeof AppAction.create>;

    if (input.actionId === null) {
      // Create new action
      const existingActions =
        await repos.appActionRepository.findByAppId(appId);
      action = AppAction.create({
        appId,
        actionName: input.actionName,
        destinationAppId,
        fieldMappings: input.fieldMappings,
        allowedEntities: input.allowedEntities,
        filterCondition: input.filterCondition,
        index: input.index ?? existingActions.length,
      });
    } else {
      // Update existing action
      const actionId = AppActionId.create(input.actionId);
      const existing = await repos.appActionRepository.findById(actionId);
      if (existing === null) {
        throw new NotFoundError(
          NotFoundErrorCode.NotFound,
          `Action ${input.actionId} not found`,
        );
      }
      action = AppAction.rename(existing, input.actionName);
      action = AppAction.setDestination(action, destinationAppId);
      action = AppAction.setFieldMappings(action, input.fieldMappings);
      action = AppAction.setAllowedEntities(action, input.allowedEntities);
      action = AppAction.setFilter(action, input.filterCondition);
      if (input.index !== null) {
        action = AppAction.reorder(action, input.index);
      }
    }

    await repos.appActionRepository.save(action);

    return {
      actionId: action.actionId,
      actionName: action.actionName,
      destinationAppId: action.destinationAppId,
    };
  });
}
