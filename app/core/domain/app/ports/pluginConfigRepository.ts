import type { PluginConfig } from "../entity";
import type { AppId, PluginId } from "../valueObject";

export interface PluginConfigRepository {
  findByAppId(appId: AppId): Promise<readonly PluginConfig[]>;
  save(config: PluginConfig): Promise<void>;
  delete(appId: AppId, pluginId: PluginId): Promise<void>;
}
