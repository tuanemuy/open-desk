import type { InferSelectModel } from "drizzle-orm";
import { eq, sql } from "drizzle-orm";
import { pluginApps, plugins } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { Plugin } from "@/core/domain/app/entity";
import type { PluginRepository } from "@/core/domain/app/ports/pluginRepository";
import type {
  AppId as AppIdType,
  PluginId as PluginIdType,
  PluginName as PluginNameType,
} from "@/core/domain/app/valueObject";
import { PluginId, PluginName } from "@/core/domain/app/valueObject";
import type { Executor } from "../client";

type PluginDataModel = InferSelectModel<typeof plugins>;

export class DrizzleSqlitePluginRepository implements PluginRepository {
  constructor(private readonly executor: Executor) {}

  private into(
    data: PluginDataModel,
    installedAppIds: readonly AppIdType[],
  ): Plugin {
    return {
      pluginId: data.id as PluginIdType,
      name: data.name as PluginNameType,
      description: data.description,
      isActive: data.isActive,
      isPreinstalled: data.isPreinstalled,
      installedAppIds,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  private async getInstalledAppIds(pluginId: string): Promise<AppIdType[]> {
    const results = await this.executor
      .select({ appId: pluginApps.appId })
      .from(pluginApps)
      .where(eq(pluginApps.pluginId, pluginId));

    return results.map((r) => r.appId as AppIdType);
  }

  async findById(pluginId: PluginIdType): Promise<Plugin | null> {
    try {
      const results = await this.executor
        .select()
        .from(plugins)
        .where(eq(plugins.id, pluginId))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      const installedAppIds = await this.getInstalledAppIds(results[0].id);
      return this.into(results[0], installedAppIds);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find plugin by id",
        error,
      );
    }
  }

  async list(
    offset: number,
    limit: number,
  ): Promise<{ plugins: Plugin[]; totalCount: number }> {
    try {
      const [items, countResult] = await Promise.all([
        this.executor.select().from(plugins).limit(limit).offset(offset),
        this.executor.select({ count: sql`count(*)` }).from(plugins),
      ]);

      const pluginList = await Promise.all(
        items.map(async (item) => {
          const installedAppIds = await this.getInstalledAppIds(item.id);
          return this.into(item, installedAppIds);
        }),
      );

      return {
        plugins: pluginList,
        totalCount: Number(countResult[0].count),
      };
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to list plugins",
        error,
      );
    }
  }

  async findPreinstalled(): Promise<Plugin[]> {
    try {
      const results = await this.executor
        .select()
        .from(plugins)
        .where(eq(plugins.isPreinstalled, true));

      return Promise.all(
        results.map(async (item) => {
          const installedAppIds = await this.getInstalledAppIds(item.id);
          return this.into(item, installedAppIds);
        }),
      );
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find preinstalled plugins",
        error,
      );
    }
  }

  async save(plugin: Plugin): Promise<void> {
    try {
      await this.executor
        .insert(plugins)
        .values({
          id: plugin.pluginId,
          name: plugin.name,
          description: plugin.description,
          isActive: plugin.isActive,
          isPreinstalled: plugin.isPreinstalled,
          createdAt: plugin.createdAt,
          updatedAt: plugin.updatedAt,
        })
        .onConflictDoUpdate({
          target: plugins.id,
          set: {
            name: plugin.name,
            description: plugin.description,
            isActive: plugin.isActive,
            isPreinstalled: plugin.isPreinstalled,
            updatedAt: plugin.updatedAt,
          },
        });

      // Sync installed app associations
      await this.executor
        .delete(pluginApps)
        .where(eq(pluginApps.pluginId, plugin.pluginId));

      if (plugin.installedAppIds.length > 0) {
        await this.executor.insert(pluginApps).values(
          plugin.installedAppIds.map((appId) => ({
            pluginId: plugin.pluginId as string,
            appId: appId as string,
          })),
        );
      }
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save plugin",
        error,
      );
    }
  }

  async delete(pluginId: PluginIdType): Promise<void> {
    try {
      await this.executor.delete(plugins).where(eq(plugins.id, pluginId));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete plugin",
        error,
      );
    }
  }

  async importFromFile(file: ArrayBuffer): Promise<Plugin> {
    // Stub: In a real implementation, this would deserialize plugin data from a file
    try {
      const decoder = new TextDecoder();
      const text = decoder.decode(file);
      const data = JSON.parse(text) as {
        name?: string;
        description?: string | null;
      };

      const plugin: Plugin = {
        pluginId: PluginId.generate(),
        name: PluginName.create(data.name ?? "Imported Plugin"),
        description: data.description ?? null,
        isActive: true,
        isPreinstalled: false,
        installedAppIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.save(plugin);
      return plugin;
    } catch (error) {
      if (error instanceof SystemError) {
        throw error;
      }
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to import plugin from file",
        error,
      );
    }
  }
}
