import type { AppId } from "@/core/domain/app/valueObject";
import type {
  FieldCode as FieldCodeType,
  FieldValue,
} from "@/core/domain/record/valueObject";

/**
 * Domain service port for validating field values against app field definitions.
 *
 * This service validates field values based on the field definitions from the App domain:
 * - Field code existence
 * - Field type and value format consistency
 * - Required field presence check
 * - Selection field option existence check (deleted options are allowed via API)
 * - Unique field uniqueness check
 * - Postal code field maxLength: 7 check
 * - Read-only field write rejection (lookup, status, category, calc, status_assignee, auto-calc text)
 * - Creator/CreatedTime can only be set at creation, rejected on update
 * - Modifier/UpdatedTime cannot be set (system-managed)
 */
export interface RecordValidationService {
  /**
   * Validate field values against the app's field definitions.
   *
   * @param appId - App ID (used to retrieve field definitions)
   * @param fieldValues - Field values to validate
   * @param isUpdate - If true, applies update-time validation (rejects create-only fields)
   * @throws BusinessRuleError with FieldValidation code on validation failure
   * @throws BusinessRuleError with InvalidFieldUpdate for read-only field writes
   */
  validateFieldValues(
    appId: AppId,
    fieldValues: ReadonlyMap<FieldCodeType, FieldValue>,
    isUpdate: boolean,
  ): Promise<void>;
}
