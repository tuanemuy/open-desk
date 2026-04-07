import {
  Field,
  FormLayout as FormLayoutEntity,
} from "@/core/domain/app/entity";
import { AppErrorCode } from "@/core/domain/app/errorCode";
import { FormLayoutServiceImpl } from "@/core/domain/app/services/formLayoutService";
import type {
  FieldDefaultValue,
  FieldProperties,
  FieldType as FieldTypeType,
  LayoutPosition,
} from "@/core/domain/app/valueObject";
import {
  AppId,
  AppStatus,
  FieldCode,
  FieldSize,
  FieldType,
  LayoutField,
} from "@/core/domain/app/valueObject";
import { BusinessRuleError } from "@/core/domain/error";
import { UserId } from "@/core/domain/identity/valueObject";
import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";
import type { AddFieldOutput } from "./dto";

export type AddFieldInput = {
  appId: string;
  fieldCode: string;
  label: string;
  fieldType: FieldTypeType;
  required: boolean | null;
  unique: boolean | null;
  noLabel: boolean | null;
  defaultValue: FieldDefaultValue | null;
  properties: FieldProperties;
  layoutPosition: LayoutPosition | null;
  creatorId: string;
};

export async function addField({
  container,
  input,
}: ServiceArgs<AddFieldInput>): Promise<AddFieldOutput> {
  const appId = AppId.create(input.appId);
  const _creatorId = UserId.create(input.creatorId);

  if (FieldType.isSystemField(input.fieldType)) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Cannot add a system field",
    );
  }

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

    const fieldCode = FieldCode.create(input.fieldCode);
    const codeExists = await repos.fieldRepository.existsByCode(
      appId,
      fieldCode,
    );
    if (codeExists) {
      throw new BusinessRuleError(
        AppErrorCode.FieldCodeDuplicate,
        `Field code ${input.fieldCode} already exists in this app`,
      );
    }

    const { entity: field } = Field.create({
      appId,
      fieldCode: input.fieldCode,
      label: input.label,
      fieldType: input.fieldType,
      required: input.required ?? undefined,
      unique: input.unique ?? undefined,
      defaultValue: input.defaultValue,
      properties: input.properties,
    });

    await repos.fieldRepository.save(field);

    // Add field to form layout
    let formLayout = await repos.formLayoutRepository.findByAppId(appId);
    if (formLayout === null) {
      formLayout = FormLayoutEntity.create({ appId, rows: [] });
    }

    const layoutField = LayoutField.create({
      type: field.fieldType,
      code: field.fieldCode,
      label: field.label,
      elementId: null,
      size: FieldSize.create({ width: null, height: null, innerHeight: null }),
    });

    if (input.layoutPosition !== null) {
      formLayout = FormLayoutEntity.addField(
        formLayout,
        layoutField,
        input.layoutPosition,
      );
    } else {
      // Add to end: create a new row at the bottom
      const newRow = {
        type: "ROW" as const,
        code: null,
        fields: [layoutField],
        innerLayout: null,
      };
      formLayout = { ...formLayout, rows: [...formLayout.rows, newRow] };
    }

    // Validate layout consistency
    const fields = await repos.fieldRepository.findByAppId(appId);
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
      fieldId: field.fieldId,
      fieldCode: field.fieldCode,
      label: field.label,
      fieldType: field.fieldType,
    };
  });
}
