import { Field } from "@/core/domain/app/entity";
import { AppErrorCode } from "@/core/domain/app/errorCode";
import type {
  FieldDefaultValue,
  FieldProperties,
} from "@/core/domain/app/valueObject";
import {
  AppId,
  AppStatus,
  FieldCode,
  FieldId,
} from "@/core/domain/app/valueObject";
import { BusinessRuleError } from "@/core/domain/error";
import { UserId } from "@/core/domain/identity/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { UpdateFieldOutput } from "./dto";

export type UpdateFieldInput = {
  appId: string;
  fieldId: string;
  label: string | null;
  fieldCode: string | null;
  noLabel: boolean | null;
  required: boolean | null;
  unique: boolean | null;
  defaultValue: FieldDefaultValue | null | undefined;
  properties: FieldProperties | null;
  modifierId: string;
};

export async function updateField({
  container,
  input,
}: ServiceArgs<UpdateFieldInput>): Promise<UpdateFieldOutput> {
  const appId = AppId.create(input.appId);
  const fieldId = FieldId.create(input.fieldId);
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

    const existingField = await repos.fieldRepository.findById(fieldId);
    if (existingField === null) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Field ${input.fieldId} not found`,
      );
    }

    let field = existingField;

    if (input.label !== null) {
      const result = Field.updateLabel(field, input.label);
      field = result.entity;
    }

    if (input.fieldCode !== null) {
      const newCode = FieldCode.create(input.fieldCode);
      const codeExists = await repos.fieldRepository.existsByCode(
        appId,
        newCode,
        fieldId,
      );
      if (codeExists) {
        throw new BusinessRuleError(
          AppErrorCode.FieldCodeDuplicate,
          `Field code ${input.fieldCode} already exists in this app`,
        );
      }
      const result = Field.updateFieldCode(field, input.fieldCode);
      field = result.entity;
    }

    if (input.noLabel !== null) {
      const result = Field.setNoLabel(field, input.noLabel);
      field = result.entity;
    }

    if (input.required !== null) {
      const result = Field.setRequired(field, input.required);
      field = result.entity;
    }

    if (input.unique !== null) {
      const result = Field.setUnique(field, input.unique);
      field = result.entity;
    }

    if (input.defaultValue !== undefined) {
      const result = Field.setDefaultValue(field, input.defaultValue ?? null);
      field = result.entity;
    }

    if (input.properties !== null) {
      if (Field.isImmutableAfterSave(field)) {
        throw new BusinessRuleError(
          AppErrorCode.ImmutablePropertyModification,
          "Cannot modify immutable properties after save",
        );
      }
      const result = Field.updateProperties(field, input.properties);
      field = result.entity;
    }

    await repos.fieldRepository.save(field);

    return {
      fieldId: field.fieldId,
      fieldCode: field.fieldCode,
      label: field.label,
      fieldType: field.fieldType,
      updatedAt: new Date(),
    };
  });
}
