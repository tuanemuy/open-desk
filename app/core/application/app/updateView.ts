import { View } from "@/core/domain/app/entity";
import { AppErrorCode } from "@/core/domain/app/errorCode";
import type { DeviceScope, SortSpec } from "@/core/domain/app/valueObject";
import {
  AppId,
  AppStatus,
  FieldCode,
  ViewId,
} from "@/core/domain/app/valueObject";
import { BusinessRuleError } from "@/core/domain/error";
import { UserId } from "@/core/domain/identity/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { UpdateViewOutput } from "./dto";

export type UpdateViewInput = {
  appId: string;
  viewId: string;
  viewName: string | null;
  fields: string[] | null;
  calendarDateField: string | null;
  calendarTitleField: string | null;
  html: string | null;
  pager: boolean | null;
  deviceScope: DeviceScope | null;
  filterCondition: string | null | undefined;
  sort: SortSpec[] | null;
  index: number | null;
  modifierId: string;
};

export async function updateView({
  container,
  input,
}: ServiceArgs<UpdateViewInput>): Promise<UpdateViewOutput> {
  const appId = AppId.create(input.appId);
  const viewId = ViewId.create(input.viewId);
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

    const existingView = await repos.viewRepository.findById(viewId);
    if (existingView === null) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `View ${input.viewId} not found`,
      );
    }

    let view = existingView;

    if (input.viewName !== null) {
      const nameExists = await repos.viewRepository.existsByName(
        appId,
        input.viewName,
        viewId,
      );
      if (nameExists) {
        throw new BusinessRuleError(
          AppErrorCode.ViewNameDuplicate,
          `View name "${input.viewName}" already exists in this app`,
        );
      }
      const result = View.rename(view, input.viewName);
      view = result.entity;
    }

    if (input.fields !== null) {
      const fieldCodes = input.fields.map((code) => FieldCode.create(code));
      const result = View.setFields(view, fieldCodes);
      view = result.entity;
    }

    if (input.calendarDateField !== null || input.calendarTitleField !== null) {
      const dateField = input.calendarDateField
        ? FieldCode.create(input.calendarDateField)
        : view.calendarDateField;
      const titleField = input.calendarTitleField
        ? FieldCode.create(input.calendarTitleField)
        : view.calendarTitleField;
      if (dateField !== null && titleField !== null) {
        const result = View.setCalendarFields(view, dateField, titleField);
        view = result.entity;
      }
    }

    if (input.html !== null) {
      const result = View.setHtml(view, input.html);
      view = result.entity;
    }

    if (input.filterCondition !== undefined) {
      const result = View.setFilter(view, input.filterCondition ?? null);
      view = result.entity;
    }

    if (input.sort !== null) {
      const result = View.setSort(view, input.sort);
      view = result.entity;
    }

    if (input.index !== null) {
      const result = View.reorder(view, input.index);
      view = result.entity;
    }

    await repos.viewRepository.save(view);

    return {
      viewId: view.viewId,
      viewName: view.viewName,
      viewType: view.viewType,
      index: view.index,
      updatedAt: new Date(),
    };
  });
}
