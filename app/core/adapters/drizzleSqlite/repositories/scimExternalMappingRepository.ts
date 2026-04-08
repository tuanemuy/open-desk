import type { InferSelectModel } from "drizzle-orm";
import { and, eq } from "drizzle-orm";
import { scimExternalMappings } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { ScimExternalMapping } from "@/core/domain/identity/entity";
import type { ScimExternalMappingRepository } from "@/core/domain/identity/ports/scimExternalMappingRepository";
import type {
  ExternalId as ExternalIdType,
  ScimResourceType as ScimResourceTypeType,
} from "@/core/domain/identity/valueObject";
import type { Executor } from "../client";

type ScimExternalMappingDataModel = InferSelectModel<
  typeof scimExternalMappings
>;

export class DrizzleSqliteScimExternalMappingRepository
  implements ScimExternalMappingRepository
{
  constructor(private readonly executor: Executor) {}

  private into(data: ScimExternalMappingDataModel): ScimExternalMapping {
    return {
      externalId: data.externalId as ExternalIdType,
      resourceType: data.resourceType as ScimResourceTypeType,
      internalId: data.internalId,
      createdAt: data.createdAt,
    };
  }

  async findByExternalId(params: {
    externalId: ExternalIdType;
    resourceType: ScimResourceTypeType;
  }): Promise<ScimExternalMapping | null> {
    try {
      const results = await this.executor
        .select()
        .from(scimExternalMappings)
        .where(
          and(
            eq(scimExternalMappings.externalId, params.externalId),
            eq(scimExternalMappings.resourceType, params.resourceType),
          ),
        )
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find SCIM external mapping by external id",
        error,
      );
    }
  }

  async findByInternalId(params: {
    internalId: string;
    resourceType: ScimResourceTypeType;
  }): Promise<ScimExternalMapping | null> {
    try {
      const results = await this.executor
        .select()
        .from(scimExternalMappings)
        .where(
          and(
            eq(scimExternalMappings.internalId, params.internalId),
            eq(scimExternalMappings.resourceType, params.resourceType),
          ),
        )
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find SCIM external mapping by internal id",
        error,
      );
    }
  }

  async save(mapping: ScimExternalMapping): Promise<void> {
    try {
      await this.executor
        .insert(scimExternalMappings)
        .values({
          externalId: mapping.externalId,
          resourceType: mapping.resourceType,
          internalId: mapping.internalId,
          createdAt: mapping.createdAt,
        })
        .onConflictDoUpdate({
          target: [
            scimExternalMappings.externalId,
            scimExternalMappings.resourceType,
          ],
          set: {
            internalId: mapping.internalId,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save SCIM external mapping",
        error,
      );
    }
  }

  async delete(params: {
    externalId: ExternalIdType;
    resourceType: ScimResourceTypeType;
  }): Promise<void> {
    try {
      await this.executor
        .delete(scimExternalMappings)
        .where(
          and(
            eq(scimExternalMappings.externalId, params.externalId),
            eq(scimExternalMappings.resourceType, params.resourceType),
          ),
        );
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete SCIM external mapping",
        error,
      );
    }
  }
}
