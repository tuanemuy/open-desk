import type {
  FieldValue as FieldValueType,
  UserAclContext as UserAclContextType,
} from "@/core/domain/access-control/valueObject";
import type { FieldCode as FieldCodeType } from "@/core/domain/app/valueObject";

/**
 * Domain service for resolving FIELD_ENTITY references.
 * Determines whether a user matches a FIELD_ENTITY ACL entry by examining
 * record field values (user selection, organization selection, group selection,
 * creator, updater fields).
 */

/**
 * Check whether the user matches a FIELD_ENTITY by resolving
 * the referenced field's value from the record.
 *
 * The entityCode corresponds to a field code. The field value
 * (user selection, organization selection, group selection, creator, updater)
 * is examined to determine if the user is referenced.
 *
 * @param entityCode The FIELD_ENTITY code (= field code)
 * @param userContext The user's ACL context
 * @param recordFieldValues The record's field values map
 * @returns true if the user matches the FIELD_ENTITY
 */
export function matchesFieldEntity(
  entityCode: string,
  userContext: UserAclContextType,
  recordFieldValues: ReadonlyMap<FieldCodeType, FieldValueType>,
): boolean {
  const fieldValue = recordFieldValues.get(
    entityCode as unknown as FieldCodeType,
  );

  if (!fieldValue) {
    return false;
  }

  const value = fieldValue.value;

  // Handle array values (user/org/group selection fields with multiple values)
  if (Array.isArray(value)) {
    return value.some((item: unknown) => matchesValue(item, userContext));
  }

  // Handle single values
  return matchesValue(value, userContext);
}

/**
 * Check whether a single field value matches the user context.
 */
function matchesValue(
  value: unknown,
  userContext: UserAclContextType,
): boolean {
  if (typeof value === "string") {
    return (
      value === userContext.userCode ||
      userContext.organizationCodes.includes(value) ||
      userContext.groupCodes.includes(value)
    );
  }

  if (typeof value === "object" && value !== null) {
    if ("code" in value) {
      const code = (value as { code: string }).code;
      return (
        code === userContext.userCode ||
        userContext.organizationCodes.includes(code) ||
        userContext.groupCodes.includes(code)
      );
    }
  }

  return false;
}
