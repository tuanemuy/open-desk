import type { InferSelectModel } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { appI18nConfigs } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { AppI18nConfig } from "@/core/domain/app/entity";
import type { AppI18nConfigRepository } from "@/core/domain/app/ports/appI18nConfigRepository";
import type {
  AppId as AppIdType,
  I18nTranslation as I18nTranslationType,
  Revision as RevisionType,
} from "@/core/domain/app/valueObject";
import type { Executor } from "../client";

type AppI18nConfigDataModel = InferSelectModel<typeof appI18nConfigs>;

export class DrizzleSqliteAppI18nConfigRepository
  implements AppI18nConfigRepository
{
  constructor(private readonly executor: Executor) {}

  private into(data: AppI18nConfigDataModel): AppI18nConfig {
    return {
      appId: data.appId as AppIdType,
      translations:
        data.translations as unknown as readonly I18nTranslationType[],
      revision: data.revision as RevisionType,
    };
  }

  async findByAppId(appId: AppIdType): Promise<AppI18nConfig | null> {
    try {
      const results = await this.executor
        .select()
        .from(appI18nConfigs)
        .where(eq(appI18nConfigs.appId, appId))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find app i18n config by app id",
        error,
      );
    }
  }

  async save(config: AppI18nConfig): Promise<void> {
    try {
      await this.executor
        .insert(appI18nConfigs)
        .values({
          appId: config.appId,
          translations: config.translations as unknown as Record<
            string,
            unknown
          >[],
          revision: config.revision,
        })
        .onConflictDoUpdate({
          target: appI18nConfigs.appId,
          set: {
            translations: config.translations as unknown as Record<
              string,
              unknown
            >[],
            revision: config.revision,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save app i18n config",
        error,
      );
    }
  }
}
