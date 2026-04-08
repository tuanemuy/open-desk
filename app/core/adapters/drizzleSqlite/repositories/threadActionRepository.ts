import type { InferSelectModel } from "drizzle-orm";
import { eq, sql } from "drizzle-orm";
import { threadActions } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { UserId } from "@/core/domain/identity/valueObject";
import type { ThreadAction } from "@/core/domain/space/entity";
import type { ThreadActionRepository } from "@/core/domain/space/ports/threadActionRepository";
import type {
  AppId as AppIdType,
  ThreadActionFieldMapping as ThreadActionFieldMappingType,
  ThreadActionId as ThreadActionIdType,
  ThreadActionName as ThreadActionNameType,
} from "@/core/domain/space/valueObject";
import type { Executor } from "../client";

type ThreadActionDataModel = InferSelectModel<typeof threadActions>;

export class DrizzleSqliteThreadActionRepository
  implements ThreadActionRepository
{
  constructor(private readonly executor: Executor) {}

  private into(data: ThreadActionDataModel): ThreadAction {
    return {
      threadActionId: data.id as ThreadActionIdType,
      actionName: data.actionName as ThreadActionNameType,
      destinationAppId: data.destinationAppId as AppIdType,
      fieldMappings:
        data.fieldMappings as unknown as readonly ThreadActionFieldMappingType[],
      modifierId: data.modifierId as UserId,
      modifiedAt: data.modifiedAt,
      createdAt: data.createdAt,
    };
  }

  async findById(
    threadActionId: ThreadActionIdType,
  ): Promise<ThreadAction | null> {
    try {
      const results = await this.executor
        .select()
        .from(threadActions)
        .where(eq(threadActions.id, threadActionId))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find thread action by id",
        error,
      );
    }
  }

  async list(
    offset: number,
    limit: number,
  ): Promise<{ actions: ThreadAction[]; totalCount: number }> {
    try {
      const [items, countResult] = await Promise.all([
        this.executor.select().from(threadActions).limit(limit).offset(offset),
        this.executor.select({ count: sql`count(*)` }).from(threadActions),
      ]);

      return {
        actions: items.map((item) => this.into(item)),
        totalCount: Number(countResult[0].count),
      };
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to list thread actions",
        error,
      );
    }
  }

  async save(action: ThreadAction): Promise<void> {
    try {
      await this.executor
        .insert(threadActions)
        .values({
          id: action.threadActionId,
          actionName: action.actionName,
          destinationAppId: action.destinationAppId,
          fieldMappings: action.fieldMappings as unknown as Record<
            string,
            unknown
          >[],
          modifierId: action.modifierId,
          modifiedAt: action.modifiedAt,
          createdAt: action.createdAt,
        })
        .onConflictDoUpdate({
          target: threadActions.id,
          set: {
            actionName: action.actionName,
            destinationAppId: action.destinationAppId,
            fieldMappings: action.fieldMappings as unknown as Record<
              string,
              unknown
            >[],
            modifierId: action.modifierId,
            modifiedAt: action.modifiedAt,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save thread action",
        error,
      );
    }
  }

  async delete(threadActionId: ThreadActionIdType): Promise<void> {
    try {
      await this.executor
        .delete(threadActions)
        .where(eq(threadActions.id, threadActionId));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete thread action",
        error,
      );
    }
  }
}
