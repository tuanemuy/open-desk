import { View } from "@/core/domain/app/entity";
import { AppErrorCode } from "@/core/domain/app/errorCode";
import type {
  DeviceScope,
  SortSpec,
  ViewType as ViewTypeType,
} from "@/core/domain/app/valueObject";
import { AppId, AppStatus, FieldCode } from "@/core/domain/app/valueObject";
import { BusinessRuleError } from "@/core/domain/error";
import { UserId } from "@/core/domain/identity/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { CreateViewOutput } from "./dto";

export type CreateViewInput = {
  appId: string;
  viewName: string;
  viewType: ViewTypeType;
  fields: string[] | null;
  calendarDateField: string | null;
  calendarTitleField: string | null;
  html: string | null;
  pager: boolean | null;
  deviceScope: DeviceScope | null;
  filterCondition: string | null;
  sort: SortSpec[] | null;
  creatorId: string;
};

export async function createView({
  container,
  input,
}: ServiceArgs<CreateViewInput>): Promise<CreateViewOutput> {
  const appId = AppId.create(input.appId);
  const _creatorId = UserId.create(input.creatorId);

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

    const nameExists = await repos.viewRepository.existsByName(
      appId,
      input.viewName,
    );
    if (nameExists) {
      throw new BusinessRuleError(
        AppErrorCode.ViewNameDuplicate,
        `View name "${input.viewName}" already exists in this app`,
      );
    }

    // Get existing views to determine index
    const existingViews = await repos.viewRepository.findByAppId(appId);
    const nextIndex = existingViews.length;

    const fields = input.fields?.map((code) => FieldCode.create(code)) ?? [];
    const calendarDateField = input.calendarDateField
      ? FieldCode.create(input.calendarDateField)
      : null;
    const calendarTitleField = input.calendarTitleField
      ? FieldCode.create(input.calendarTitleField)
      : null;

    const { entity: view } = View.create({
      appId,
      viewName: input.viewName,
      viewType: input.viewType,
      fields,
      calendarDateField,
      calendarTitleField,
      html: input.html,
      pager: input.pager ?? undefined,
      deviceScope: input.deviceScope,
      filterCondition: input.filterCondition,
      sort: input.sort ?? undefined,
      index: nextIndex,
    });

    await repos.viewRepository.save(view);

    return {
      viewId: view.viewId,
      viewName: view.viewName,
      viewType: view.viewType,
      index: view.index,
    };
  });
}
