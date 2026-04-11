import type { Field, FormLayout } from "../entity";
import { FormLayout as FormLayoutEntity } from "../entity";
import type {
  FieldCode,
  FieldType,
  LayoutRow,
  ValidationError,
  ValidationResult,
} from "../valueObject";
import {
  FieldType as FieldTypeModule,
  ValidationResult as ValidationResultModule,
} from "../valueObject";

export interface FormLayoutService {
  validateLayoutConsistency(
    layout: FormLayout,
    fields: readonly Field[],
  ): ValidationResult;
  canPlaceInSubtable(fieldType: FieldType): boolean;
  adjustLayoutAfterFieldDeletion(
    layout: FormLayout,
    deletedFieldCode: FieldCode,
  ): FormLayout;
}

/**
 * Collect all field codes placed in the layout rows (including inner layouts).
 */
function collectLayoutFieldCodes(rows: readonly LayoutRow[]): Set<string> {
  const codes = new Set<string>();
  for (const row of rows) {
    if (row.code !== null) {
      codes.add(row.code);
    }
    for (const field of row.fields) {
      if (field.code !== null) {
        codes.add(field.code);
      }
    }
    if (row.innerLayout !== null) {
      for (const code of collectLayoutFieldCodes(row.innerLayout)) {
        codes.add(code);
      }
    }
  }
  return codes;
}

/**
 * Check that all form fields are placed in the layout.
 */
function validateAllFieldsPlaced(
  layout: FormLayout,
  fields: readonly Field[],
): readonly ValidationError[] {
  const layoutCodes = collectLayoutFieldCodes(layout.rows);
  const errors: ValidationError[] = [];
  for (const field of fields) {
    if (!layoutCodes.has(field.fieldCode)) {
      errors.push({
        fieldCode: field.fieldCode,
        message: `Field "${field.fieldCode}" is not placed in the layout`,
        errorType: "REQUIRED",
      });
    }
  }
  return errors;
}

/**
 * Check that no disallowed field types are placed inside a subtable.
 */
function validateSubtableFieldTypes(
  rows: readonly LayoutRow[],
): readonly ValidationError[] {
  const errors: ValidationError[] = [];
  for (const row of rows) {
    if (row.type === "SUBTABLE") {
      for (const field of row.fields) {
        if (!FieldTypeModule.canBeInSubtable(field.type)) {
          errors.push({
            fieldCode: field.code ?? ("" as FieldCode),
            message: `Field type "${field.type}" cannot be placed in a subtable`,
            errorType: "TYPE_MISMATCH",
          });
        }
      }
    }
    if (row.innerLayout !== null) {
      errors.push(...validateSubtableFieldTypes(row.innerLayout));
    }
  }
  return errors;
}

/**
 * Check that no subtable is nested inside a group.
 */
function validateNoSubtableInGroup(
  rows: readonly LayoutRow[],
): readonly ValidationError[] {
  const errors: ValidationError[] = [];
  for (const row of rows) {
    if (row.type === "GROUP" && row.innerLayout !== null) {
      for (const innerRow of row.innerLayout) {
        if (innerRow.type === "SUBTABLE") {
          errors.push({
            fieldCode: innerRow.code ?? ("" as FieldCode),
            message: "Subtable cannot be nested inside a group",
            errorType: "TYPE_MISMATCH",
          });
        }
      }
    }
  }
  return errors;
}

export const FormLayoutServiceImpl: FormLayoutService = {
  validateLayoutConsistency: (
    layout: FormLayout,
    fields: readonly Field[],
  ): ValidationResult => {
    const errors: ValidationError[] = [
      ...validateAllFieldsPlaced(layout, fields),
      ...validateSubtableFieldTypes(layout.rows),
      ...validateNoSubtableInGroup(layout.rows),
    ];

    if (errors.length === 0) {
      return ValidationResultModule.valid();
    }
    return ValidationResultModule.invalid(errors);
  },

  canPlaceInSubtable: (fieldType: FieldType): boolean => {
    return FieldTypeModule.canBeInSubtable(fieldType);
  },

  adjustLayoutAfterFieldDeletion: (
    layout: FormLayout,
    deletedFieldCode: FieldCode,
  ): FormLayout => {
    return FormLayoutEntity.removeField(layout, deletedFieldCode);
  },
};
