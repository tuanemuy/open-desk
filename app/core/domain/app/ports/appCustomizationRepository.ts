import type { AppCustomization } from "../entity";
import type { AppId } from "../valueObject";

export interface AppCustomizationRepository {
  findByAppId(appId: AppId): Promise<AppCustomization | null>;
  save(customization: AppCustomization): Promise<void>;
}
