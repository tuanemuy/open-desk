import type { InferSelectModel } from "drizzle-orm";
import { asc, eq } from "drizzle-orm";
import { fieldAclRules } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type {
  FieldAcl,
  FieldAclEntity,
  FieldAclRule,
} from "@/core/domain/access-control/entity";
import type { FieldAclRepository } from "@/core/domain/access-control/ports/fieldAclRepository";
import type {
  AclEntityType,
  FieldPermissionLevel,
} from "@/core/domain/access-control/valueObject";
import type { AppId, FieldCode } from "@/core/domain/app/valueObject";
import type { Executor } from "../client";

type FieldAclRuleDataModel = InferSelectModel<typeof fieldAclRules>;

export class DrizzleSqliteFieldAclRepository implements FieldAclRepository {
  constructor(private readonly executor: Executor) {}

  /**
   * Group flat database rows into structured FieldAclRule objects.
   * Rows are grouped by fieldCode, and within each group, ordered by entityPriority.
   */
  private groupIntoRules(rows: FieldAclRuleDataModel[]): FieldAclRule[] {
    const ruleMap = new Map<string, FieldAclEntity[]>();

    for (const row of rows) {
      let entities = ruleMap.get(row.fieldCode);
      if (!entities) {
        entities = [];
        ruleMap.set(row.fieldCode, entities);
      }

      entities.push({
        entity: {
          type: row.entityType as AclEntityType,
          code: row.entityCode ?? null,
        },
        includeSubs: row.includeSubs,
        accessibility: row.accessibility as FieldPermissionLevel,
      });
    }

    return Array.from(ruleMap.entries()).map(([fieldCode, entities]) => ({
      fieldCode: fieldCode as FieldCode,
      entities,
    }));
  }

  async findByAppId(appId: AppId): Promise<FieldAcl> {
    try {
      const rows = await this.executor
        .select()
        .from(fieldAclRules)
        .where(eq(fieldAclRules.appId, appId as string))
        .orderBy(
          asc(fieldAclRules.fieldCode),
          asc(fieldAclRules.entityPriority),
        );

      if (rows.length === 0) {
        return {
          appId,
          rights: [],
          revision: 0,
          updatedAt: new Date(),
        };
      }

      return {
        appId,
        rights: this.groupIntoRules(rows),
        revision: rows[0].revision,
        updatedAt: rows[0].updatedAt,
      };
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find field ACL by app ID",
        error,
      );
    }
  }

  async save(fieldAcl: FieldAcl): Promise<FieldAcl> {
    try {
      const newRevision = fieldAcl.revision + 1;

      // Delete all existing rules for this app
      await this.executor
        .delete(fieldAclRules)
        .where(eq(fieldAclRules.appId, fieldAcl.appId as string));

      // Insert new rules
      for (const rule of fieldAcl.rights) {
        for (
          let entityPriority = 0;
          entityPriority < rule.entities.length;
          entityPriority++
        ) {
          const entity = rule.entities[entityPriority];
          await this.executor.insert(fieldAclRules).values({
            appId: fieldAcl.appId as string,
            fieldCode: rule.fieldCode as string,
            entityType: entity.entity.type as string,
            entityCode: (entity.entity.code as string) ?? null,
            includeSubs: entity.includeSubs,
            accessibility: entity.accessibility as string,
            entityPriority,
            revision: newRevision,
          });
        }
      }

      return {
        ...fieldAcl,
        revision: newRevision,
      };
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save field ACL",
        error,
      );
    }
  }
}
