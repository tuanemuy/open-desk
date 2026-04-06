import type { Field, FormLayout } from "../entity";
import { FormLayout as FormLayoutEntity } from "../entity";
import type { FieldCode, FieldType, ValidationResult } from "../valueObject";
import { FieldType as FieldTypeModule } from "../valueObject";

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

export const FormLayoutServiceImpl: FormLayoutService = {
  validateLayoutConsistency: (
    _layout: FormLayout,
    _fields: readonly Field[],
  ): ValidationResult => {
    return { isValid: true, errors: [] };
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
