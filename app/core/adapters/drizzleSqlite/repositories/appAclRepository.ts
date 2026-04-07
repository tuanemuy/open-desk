import type { InferSelectModel } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { appAclRules } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { AppAcl, AppAclEntry } from "@/core/domain/access-control/entity";
import type { AppAclRepository } from "@/core/domain/access-control/ports/appAclRepository";
import type {
  AclEntity,
  AclEntityType,
} from "@/core/domain/access-control/valueObject";
import type { AppId } from "@/core/domain/app/valueObject";
import type { Executor } from "../client";

type AppAclRuleDataModel = InferSelectModel<typeof appAclRules>;

export class DrizzleSqliteAppAclRepository implements AppAclRepository {
  constructor(private readonly executor: Executor) {}

  private ruleToEntry(data: AppAclRuleDataModel): AppAclEntry {
    return {
      entity: {
        type: data.entityType as AclEntityType,
        code: data.entityCode ?? null,
      },
      includeSubs: data.includeSubs,
      appEditable: data.appEditable,
      recordViewable: data.recordViewable,
      recordAddable: data.recordAddable,
      recordEditable: data.recordEditable,
      recordDeletable: data.recordDeletable,
      recordImportable: data.recordImportable,
      recordExportable: data.recordExportable,
    };
  }

  async findByAppId(appId: AppId): Promise<AppAcl> {
    try {
      const rules = await this.executor
        .select()
        .from(appAclRules)
        .where(eq(appAclRules.appId, appId as string))
        .orderBy(appAclRules.priority);

      if (rules.length === 0) {
        // Return default: Everyone with all permissions granted
        return {
          appId,
          rights: [
            {
              entity: { type: "GROUP", code: "everyone" } as AclEntity,
              includeSubs: false,
              appEditable: true,
              recordViewable: true,
              recordAddable: true,
              recordEditable: true,
              recordDeletable: true,
              recordImportable: true,
              recordExportable: true,
            },
          ],
          revision: rules[0]?.revision ?? 0,
          updatedAt: rules[0]?.updatedAt ?? new Date(),
        };
      }

      return {
        appId,
        rights: rules.map((rule) => this.ruleToEntry(rule)),
        revision: rules[0].revision,
        updatedAt: rules[0].updatedAt,
      };
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find app ACL by app ID",
        error,
      );
    }
  }

  async save(appAcl: AppAcl): Promise<AppAcl> {
    try {
      const newRevision = appAcl.revision + 1;

      // Delete all existing rules for this app
      await this.executor
        .delete(appAclRules)
        .where(eq(appAclRules.appId, appAcl.appId as string));

      // Insert new rules with priority based on array order
      for (let i = 0; i < appAcl.rights.length; i++) {
        const entry = appAcl.rights[i];
        await this.executor.insert(appAclRules).values({
          appId: appAcl.appId as string,
          priority: i,
          entityType: entry.entity.type as string,
          entityCode: (entry.entity.code as string) ?? null,
          includeSubs: entry.includeSubs,
          appEditable: entry.appEditable,
          recordViewable: entry.recordViewable,
          recordAddable: entry.recordAddable,
          recordEditable: entry.recordEditable,
          recordDeletable: entry.recordDeletable,
          recordImportable: entry.recordImportable,
          recordExportable: entry.recordExportable,
          revision: newRevision,
        });
      }

      return {
        ...appAcl,
        revision: newRevision,
      };
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save app ACL",
        error,
      );
    }
  }
}
