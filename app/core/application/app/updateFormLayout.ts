import { FormLayout as FormLayoutEntity } from "@/core/domain/app/entity";
import { AppErrorCode } from "@/core/domain/app/errorCode";
import { FormLayoutServiceImpl } from "@/core/domain/app/services/formLayoutService";
import type { LayoutRow } from "@/core/domain/app/valueObject";
import { AppId, AppStatus } from "@/core/domain/app/valueObject";
import { BusinessRuleError } from "@/core/domain/error";
import { UserId } from "@/core/domain/identity/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { UpdateFormLayoutOutput } from "./dto";

export type UpdateFormLayoutInput = {
  appId: string;
  rows: LayoutRow[];
  modifierId: string;
};

export async function updateFormLayout({
  container,
  input,
}: ServiceArgs<UpdateFormLayoutInput>): Promise<UpdateFormLayoutOutput> {
  const appId = AppId.create(input.appId);
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

    let formLayout = await repos.formLayoutRepository.findByAppId(appId);
    if (formLayout === null) {
      formLayout = FormLayoutEntity.create({ appId, rows: [] });
    }

    const fields = await repos.fieldRepository.findByAppId(appId);

    formLayout = FormLayoutEntity.replaceAll(formLayout, input.rows);

    const validation = FormLayoutServiceImpl.validateLayoutConsistency(
      formLayout,
      fields,
    );
    if (!validation.isValid) {
      throw new BusinessRuleError(
        AppErrorCode.InvalidLayoutStructure,
        `Layout consistency check failed: ${validation.errors.map((e) => e.message).join(", ")}`,
      );
    }

    await repos.formLayoutRepository.save(formLayout);

    return {
      appId: app.appId,
      revision: app.revision,
    };
  });
}
