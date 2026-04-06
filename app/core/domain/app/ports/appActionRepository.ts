import type { AppAction } from "../entity";
import type { AppActionId, AppId } from "../valueObject";

export interface AppActionRepository {
  findById(actionId: AppActionId): Promise<AppAction | null>;
  findByAppId(appId: AppId): Promise<readonly AppAction[]>;
  save(action: AppAction): Promise<void>;
  delete(actionId: AppActionId): Promise<void>;
}
