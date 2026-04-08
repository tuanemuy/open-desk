import type { Plugin } from "../entity";
import type { PluginId } from "../valueObject";

export interface PluginRepository {
  findById(pluginId: PluginId): Promise<Plugin | null>;
  list(
    offset: number,
    limit: number,
  ): Promise<{ plugins: Plugin[]; totalCount: number }>;
  findPreinstalled(): Promise<Plugin[]>;
  save(plugin: Plugin): Promise<void>;
  delete(pluginId: PluginId): Promise<void>;
  importFromFile(file: ArrayBuffer): Promise<Plugin>;
}
