import type { InferSelectModel } from "drizzle-orm";
import { eq, sql } from "drizzle-orm";
import { appGroupApps, appGroups } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { AppGroup } from "@/core/domain/app/entity";
import type { AppGroupRepository } from "@/core/domain/app/ports/appGroupRepository";
import type {
  AppGroupId as AppGroupIdType,
  AppGroupName as AppGroupNameType,
  AppId as AppIdType,
} from "@/core/domain/app/valueObject";
import type { Executor } from "../client";

type AppGroupDataModel = InferSelectModel<typeof appGroups>;

export class DrizzleSqliteAppGroupRepository implements AppGroupRepository {
  constructor(private readonly executor: Executor) {}

  private into(
    data: AppGroupDataModel,
    appIds: readonly AppIdType[],
  ): AppGroup {
    return {
      appGroupId: data.id as AppGroupIdType,
      name: data.name as AppGroupNameType,
      isDefault: data.isDefault,
      appIds,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  private async getAppIds(appGroupId: string): Promise<AppIdType[]> {
    const results = await this.executor
      .select({ appId: appGroupApps.appId })
      .from(appGroupApps)
      .where(eq(appGroupApps.appGroupId, appGroupId));

    return results.map((r) => r.appId as AppIdType);
  }

  async findById(appGroupId: AppGroupIdType): Promise<AppGroup | null> {
    try {
      const results = await this.executor
        .select()
        .from(appGroups)
        .where(eq(appGroups.id, appGroupId))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      const appIds = await this.getAppIds(results[0].id);
      return this.into(results[0], appIds);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find app group by id",
        error,
      );
    }
  }

  async list(
    offset: number,
    limit: number,
  ): Promise<{ groups: AppGroup[]; totalCount: number }> {
    try {
      const [items, countResult] = await Promise.all([
        this.executor.select().from(appGroups).limit(limit).offset(offset),
        this.executor.select({ count: sql`count(*)` }).from(appGroups),
      ]);

      const groups = await Promise.all(
        items.map(async (item) => {
          const appIds = await this.getAppIds(item.id);
          return this.into(item, appIds);
        }),
      );

      return {
        groups,
        totalCount: Number(countResult[0].count),
      };
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to list app groups",
        error,
      );
    }
  }

  async findDefault(): Promise<AppGroup | null> {
    try {
      const results = await this.executor
        .select()
        .from(appGroups)
        .where(eq(appGroups.isDefault, true))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      const appIds = await this.getAppIds(results[0].id);
      return this.into(results[0], appIds);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find default app group",
        error,
      );
    }
  }

  async save(group: AppGroup): Promise<void> {
    try {
      await this.executor
        .insert(appGroups)
        .values({
          id: group.appGroupId,
          name: group.name,
          isDefault: group.isDefault,
          createdAt: group.createdAt,
          updatedAt: group.updatedAt,
        })
        .onConflictDoUpdate({
          target: appGroups.id,
          set: {
            name: group.name,
            isDefault: group.isDefault,
            updatedAt: group.updatedAt,
          },
        });

      // Sync app associations
      await this.executor
        .delete(appGroupApps)
        .where(eq(appGroupApps.appGroupId, group.appGroupId));

      if (group.appIds.length > 0) {
        await this.executor.insert(appGroupApps).values(
          group.appIds.map((appId) => ({
            appGroupId: group.appGroupId as string,
            appId: appId as string,
          })),
        );
      }
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save app group",
        error,
      );
    }
  }

  async delete(appGroupId: AppGroupIdType): Promise<void> {
    try {
      await this.executor.delete(appGroups).where(eq(appGroups.id, appGroupId));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete app group",
        error,
      );
    }
  }
}
