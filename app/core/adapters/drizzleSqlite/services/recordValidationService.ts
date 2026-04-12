import { eq } from "drizzle-orm";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { Field } from "@/core/domain/app/entity";
import type {
  AppId as AppIdType,
  FieldProperties,
} from "@/core/domain/app/valueObject";
import { BusinessRuleError } from "@/core/domain/error";
import { RecordErrorCode } from "@/core/domain/record/errorCode";
import type { RecordValidationService } from "@/core/domain/record/services/recordValidationService";
import type {
  FieldCode as FieldCodeType,
  FieldValue,
} from "@/core/domain/record/valueObject";
import { FieldType } from "@/core/domain/record/valueObject";
import type { Database } from "../client";
import { fields, records } from "../schema";

/**
 * Drizzle SQLite implementation of RecordValidationService.
 *
 * Validates field values against app field definitions stored in the database.
 */
export class DrizzleSqliteRecordValidationService
  implements RecordValidationService
{
  constructor(private readonly db: Database) {}

  async validateFieldValues(
    appId: AppIdType,
    fieldValues: ReadonlyMap<FieldCodeType, FieldValue>,
    isUpdate: boolean,
  ): Promise<void> {
    const fieldDefinitions = await this.fetchFieldDefinitions(appId);
    const fieldByCode = new Map<string, Field>();
    for (const field of fieldDefinitions) {
      fieldByCode.set(field.fieldCode, field);
    }

    const errors: string[] = [];

    for (const [fieldCode, fieldValue] of fieldValues) {
      const fieldDef = fieldByCode.get(fieldCode);

      // 1. Check field code existence
      if (!fieldDef) {
        errors.push(`Field code "${fieldCode}" does not exist in the app`);
        continue;
      }

      // 2. Check read-only field write rejection
      if (FieldType.isReadOnly(fieldValue.type)) {
        errors.push(
          `Field "${fieldCode}" (type: ${fieldValue.type}) is read-only and cannot be written`,
        );
        continue;
      }

      // 3. Check auto-calc SINGLE_LINE_TEXT (expression set) - read-only
      if (
        fieldDef.fieldType === "SINGLE_LINE_TEXT" &&
        fieldDef.properties.type === "SINGLE_LINE_TEXT" &&
        fieldDef.properties.expression !== null
      ) {
        errors.push(
          `Field "${fieldCode}" is an auto-calculated text field and cannot be written`,
        );
        continue;
      }

      // 4. Creator/CreatedTime: only at creation, rejected on update
      if (isUpdate && FieldType.isCreateOnly(fieldValue.type)) {
        errors.push(
          `Field "${fieldCode}" (type: ${fieldValue.type}) can only be set at creation time`,
        );
        continue;
      }

      // 5. Check field type consistency between definition and value
      const typeError = this.validateFieldTypeConsistency(
        fieldCode,
        fieldDef,
        fieldValue,
      );
      if (typeError) {
        errors.push(typeError);
        continue;
      }

      // 6. Validate value format based on field type
      const formatErrors = this.validateValueFormat(
        fieldCode,
        fieldDef,
        fieldValue,
      );
      for (const e of formatErrors) {
        errors.push(e);
      }
    }

    // 7. Check required field presence (only fields not provided)
    for (const fieldDef of fieldDefinitions) {
      if (!fieldDef.required) {
        continue;
      }
      // Skip system/read-only/layout fields for required check
      if (isReadOnlyOrSystemAppFieldType(fieldDef.fieldType)) {
        continue;
      }
      if (!fieldValues.has(fieldDef.fieldCode as unknown as FieldCodeType)) {
        // On update, missing fields are not updated so don't require them
        if (!isUpdate) {
          errors.push(`Required field "${fieldDef.fieldCode}" is missing`);
        }
      } else {
        // Check if the value is empty for required fields
        const value = fieldValues.get(
          fieldDef.fieldCode as unknown as FieldCodeType,
        );
        if (value && isEmptyFieldValue(value)) {
          errors.push(`Required field "${fieldDef.fieldCode}" cannot be empty`);
        }
      }
    }

    // 8. Check unique field uniqueness
    for (const [fieldCode, fieldValue] of fieldValues) {
      const fieldDef = fieldByCode.get(fieldCode);
      if (!fieldDef || !fieldDef.unique) {
        continue;
      }

      const stringValue = extractStringValue(fieldValue);
      if (stringValue === null || stringValue === "") {
        continue;
      }

      const isDuplicate = await this.checkUniqueness(
        appId,
        fieldCode,
        stringValue,
      );
      if (isDuplicate) {
        errors.push(
          `Field "${fieldCode}" requires a unique value, but "${stringValue}" already exists`,
        );
      }
    }

    if (errors.length > 0) {
      throw new BusinessRuleError(
        RecordErrorCode.FieldValidation,
        errors.join("; "),
      );
    }
  }

  /**
   * Validate that the field value type matches the field definition type.
   */
  private validateFieldTypeConsistency(
    fieldCode: string,
    fieldDef: Field,
    fieldValue: FieldValue,
  ): string | null {
    // Map app domain field types to record domain field value types
    // Most types share the same name, but some app types don't have corresponding record value types
    const appType = fieldDef.fieldType;
    const valueType = fieldValue.type;

    // These app-only layout types don't correspond to record field values
    if (
      appType === "LABEL" ||
      appType === "SPACER" ||
      appType === "HR" ||
      appType === "GROUP"
    ) {
      return `Field "${fieldCode}" (type: ${appType}) is a layout element and cannot have values`;
    }

    // The value type should match the app field type
    if (appType !== valueType) {
      return `Field "${fieldCode}" expects type ${appType} but received ${valueType}`;
    }

    return null;
  }

  /**
   * Validate field value format based on field type and properties.
   */
  private validateValueFormat(
    fieldCode: string,
    fieldDef: Field,
    fieldValue: FieldValue,
  ): readonly string[] {
    const errors: string[] = [];
    const props = fieldDef.properties;

    switch (fieldValue.type) {
      case "SINGLE_LINE_TEXT": {
        if (props.type === "SINGLE_LINE_TEXT") {
          if (
            props.minLength !== null &&
            fieldValue.value.length > 0 &&
            fieldValue.value.length < props.minLength
          ) {
            errors.push(
              `Field "${fieldCode}" value is shorter than minimum length ${props.minLength}`,
            );
          }
          if (
            props.maxLength !== null &&
            fieldValue.value.length > props.maxLength
          ) {
            errors.push(
              `Field "${fieldCode}" value exceeds maximum length ${props.maxLength}`,
            );
          }
        }
        break;
      }

      case "NUMBER": {
        if (fieldValue.value !== "") {
          const num = Number(fieldValue.value);
          if (Number.isNaN(num)) {
            errors.push(
              `Field "${fieldCode}" value "${fieldValue.value}" is not a valid number`,
            );
          } else if (props.type === "NUMBER") {
            if (props.minValue !== null && num < props.minValue) {
              errors.push(
                `Field "${fieldCode}" value ${num} is less than minimum ${props.minValue}`,
              );
            }
            if (props.maxValue !== null && num > props.maxValue) {
              errors.push(
                `Field "${fieldCode}" value ${num} exceeds maximum ${props.maxValue}`,
              );
            }
          }
        }
        break;
      }

      case "RADIO_BUTTON": {
        if (props.type === "RADIO_BUTTON" && fieldValue.value !== "") {
          const validOptions = props.options.map((o) => o.label);
          if (!validOptions.includes(fieldValue.value)) {
            errors.push(
              `Field "${fieldCode}" value "${fieldValue.value}" is not a valid option`,
            );
          }
        }
        break;
      }

      case "CHECK_BOX": {
        if (props.type === "CHECK_BOX" && fieldValue.value.length > 0) {
          const validOptions = props.options.map((o) => o.label);
          for (const v of fieldValue.value) {
            if (!validOptions.includes(v)) {
              errors.push(
                `Field "${fieldCode}" value "${v}" is not a valid option`,
              );
            }
          }
        }
        break;
      }

      case "MULTI_SELECT": {
        if (props.type === "MULTI_SELECT" && fieldValue.value.length > 0) {
          const validOptions = props.options.map((o) => o.label);
          for (const v of fieldValue.value) {
            if (!validOptions.includes(v)) {
              errors.push(
                `Field "${fieldCode}" value "${v}" is not a valid option`,
              );
            }
          }
        }
        break;
      }

      case "DROP_DOWN": {
        if (
          props.type === "DROP_DOWN" &&
          fieldValue.value !== "" &&
          fieldValue.value !== "-----"
        ) {
          const validOptions = props.options.map((o) => o.label);
          if (!validOptions.includes(fieldValue.value)) {
            errors.push(
              `Field "${fieldCode}" value "${fieldValue.value}" is not a valid option`,
            );
          }
        }
        break;
      }

      case "DATE": {
        if (fieldValue.value !== null && fieldValue.value !== "") {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(fieldValue.value)) {
            errors.push(
              `Field "${fieldCode}" value "${fieldValue.value}" is not a valid date format (YYYY-MM-DD)`,
            );
          }
        }
        break;
      }

      case "TIME": {
        if (fieldValue.value !== null && fieldValue.value !== "") {
          if (!/^\d{2}:\d{2}$/.test(fieldValue.value)) {
            errors.push(
              `Field "${fieldCode}" value "${fieldValue.value}" is not a valid time format (HH:MM)`,
            );
          }
        }
        break;
      }

      case "DATETIME": {
        if (fieldValue.value !== null && fieldValue.value !== "") {
          if (
            !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?/.test(fieldValue.value)
          ) {
            errors.push(
              `Field "${fieldCode}" value "${fieldValue.value}" is not a valid datetime format`,
            );
          }
        }
        break;
      }

      case "LINK": {
        if (props.type === "LINK") {
          if (
            props.minLength !== null &&
            fieldValue.value.length > 0 &&
            fieldValue.value.length < props.minLength
          ) {
            errors.push(
              `Field "${fieldCode}" value is shorter than minimum length ${props.minLength}`,
            );
          }
          if (
            props.maxLength !== null &&
            fieldValue.value.length > props.maxLength
          ) {
            errors.push(
              `Field "${fieldCode}" value exceeds maximum length ${props.maxLength}`,
            );
          }
        }
        break;
      }

      default:
        // Other field types don't have specific format validations
        break;
    }

    return errors;
  }

  /**
   * Fetch all field definitions for an app.
   */
  private async fetchFieldDefinitions(
    appId: AppIdType,
  ): Promise<readonly Field[]> {
    try {
      const results = await this.db
        .select()
        .from(fields)
        .where(eq(fields.appId, appId));

      return results.map((r) => ({
        fieldId: r.id as Field["fieldId"],
        appId: r.appId as Field["appId"],
        fieldCode: r.fieldCode as Field["fieldCode"],
        label: r.label,
        noLabel: r.noLabel,
        fieldType: r.fieldType as Field["fieldType"],
        required: r.required,
        unique: r.isUnique,
        defaultValue:
          r.defaultValue !== null
            ? (r.defaultValue as unknown as Field["defaultValue"])
            : null,
        properties: r.properties as unknown as FieldProperties,
      }));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to fetch field definitions for validation",
        error,
      );
    }
  }

  /**
   * Check if a value already exists for a unique field in the app's records.
   */
  private async checkUniqueness(
    appId: AppIdType,
    fieldCode: string,
    value: string,
  ): Promise<boolean> {
    try {
      // Records store fieldValues as a JSON column.
      // We query all records for the app and check in-memory.
      // This is acceptable for SQLite where JSON extraction operators are limited.
      const allRecords = await this.db
        .select({
          id: records.id,
          fieldValues: records.fieldValues,
        })
        .from(records)
        .where(eq(records.appId, appId));

      for (const record of allRecords) {
        const fv = record.fieldValues as Record<string, unknown>;
        if (fv && typeof fv === "object") {
          const field = fv[fieldCode] as { value?: unknown } | undefined;
          if (field && String(field.value) === value) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to check field uniqueness",
        error,
      );
    }
  }
}

/**
 * Check if an app field type is read-only or system-managed,
 * meaning it should not be checked for required presence.
 */
function isReadOnlyOrSystemAppFieldType(fieldType: string): boolean {
  const skipTypes = [
    "LOOKUP",
    "STATUS",
    "CATEGORY",
    "CALC",
    "STATUS_ASSIGNEE",
    "RECORD_NUMBER",
    "MODIFIER",
    "UPDATED_TIME",
    "REFERENCE_TABLE",
    "CREATOR",
    "CREATED_TIME",
    "LABEL",
    "SPACER",
    "HR",
    "GROUP",
    "SUBTABLE",
  ];
  return skipTypes.includes(fieldType);
}

/**
 * Check if a field value is considered "empty" for required field validation.
 */
function isEmptyFieldValue(fieldValue: FieldValue): boolean {
  switch (fieldValue.type) {
    case "SINGLE_LINE_TEXT":
    case "MULTI_LINE_TEXT":
    case "RICH_TEXT":
    case "LINK":
      return fieldValue.value === "";

    case "NUMBER":
      return fieldValue.value === "";

    case "RADIO_BUTTON":
      return fieldValue.value === "";

    case "DROP_DOWN":
      return fieldValue.value === "" || fieldValue.value === "-----";

    case "CHECK_BOX":
    case "MULTI_SELECT":
      return fieldValue.value.length === 0;

    case "USER_SELECT":
    case "ORGANIZATION_SELECT":
    case "GROUP_SELECT":
      return fieldValue.value.length === 0;

    case "DATE":
    case "TIME":
    case "DATETIME":
      return fieldValue.value === null || fieldValue.value === "";

    case "FILE":
      return fieldValue.value.length === 0;

    case "SUBTABLE":
      return fieldValue.value.length === 0;

    case "CREATOR":
      return false; // Always has a value

    case "CREATED_TIME":
    case "UPDATED_TIME":
    case "RECORD_NUMBER":
    case "STATUS":
      return fieldValue.value === "";

    case "STATUS_ASSIGNEE":
      return fieldValue.value.length === 0;

    case "MODIFIER":
      return false; // Always has a value

    case "CALC":
    case "LOOKUP":
    case "__ID__":
    case "__REVISION__":
      return false; // System-managed, always has a value

    case "CATEGORY":
    case "REFERENCE_TABLE":
      return false; // System-managed

    default:
      return false;
  }
}

/**
 * Extract a string value from a field value for uniqueness checking.
 * Returns null for field types that don't support unique constraints.
 */
function extractStringValue(fieldValue: FieldValue): string | null {
  switch (fieldValue.type) {
    case "SINGLE_LINE_TEXT":
    case "NUMBER":
    case "LINK":
      return fieldValue.value;

    case "DATE":
    case "DATETIME":
      return fieldValue.value;

    default:
      return null;
  }
}
