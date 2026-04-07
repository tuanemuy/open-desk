import type { InferSelectModel } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { appActions } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { AppAction } from "@/core/domain/app/entity";
import type { AppActionRepository } from "@/core/domain/app/ports/appActionRepository";
import type {
  ActionAllowedEntity as ActionAllowedEntityType,
  ActionFieldMapping as ActionFieldMappingType,
  AppActionId as AppActionIdType,
  AppId as AppIdType,
} from "@/core/domain/app/valueObject";
import type { Executor } from "../client";

type AppActionDataModel = InferSelectModel<typeof appActions>;

export class DrizzleSqliteAppActionRepository implements AppActionRepository {
  constructor(private readonly executor: Executor) {}

  private into(data: AppActionDataModel): AppAction {
    return {
      actionId: data.id as AppActionIdType,
      appId: data.appId as AppIdType,
      actionName: data.actionName,
      destinationAppId: data.destinationAppId as AppIdType,
      fieldMappings:
        data.fieldMappings as unknown as readonly ActionFieldMappingType[],
      allowedEntities:
        data.allowedEntities as unknown as readonly ActionAllowedEntityType[],
      filterCondition: data.filterCondition,
      index: data.index,
    };
  }

  async findById(actionId: AppActionIdType): Promise<AppAction | null> {
    try {
      const results = await this.executor
        .select()
        .from(appActions)
        .where(eq(appActions.id, actionId))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find app action by id",
        error,
      );
    }
  }

  async findByAppId(appId: AppIdType): Promise<readonly AppAction[]> {
    try {
      const results = await this.executor
        .select()
        .from(appActions)
        .where(eq(appActions.appId, appId));

      return results.map((r) => this.into(r));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find app actions by app id",
        error,
      );
    }
  }

  async save(action: AppAction): Promise<void> {
    try {
      await this.executor
        .insert(appActions)
        .values({
          id: action.actionId,
          appId: action.appId,
          actionName: action.actionName,
          destinationAppId: action.destinationAppId,
          fieldMappings: action.fieldMappings as unknown as Record<
            string,
            unknown
          >[],
          allowedEntities: action.allowedEntities as unknown as Record<
            string,
            unknown
          >[],
          filterCondition: action.filterCondition,
          index: action.index,
        })
        .onConflictDoUpdate({
          target: appActions.id,
          set: {
            appId: action.appId,
            actionName: action.actionName,
            destinationAppId: action.destinationAppId,
            fieldMappings: action.fieldMappings as unknown as Record<
              string,
              unknown
            >[],
            allowedEntities: action.allowedEntities as unknown as Record<
              string,
              unknown
            >[],
            filterCondition: action.filterCondition,
            index: action.index,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save app action",
        error,
      );
    }
  }

  async delete(actionId: AppActionIdType): Promise<void> {
    try {
      await this.executor.delete(appActions).where(eq(appActions.id, actionId));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete app action",
        error,
      );
    }
  }
}
