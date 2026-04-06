import type { AppCategory } from "../entity";
import type { AppId } from "../valueObject";

export interface AppCategoryRepository {
  findByAppId(appId: AppId): Promise<AppCategory | null>;
  save(category: AppCategory): Promise<void>;
}
