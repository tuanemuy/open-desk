import { AppI18nConfig } from "@/core/domain/app/entity";
import { AppErrorCode } from "@/core/domain/app/errorCode";
import type {
  AppLanguage as AppLanguageType,
  I18nScope as I18nScopeType,
} from "@/core/domain/app/valueObject";
import { AppId, AppStatus, Revision } from "@/core/domain/app/valueObject";
import { BusinessRuleError } from "@/core/domain/error";
import { UserId } from "@/core/domain/identity/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { ConfigureI18nOutput } from "./dto";

export type I18nTranslationInput = {
  scope: I18nScopeType;
  itemKey: string;
  language: AppLanguageType;
  value: string;
};

export type ConfigureI18nInput = {
  appId: string;
  translations: I18nTranslationInput[];
  revision: number;
  modifierId: string;
};

export async function configureI18n({
  container,
  input,
}: ServiceArgs<ConfigureI18nInput>): Promise<ConfigureI18nOutput> {
  const appId = AppId.create(input.appId);
  const expectedRevision = Revision.create(input.revision);
  const _modifierId = UserId.create(input.modifierId);

  return await container.unitOfWorkProvider.transaction(async (repos) => {
    const app = await repos.appRepository.findById(appId);
    if (app === null) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `App ${input.appId} not found`,
      );
    }
    if (AppStatus.isDeleted(app.status)) {
      throw new BusinessRuleError(
        AppErrorCode.DeletedAppModification,
        "Cannot modify a deleted app",
      );
    }

    let config = await repos.appI18nConfigRepository.findByAppId(appId);
    if (config === null) {
      config = AppI18nConfig.create({ appId });
    } else {
      if (config.revision !== expectedRevision) {
        throw new BusinessRuleError(
          AppErrorCode.RevisionConflict,
          `Revision conflict: expected ${expectedRevision}, got ${config.revision}`,
        );
      }
    }

    for (const translation of input.translations) {
      if (translation.value === "") {
        config = AppI18nConfig.removeTranslation(
          config,
          translation.scope,
          translation.itemKey,
          translation.language,
        );
      } else {
        config = AppI18nConfig.setTranslation(
          config,
          translation.scope,
          translation.itemKey,
          translation.language,
          translation.value,
        );
      }
    }

    // Increment revision
    config = {
      ...config,
      revision: Revision.increment(config.revision),
    };

    await repos.appI18nConfigRepository.save(config);

    return {
      appId: config.appId,
      translationCount: config.translations.length,
      revision: config.revision,
    };
  });
}
