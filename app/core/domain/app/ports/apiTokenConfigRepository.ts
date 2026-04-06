import type { ApiTokenConfig } from "../entity";
import type { ApiTokenId, AppId } from "../valueObject";

export interface ApiTokenConfigRepository {
  findById(tokenId: ApiTokenId): Promise<ApiTokenConfig | null>;
  findByAppId(appId: AppId): Promise<readonly ApiTokenConfig[]>;
  save(config: ApiTokenConfig): Promise<void>;
  delete(tokenId: ApiTokenId): Promise<void>;
  countByAppId(appId: AppId): Promise<number>;
  findByTokenHash(tokenHash: string): Promise<ApiTokenConfig | null>;
}
