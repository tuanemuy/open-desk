import type { View } from "../entity";
import type { AppId, ViewId } from "../valueObject";

export interface ViewRepository {
  findById(viewId: ViewId): Promise<View | null>;
  findByAppId(appId: AppId): Promise<readonly View[]>;
  save(view: View): Promise<void>;
  delete(viewId: ViewId): Promise<void>;
  existsByName(
    appId: AppId,
    viewName: string,
    excludeViewId?: ViewId,
  ): Promise<boolean>;
}
