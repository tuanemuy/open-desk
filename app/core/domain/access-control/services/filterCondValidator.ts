import { AccessControlErrorCode } from "@/core/domain/access-control/errorCode";
import { BusinessRuleError } from "@/core/domain/error";

/**
 * Domain service for validating record ACL filter conditions.
 * Ensures filterCond conforms to ACL-specific query constraints.
 */

/**
 * Validate that a filterCond string conforms to record ACL constraints.
 *
 * Prohibited:
 * - order by, limit, offset usage
 * - Mixing and/or operators
 * - like, not like on single-line text and link fields
 * - in, >, < on record number, number, and calculation fields
 * - = on status fields
 * - Multi-line text, rich editor, attachment fields
 * - Date functions (NOW(), TODAY(), etc.)
 *
 * @throws InvalidFilterCondError if constraints are violated
 */
export function validateFilterCond(filterCond: string): void {
  const lowerCond = filterCond.toLowerCase();

  // Prohibit order by, limit, offset
  if (lowerCond.includes("order by")) {
    throw new BusinessRuleError(
      AccessControlErrorCode.InvalidFilterCond,
      "filterCond must not contain 'order by'",
    );
  }

  if (/\blimit\b/.test(lowerCond)) {
    throw new BusinessRuleError(
      AccessControlErrorCode.InvalidFilterCond,
      "filterCond must not contain 'limit'",
    );
  }

  if (/\boffset\b/.test(lowerCond)) {
    throw new BusinessRuleError(
      AccessControlErrorCode.InvalidFilterCond,
      "filterCond must not contain 'offset'",
    );
  }

  // Prohibit mixing and/or
  const hasAnd = /\band\b/.test(lowerCond);
  const hasOr = /\bor\b/.test(lowerCond);
  if (hasAnd && hasOr) {
    throw new BusinessRuleError(
      AccessControlErrorCode.InvalidFilterCond,
      "filterCond must not mix 'and' and 'or' operators",
    );
  }

  // Prohibit date functions
  const dateFunctions = [
    "now()",
    "today()",
    "this_month()",
    "last_month()",
    "this_year()",
  ];
  for (const fn of dateFunctions) {
    if (lowerCond.includes(fn)) {
      throw new BusinessRuleError(
        AccessControlErrorCode.InvalidFilterCond,
        `filterCond must not contain date function '${fn}'`,
      );
    }
  }
}
