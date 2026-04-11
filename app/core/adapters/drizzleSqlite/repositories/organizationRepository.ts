import type { InferSelectModel } from "drizzle-orm";
import { eq, isNull } from "drizzle-orm";
import { organizations } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { Organization } from "@/core/domain/identity/entity";
import type { OrganizationRepository } from "@/core/domain/identity/ports/organizationRepository";
import type { OrganizationId as OrganizationIdType } from "@/core/domain/identity/valueObject";
import type { Executor } from "../client";

type OrganizationDataModel = InferSelectModel<typeof organizations>;

export class DrizzleSqliteOrganizationRepository
  implements OrganizationRepository
{
  constructor(private readonly executor: Executor) {}

  private into(data: OrganizationDataModel): Organization {
    return {
      organizationId: data.id as OrganizationIdType,
      name: data.name,
      code: data.code,
      parentOrganizationId:
        data.parentOrganizationId !== null
          ? (data.parentOrganizationId as OrganizationIdType)
          : null,
      orderIndex: data.orderIndex,
    };
  }

  async findById(
    organizationId: OrganizationIdType,
  ): Promise<Organization | null> {
    try {
      const results = await this.executor
        .select()
        .from(organizations)
        .where(eq(organizations.id, organizationId))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find organization by id",
        error,
      );
    }
  }

  async findByCode(code: string): Promise<Organization | null> {
    try {
      const results = await this.executor
        .select()
        .from(organizations)
        .where(eq(organizations.code, code))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find organization by code",
        error,
      );
    }
  }

  async findByParentId(
    parentOrganizationId: OrganizationIdType | null,
  ): Promise<Organization[]> {
    try {
      const whereClause =
        parentOrganizationId === null
          ? isNull(organizations.parentOrganizationId)
          : eq(organizations.parentOrganizationId, parentOrganizationId);

      const results = await this.executor
        .select()
        .from(organizations)
        .where(whereClause)
        .orderBy(organizations.orderIndex);

      return results.map((r) => this.into(r));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find organizations by parent id",
        error,
      );
    }
  }

  async findRoot(): Promise<Organization[]> {
    try {
      const results = await this.executor
        .select()
        .from(organizations)
        .where(isNull(organizations.parentOrganizationId))
        .orderBy(organizations.orderIndex);

      return results.map((r) => this.into(r));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find root organizations",
        error,
      );
    }
  }

  async save(organization: Organization): Promise<void> {
    try {
      await this.executor
        .insert(organizations)
        .values({
          id: organization.organizationId,
          name: organization.name,
          code: organization.code,
          parentOrganizationId: organization.parentOrganizationId,
          orderIndex: organization.orderIndex,
        })
        .onConflictDoUpdate({
          target: organizations.id,
          set: {
            name: organization.name,
            code: organization.code,
            parentOrganizationId: organization.parentOrganizationId,
            orderIndex: organization.orderIndex,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save organization",
        error,
      );
    }
  }

  async delete(organizationId: OrganizationIdType): Promise<void> {
    try {
      await this.executor
        .delete(organizations)
        .where(eq(organizations.id, organizationId));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete organization",
        error,
      );
    }
  }

  async findAll(): Promise<Organization[]> {
    try {
      const results = await this.executor
        .select()
        .from(organizations)
        .orderBy(organizations.orderIndex);

      return results.map((r) => this.into(r));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find all organizations",
        error,
      );
    }
  }
}
