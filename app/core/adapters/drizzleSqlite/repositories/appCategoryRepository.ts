import type { InferSelectModel } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { appCategories } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { AppCategory } from "@/core/domain/app/entity";
import type { AppCategoryRepository } from "@/core/domain/app/ports/appCategoryRepository";
import type {
  AppId as AppIdType,
  CategoryNode as CategoryNodeType,
  Revision as RevisionType,
} from "@/core/domain/app/valueObject";
import type { Executor } from "../client";

type AppCategoryDataModel = InferSelectModel<typeof appCategories>;

export class DrizzleSqliteAppCategoryRepository
  implements AppCategoryRepository
{
  constructor(private readonly executor: Executor) {}

  private into(data: AppCategoryDataModel): AppCategory {
    return {
      appId: data.appId as AppIdType,
      isEnabled: data.isEnabled,
      categories: data.categories as unknown as readonly CategoryNodeType[],
      revision: data.revision as RevisionType,
    };
  }

  async findByAppId(appId: AppIdType): Promise<AppCategory | null> {
    try {
      const results = await this.executor
        .select()
        .from(appCategories)
        .where(eq(appCategories.appId, appId))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find app category by app id",
        error,
      );
    }
  }

  async save(category: AppCategory): Promise<void> {
    try {
      await this.executor
        .insert(appCategories)
        .values({
          appId: category.appId,
          isEnabled: category.isEnabled,
          categories: category.categories as unknown as Record<
            string,
            unknown
          >[],
          revision: category.revision,
        })
        .onConflictDoUpdate({
          target: appCategories.appId,
          set: {
            isEnabled: category.isEnabled,
            categories: category.categories as unknown as Record<
              string,
              unknown
            >[],
            revision: category.revision,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save app category",
        error,
      );
    }
  }
}
