import type { App } from "../entity";
import type { AppCode, AppId, AppStatus, SpaceId } from "../valueObject";

export type AppListFilter = Readonly<{
  ids?: readonly AppId[];
  codes?: readonly AppCode[];
  name?: string;
  spaceIds?: readonly SpaceId[];
  status?: AppStatus;
}>;

export interface AppRepository {
  findById(appId: AppId): Promise<App | null>;
  findByCode(code: AppCode): Promise<App | null>;
  findBySpaceId(
    spaceId: SpaceId,
    offset: number,
    limit: number,
  ): Promise<readonly App[]>;
  list(
    filter: AppListFilter,
    offset: number,
    limit: number,
  ): Promise<readonly App[]>;
  count(filter: AppListFilter): Promise<number>;
  save(app: App): Promise<void>;
  delete(appId: AppId): Promise<void>;
  existsByCode(code: AppCode, excludeAppId?: AppId): Promise<boolean>;
  countAll(): Promise<number>;
}
