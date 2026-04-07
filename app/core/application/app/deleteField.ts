import { Field } from "@/core/domain/app/entity";
import { AppErrorCode } from "@/core/domain/app/errorCode";
import { FormLayoutServiceImpl } from "@/core/domain/app/services/formLayoutService";
import { AppId, AppStatus, FieldId } from "@/core/domain/app/valueObject";
import { BusinessRuleError } from "@/core/domain/error";
import { UserId } from "@/core/domain/identity/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { DeleteFieldOutput } from "./dto";

export type DeleteFieldInput = {
  appId: string;
  fieldId: string;
  executorId: string;
};

export async function deleteField({
  container,
  input,
}: ServiceArgs<DeleteFieldInput>): Promise<DeleteFieldOutput> {
  const appId = AppId.create(input.appId);
  const fieldId = FieldId.create(input.fieldId);
  const _executorId = UserId.create(input.executorId);

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

    const field = await repos.fieldRepository.findById(fieldId);
    if (field === null) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Field ${input.fieldId} not found`,
      );
    }

    if (Field.isSystemField(field)) {
      throw new BusinessRuleError(
        AppErrorCode.SystemFieldModification,
        "Cannot delete a system field",
      );
    }

    const deletedFieldIds: string[] = [field.fieldId];

    // Handle GROUP or SUBTABLE: collect inner field IDs for cascade deletion
    if (field.fieldType === "GROUP" || field.fieldType === "SUBTABLE") {
      const formLayout = await repos.formLayoutRepository.findByAppId(appId);
      if (formLayout !== null) {
        for (const row of formLayout.rows) {
          if (row.code === field.fieldCode && row.innerLayout !== null) {
            for (const innerRow of row.innerLayout) {
              for (const innerField of innerRow.fields) {
                if (innerField.code !== null) {
                  const innerFieldEntity =
                    await repos.fieldRepository.findByCode(
                      appId,
                      innerField.code,
                    );
                  if (innerFieldEntity !== null) {
                    deletedFieldIds.push(innerFieldEntity.fieldId);
                  }
                }
              }
            }
          }
        }
      }
    }

    if (deletedFieldIds.length === 1) {
      await repos.fieldRepository.delete(fieldId);
    } else {
      await repos.fieldRepository.deleteBatch(
        deletedFieldIds.map((id) => FieldId.create(id)),
      );
    }

    // Adjust form layout after field deletion
    const formLayout = await repos.formLayoutRepository.findByAppId(appId);
    if (formLayout !== null) {
      const adjustedLayout =
        FormLayoutServiceImpl.adjustLayoutAfterFieldDeletion(
          formLayout,
          field.fieldCode,
        );
      await repos.formLayoutRepository.save(adjustedLayout);
    }

    return {
      deletedFieldIds,
    };
  });
}
