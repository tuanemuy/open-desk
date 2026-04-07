import { App } from "@/core/domain/app/entity";
import type {
  AppFeatureFlags,
  AppIcon,
  AppTheme,
  NumberPrecision,
  TitleFieldConfig,
} from "@/core/domain/app/valueObject";
import { AppCode, AppId, Revision } from "@/core/domain/app/valueObject";
import { UserId } from "@/core/domain/identity/valueObject";
import {
  ConflictError,
  ConflictErrorCode,
  NotFoundError,
  NotFoundErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";
import type { UpdateAppSettingsOutput } from "./dto";

export type UpdateAppSettingsInput = {
  appId: string;
  revision: number;
  name: string | null;
  code: string | null | undefined;
  description: string | null | undefined;
  theme: AppTheme | null;
  icon: AppIcon | null;
  titleField: TitleFieldConfig | null;
  numberPrecision: NumberPrecision | null;
  firstMonthOfFiscalYear: number | null;
  featureFlags: AppFeatureFlags | null;
  modifierId: string;
};

export async function updateAppSettings({
  container,
  input,
}: ServiceArgs<UpdateAppSettingsInput>): Promise<UpdateAppSettingsOutput> {
  const appId = AppId.create(input.appId);
  const expectedRevision = Revision.create(input.revision);
  const _modifierId = UserId.create(input.modifierId);

  return await container.unitOfWorkProvider.transaction(async (repos) => {
    const existingApp = await repos.appRepository.findById(appId);
    if (existingApp === null) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `App ${input.appId} not found`,
      );
    }

    App.checkRevision(existingApp, expectedRevision);

    let app = existingApp;

    if (input.name !== null) {
      const result = App.rename(app, input.name);
      app = result.entity;
    }

    if (input.code !== undefined) {
      if (input.code !== null) {
        const appCode = AppCode.create(input.code);
        const codeExists = await repos.appRepository.existsByCode(
          appCode,
          appId,
        );
        if (codeExists) {
          throw new ConflictError(
            ConflictErrorCode.Conflict,
            `App code ${input.code} is already in use`,
          );
        }
        const result = App.setCode(app, appCode);
        app = result.entity;
      } else {
        const result = App.setCode(app, null);
        app = result.entity;
      }
    }

    if (input.description !== undefined) {
      const result = App.setDescription(app, input.description ?? null);
      app = result.entity;
    }

    if (input.theme !== null) {
      const result = App.setTheme(app, input.theme);
      app = result.entity;
    }

    if (input.icon !== null) {
      const result = App.setIcon(app, input.icon);
      app = result.entity;
    }

    if (input.titleField !== null) {
      const result = App.setTitleField(app, input.titleField);
      app = result.entity;
    }

    if (input.numberPrecision !== null) {
      const result = App.setNumberPrecision(app, input.numberPrecision);
      app = result.entity;
    }

    if (input.firstMonthOfFiscalYear !== null) {
      const result = App.setFiscalYearStart(app, input.firstMonthOfFiscalYear);
      app = result.entity;
    }

    if (input.featureFlags !== null) {
      const result = App.updateFeatureFlags(app, input.featureFlags);
      app = result.entity;
    }

    const { entity: updatedApp } = App.incrementRevision(app);

    await repos.appRepository.save(updatedApp);

    return {
      appId: updatedApp.appId,
      revision: updatedApp.revision,
      updatedAt: updatedApp.updatedAt,
    };
  });
}
