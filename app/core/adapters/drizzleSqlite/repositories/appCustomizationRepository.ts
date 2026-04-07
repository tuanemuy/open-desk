import type { InferSelectModel } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { appCustomizations } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { AppCustomization } from "@/core/domain/app/entity";
import type { AppCustomizationRepository } from "@/core/domain/app/ports/appCustomizationRepository";
import type {
  AppId as AppIdType,
  CustomizationScope as CustomizationScopeType,
  PlatformCustomization as PlatformCustomizationType,
  Revision as RevisionType,
} from "@/core/domain/app/valueObject";
import type { Executor } from "../client";

type AppCustomizationDataModel = InferSelectModel<typeof appCustomizations>;

export class DrizzleSqliteAppCustomizationRepository
  implements AppCustomizationRepository
{
  constructor(private readonly executor: Executor) {}

  private into(data: AppCustomizationDataModel): AppCustomization {
    return {
      appId: data.appId as AppIdType,
      scope: data.scope as CustomizationScopeType,
      desktop: data.desktop as unknown as PlatformCustomizationType,
      mobile: data.mobile as unknown as PlatformCustomizationType,
      revision: data.revision as RevisionType,
    };
  }

  async findByAppId(appId: AppIdType): Promise<AppCustomization | null> {
    try {
      const results = await this.executor
        .select()
        .from(appCustomizations)
        .where(eq(appCustomizations.appId, appId))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find app customization by app id",
        error,
      );
    }
  }

  async save(customization: AppCustomization): Promise<void> {
    try {
      await this.executor
        .insert(appCustomizations)
        .values({
          appId: customization.appId,
          scope: customization.scope,
          desktop: customization.desktop as unknown as Record<string, unknown>,
          mobile: customization.mobile as unknown as Record<string, unknown>,
          revision: customization.revision,
        })
        .onConflictDoUpdate({
          target: appCustomizations.appId,
          set: {
            scope: customization.scope,
            desktop: customization.desktop as unknown as Record<
              string,
              unknown
            >,
            mobile: customization.mobile as unknown as Record<string, unknown>,
            revision: customization.revision,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save app customization",
        error,
      );
    }
  }
}
