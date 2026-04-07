import type { InferSelectModel } from "drizzle-orm";
import { count, eq } from "drizzle-orm";
import { apiTokenConfigs } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { ApiTokenConfig } from "@/core/domain/app/entity";
import type { ApiTokenConfigRepository } from "@/core/domain/app/ports/apiTokenConfigRepository";
import type {
  ApiScope as ApiScopeType,
  ApiTokenId as ApiTokenIdType,
  AppId as AppIdType,
} from "@/core/domain/app/valueObject";
import type { Executor } from "../client";

type ApiTokenConfigDataModel = InferSelectModel<typeof apiTokenConfigs>;

export class DrizzleSqliteApiTokenConfigRepository
  implements ApiTokenConfigRepository
{
  constructor(private readonly executor: Executor) {}

  private into(data: ApiTokenConfigDataModel): ApiTokenConfig {
    return {
      tokenId: data.id as ApiTokenIdType,
      appId: data.appId as AppIdType,
      tokenHash: data.tokenHash,
      scopes: data.scopes as unknown as readonly ApiScopeType[],
      memo: data.memo,
    };
  }

  async findById(tokenId: ApiTokenIdType): Promise<ApiTokenConfig | null> {
    try {
      const results = await this.executor
        .select()
        .from(apiTokenConfigs)
        .where(eq(apiTokenConfigs.id, tokenId))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find API token config by id",
        error,
      );
    }
  }

  async findByAppId(appId: AppIdType): Promise<readonly ApiTokenConfig[]> {
    try {
      const results = await this.executor
        .select()
        .from(apiTokenConfigs)
        .where(eq(apiTokenConfigs.appId, appId));

      return results.map((r) => this.into(r));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find API token configs by app id",
        error,
      );
    }
  }

  async save(config: ApiTokenConfig): Promise<void> {
    try {
      await this.executor
        .insert(apiTokenConfigs)
        .values({
          id: config.tokenId,
          appId: config.appId,
          tokenHash: config.tokenHash,
          scopes: config.scopes as unknown as Record<string, unknown>[],
          memo: config.memo,
        })
        .onConflictDoUpdate({
          target: apiTokenConfigs.id,
          set: {
            appId: config.appId,
            tokenHash: config.tokenHash,
            scopes: config.scopes as unknown as Record<string, unknown>[],
            memo: config.memo,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save API token config",
        error,
      );
    }
  }

  async delete(tokenId: ApiTokenIdType): Promise<void> {
    try {
      await this.executor
        .delete(apiTokenConfigs)
        .where(eq(apiTokenConfigs.id, tokenId));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete API token config",
        error,
      );
    }
  }

  async countByAppId(appId: AppIdType): Promise<number> {
    try {
      const results = await this.executor
        .select({ count: count() })
        .from(apiTokenConfigs)
        .where(eq(apiTokenConfigs.appId, appId));

      return results[0]?.count ?? 0;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to count API token configs by app id",
        error,
      );
    }
  }

  async findByTokenHash(tokenHash: string): Promise<ApiTokenConfig | null> {
    try {
      const results = await this.executor
        .select()
        .from(apiTokenConfigs)
        .where(eq(apiTokenConfigs.tokenHash, tokenHash))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find API token config by token hash",
        error,
      );
    }
  }
}
