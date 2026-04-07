import type { InferSelectModel } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { formLayouts } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { FormLayout } from "@/core/domain/app/entity";
import type { FormLayoutRepository } from "@/core/domain/app/ports/formLayoutRepository";
import type {
  AppId as AppIdType,
  LayoutRow as LayoutRowType,
  Revision as RevisionType,
} from "@/core/domain/app/valueObject";
import type { Executor } from "../client";

type FormLayoutDataModel = InferSelectModel<typeof formLayouts>;

export class DrizzleSqliteFormLayoutRepository implements FormLayoutRepository {
  constructor(private readonly executor: Executor) {}

  private into(data: FormLayoutDataModel): FormLayout {
    return {
      appId: data.appId as AppIdType,
      rows: data.rows as unknown as readonly LayoutRowType[],
      revision: data.revision as RevisionType,
    };
  }

  async findByAppId(appId: AppIdType): Promise<FormLayout | null> {
    try {
      const results = await this.executor
        .select()
        .from(formLayouts)
        .where(eq(formLayouts.appId, appId))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find form layout by app id",
        error,
      );
    }
  }

  async save(layout: FormLayout): Promise<void> {
    try {
      await this.executor
        .insert(formLayouts)
        .values({
          appId: layout.appId,
          rows: layout.rows as unknown as Record<string, unknown>[],
          revision: layout.revision,
        })
        .onConflictDoUpdate({
          target: formLayouts.appId,
          set: {
            rows: layout.rows as unknown as Record<string, unknown>[],
            revision: layout.revision,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save form layout",
        error,
      );
    }
  }
}
