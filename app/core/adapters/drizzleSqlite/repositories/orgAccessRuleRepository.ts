import type { InferSelectModel } from "drizzle-orm";
import { and, eq } from "drizzle-orm";
import { orgAccessRules } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { OrgAccessRule } from "@/core/domain/access-control/entity";
import type { OrgAccessRuleRepository } from "@/core/domain/access-control/ports/orgAccessRuleRepository";
import type {
  OrgAccessLevel as OrgAccessLevelType,
  OrgAccessRuleId as OrgAccessRuleIdType,
  OrganizationId as OrganizationIdType,
} from "@/core/domain/access-control/valueObject";
import type { Executor } from "../client";

type OrgAccessRuleDataModel = InferSelectModel<typeof orgAccessRules>;

export class DrizzleSqliteOrgAccessRuleRepository
  implements OrgAccessRuleRepository
{
  constructor(private readonly executor: Executor) {}

  private into(data: OrgAccessRuleDataModel): OrgAccessRule {
    return {
      orgAccessRuleId: data.id as OrgAccessRuleIdType,
      sourceOrganizationId: data.sourceOrganizationId as OrganizationIdType,
      targetOrganizationId: data.targetOrganizationId as OrganizationIdType,
      accessLevel: data.accessLevel as OrgAccessLevelType,
      isEnabled: data.isEnabled,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  async findById(
    orgAccessRuleId: OrgAccessRuleIdType,
  ): Promise<OrgAccessRule | null> {
    try {
      const results = await this.executor
        .select()
        .from(orgAccessRules)
        .where(eq(orgAccessRules.id, orgAccessRuleId))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find org access rule by id",
        error,
      );
    }
  }

  async findAll(): Promise<OrgAccessRule[]> {
    try {
      const results = await this.executor.select().from(orgAccessRules);

      return results.map((r) => this.into(r));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find all org access rules",
        error,
      );
    }
  }

  async findBySourceOrganizationId(
    organizationId: OrganizationIdType,
  ): Promise<OrgAccessRule[]> {
    try {
      const results = await this.executor
        .select()
        .from(orgAccessRules)
        .where(eq(orgAccessRules.sourceOrganizationId, organizationId));

      return results.map((r) => this.into(r));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find org access rules by source organization id",
        error,
      );
    }
  }

  async findByTargetOrganizationId(
    organizationId: OrganizationIdType,
  ): Promise<OrgAccessRule[]> {
    try {
      const results = await this.executor
        .select()
        .from(orgAccessRules)
        .where(eq(orgAccessRules.targetOrganizationId, organizationId));

      return results.map((r) => this.into(r));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find org access rules by target organization id",
        error,
      );
    }
  }

  async findByOrganizationPair(
    sourceOrganizationId: OrganizationIdType,
    targetOrganizationId: OrganizationIdType,
  ): Promise<OrgAccessRule | null> {
    try {
      const results = await this.executor
        .select()
        .from(orgAccessRules)
        .where(
          and(
            eq(orgAccessRules.sourceOrganizationId, sourceOrganizationId),
            eq(orgAccessRules.targetOrganizationId, targetOrganizationId),
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
        "Failed to find org access rule by organization pair",
        error,
      );
    }
  }

  async save(rule: OrgAccessRule): Promise<OrgAccessRule> {
    try {
      await this.executor
        .insert(orgAccessRules)
        .values({
          id: rule.orgAccessRuleId,
          sourceOrganizationId: rule.sourceOrganizationId,
          targetOrganizationId: rule.targetOrganizationId,
          accessLevel: rule.accessLevel,
          isEnabled: rule.isEnabled,
          createdAt: rule.createdAt,
          updatedAt: rule.updatedAt,
        })
        .onConflictDoUpdate({
          target: orgAccessRules.id,
          set: {
            accessLevel: rule.accessLevel,
            isEnabled: rule.isEnabled,
            updatedAt: rule.updatedAt,
          },
        });

      return rule;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save org access rule",
        error,
      );
    }
  }

  async delete(orgAccessRuleId: OrgAccessRuleIdType): Promise<void> {
    try {
      await this.executor
        .delete(orgAccessRules)
        .where(eq(orgAccessRules.id, orgAccessRuleId));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete org access rule",
        error,
      );
    }
  }
}
