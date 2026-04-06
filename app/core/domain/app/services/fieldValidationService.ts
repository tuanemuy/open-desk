import type { Field } from "../entity";
import type { FieldCode, ValidationResult } from "../valueObject";

export interface FieldValidationService {
  validateFieldValue(field: Field, value: unknown): ValidationResult;
  validateRecord(
    fields: readonly Field[],
    values: Record<string, unknown>,
  ): ValidationResult;
  validateExpression(
    expression: string,
    availableFields: readonly Field[],
  ): ValidationResult;
  validateFieldCode(
    code: string,
    existingCodes: readonly FieldCode[],
  ): ValidationResult;
}
