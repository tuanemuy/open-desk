import type { InferSelectModel } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { provisioningConfigs } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { ProvisioningConfig } from "@/core/domain/identity/entity";
import type { ProvisioningConfigRepository } from "@/core/domain/identity/ports/provisioningConfigRepository";
import type { HashedBearerToken as HashedBearerTokenType } from "@/core/domain/identity/valueObject";
import type { Executor } from "../client";

type ProvisioningConfigDataModel = InferSelectModel<typeof provisioningConfigs>;

export class DrizzleSqliteProvisioningConfigRepository
  implements ProvisioningConfigRepository
{
  constructor(private readonly executor: Executor) {}

  private into(data: ProvisioningConfigDataModel): ProvisioningConfig {
    return {
      isEnabled: data.isEnabled,
      bearerTokenHash:
        data.bearerTokenHash !== null && data.bearerTokenAlgorithm !== null
          ? ({
              value: data.bearerTokenHash,
              algorithm: data.bearerTokenAlgorithm,
            } as HashedBearerTokenType)
          : null,
      tokenIssuedAt: data.tokenIssuedAt,
      updatedAt: data.updatedAt,
    };
  }

  async find(): Promise<ProvisioningConfig> {
    try {
      const results = await this.executor
        .select()
        .from(provisioningConfigs)
        .limit(1);

      if (results.length === 0) {
        // Return default config if none exists
        return {
          isEnabled: false,
          bearerTokenHash: null,
          tokenIssuedAt: null,
          updatedAt: new Date(),
        };
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find provisioning config",
        error,
      );
    }
  }

  async save(config: ProvisioningConfig): Promise<void> {
    try {
      const existing = await this.executor
        .select()
        .from(provisioningConfigs)
        .limit(1);

      if (existing.length === 0) {
        await this.executor.insert(provisioningConfigs).values({
          isEnabled: config.isEnabled,
          bearerTokenHash: config.bearerTokenHash?.value ?? null,
          bearerTokenAlgorithm: config.bearerTokenHash?.algorithm ?? null,
          tokenIssuedAt: config.tokenIssuedAt,
          updatedAt: config.updatedAt,
        });
      } else {
        await this.executor
          .update(provisioningConfigs)
          .set({
            isEnabled: config.isEnabled,
            bearerTokenHash: config.bearerTokenHash?.value ?? null,
            bearerTokenAlgorithm: config.bearerTokenHash?.algorithm ?? null,
            tokenIssuedAt: config.tokenIssuedAt,
            updatedAt: config.updatedAt,
          })
          .where(eq(provisioningConfigs.id, existing[0].id));
      }
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save provisioning config",
        error,
      );
    }
  }
}
