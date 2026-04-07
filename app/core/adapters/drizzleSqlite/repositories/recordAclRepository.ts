import type { InferSelectModel } from "drizzle-orm";
import { asc, eq } from "drizzle-orm";
import { recordAclRules } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type {
  RecordAcl,
  RecordAclEntity,
  RecordAclRule,
} from "@/core/domain/access-control/entity";
import type { RecordAclRepository } from "@/core/domain/access-control/ports/recordAclRepository";
import type { AclEntityType } from "@/core/domain/access-control/valueObject";
import type { AppId } from "@/core/domain/app/valueObject";
import type { Executor } from "../client";

type RecordAclRuleDataModel = InferSelectModel<typeof recordAclRules>;

export class DrizzleSqliteRecordAclRepository implements RecordAclRepository {
  constructor(private readonly executor: Executor) {}

  /**
   * Group flat database rows into structured RecordAclRule objects.
   * Rows are grouped by ruleIndex, and within each group, ordered by entityPriority.
   */
  private groupIntoRules(rows: RecordAclRuleDataModel[]): RecordAclRule[] {
    const ruleMap = new Map<
      number,
      { filterCond: string | null; entities: RecordAclEntity[] }
    >();

    for (const row of rows) {
      let rule = ruleMap.get(row.ruleIndex);
      if (!rule) {
        rule = {
          filterCond: row.filterCond ?? null,
          entities: [],
        };
        ruleMap.set(row.ruleIndex, rule);
      }

      rule.entities.push({
        entity: {
          type: row.entityType as AclEntityType,
          code: row.entityCode ?? null,
        },
        includeSubs: row.includeSubs,
        viewable: row.viewable,
        editable: row.editable,
        deletable: row.deletable,
      });
    }

    // Sort by ruleIndex and return
    return Array.from(ruleMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([_, rule]) => ({
        filterCond: rule.filterCond,
        entities: rule.entities,
      }));
  }

  async findByAppId(appId: AppId): Promise<RecordAcl> {
    try {
      const rows = await this.executor
        .select()
        .from(recordAclRules)
        .where(eq(recordAclRules.appId, appId as string))
        .orderBy(
          asc(recordAclRules.ruleIndex),
          asc(recordAclRules.entityPriority),
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
        "Failed to find record ACL by app ID",
        error,
      );
    }
  }

  async save(recordAcl: RecordAcl): Promise<RecordAcl> {
    try {
      const newRevision = recordAcl.revision + 1;

      // Delete all existing rules for this app
      await this.executor
        .delete(recordAclRules)
        .where(eq(recordAclRules.appId, recordAcl.appId as string));

      // Insert new rules
      for (
        let ruleIndex = 0;
        ruleIndex < recordAcl.rights.length;
        ruleIndex++
      ) {
        const rule = recordAcl.rights[ruleIndex];
        for (
          let entityPriority = 0;
          entityPriority < rule.entities.length;
          entityPriority++
        ) {
          const entity = rule.entities[entityPriority];
          await this.executor.insert(recordAclRules).values({
            appId: recordAcl.appId as string,
            ruleIndex,
            filterCond: rule.filterCond ?? null,
            entityType: entity.entity.type as string,
            entityCode: (entity.entity.code as string) ?? null,
            includeSubs: entity.includeSubs,
            viewable: entity.viewable,
            editable: entity.editable,
            deletable: entity.deletable,
            entityPriority,
            revision: newRevision,
          });
        }
      }

      return {
        ...recordAcl,
        revision: newRevision,
      };
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save record ACL",
        error,
      );
    }
  }
}
