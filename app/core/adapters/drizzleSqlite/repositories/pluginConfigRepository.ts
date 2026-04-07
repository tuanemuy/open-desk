import type { InferSelectModel } from "drizzle-orm";
import { and, eq } from "drizzle-orm";
import { pluginConfigs } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { PluginConfig } from "@/core/domain/app/entity";
import type { PluginConfigRepository } from "@/core/domain/app/ports/pluginConfigRepository";
import type {
  AppId as AppIdType,
  PluginId as PluginIdType,
} from "@/core/domain/app/valueObject";
import type { Executor } from "../client";

type PluginConfigDataModel = InferSelectModel<typeof pluginConfigs>;

export class DrizzleSqlitePluginConfigRepository
  implements PluginConfigRepository
{
  constructor(private readonly executor: Executor) {}

  private into(data: PluginConfigDataModel): PluginConfig {
    return {
      pluginId: data.id as PluginIdType,
      appId: data.appId as AppIdType,
      isActive: data.isActive,
      config: data.config,
    };
  }

  async findByAppId(appId: AppIdType): Promise<readonly PluginConfig[]> {
    try {
      const results = await this.executor
        .select()
        .from(pluginConfigs)
        .where(eq(pluginConfigs.appId, appId));

      return results.map((r) => this.into(r));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find plugin configs by app id",
        error,
      );
    }
  }

  async save(config: PluginConfig): Promise<void> {
    try {
      await this.executor
        .insert(pluginConfigs)
        .values({
          id: config.pluginId,
          appId: config.appId,
          isActive: config.isActive,
          config: config.config,
        })
        .onConflictDoUpdate({
          target: pluginConfigs.id,
          set: {
            appId: config.appId,
            isActive: config.isActive,
            config: config.config,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save plugin config",
        error,
      );
    }
  }

  async delete(appId: AppIdType, pluginId: PluginIdType): Promise<void> {
    try {
      await this.executor
        .delete(pluginConfigs)
        .where(
          and(eq(pluginConfigs.appId, appId), eq(pluginConfigs.id, pluginId)),
        );
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete plugin config",
        error,
      );
    }
  }
}
