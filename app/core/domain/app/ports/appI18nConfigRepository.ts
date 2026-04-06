import type { AppI18nConfig } from "../entity";
import type { AppId } from "../valueObject";

export interface AppI18nConfigRepository {
  findByAppId(appId: AppId): Promise<AppI18nConfig | null>;
  save(config: AppI18nConfig): Promise<void>;
}
