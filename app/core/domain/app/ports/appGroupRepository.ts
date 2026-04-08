import type { AppGroup } from "../entity";
import type { AppGroupId } from "../valueObject";

export interface AppGroupRepository {
  findById(appGroupId: AppGroupId): Promise<AppGroup | null>;
  list(
    offset: number,
    limit: number,
  ): Promise<{ groups: AppGroup[]; totalCount: number }>;
  findDefault(): Promise<AppGroup | null>;
  save(group: AppGroup): Promise<void>;
  delete(appGroupId: AppGroupId): Promise<void>;
}
