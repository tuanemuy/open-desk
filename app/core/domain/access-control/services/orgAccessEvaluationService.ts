import type { OrgAccessRule } from "../entity";
import type {
  OrgAccessLevel as OrgAccessLevelType,
  OrganizationId as OrganizationIdType,
} from "../valueObject";
import { OrgAccessLevel } from "../valueObject";

/**
 * Evaluate the access level from a set of source organizations to a target organization.
 *
 * Evaluation rules:
 * 1. Only enabled rules are evaluated.
 * 2. If the user belongs to multiple organizations, the highest access level applies (OR combination).
 * 3. If no matching rule exists, FULL access is returned (no restriction).
 *
 * @param userOrganizationIds The organization IDs the user belongs to
 * @param targetOrganizationId The target organization ID to check access for
 * @param rules All org access rules in the system
 * @returns The evaluated access level
 */
export function evaluateOrgAccess(
  userOrganizationIds: readonly OrganizationIdType[],
  targetOrganizationId: OrganizationIdType,
  rules: readonly OrgAccessRule[],
): OrgAccessLevelType {
  const enabledRules = rules.filter((rule) => rule.isEnabled);

  let hasMatchingRule = false;
  let result: OrgAccessLevelType = OrgAccessLevel.None;

  for (const orgId of userOrganizationIds) {
    for (const rule of enabledRules) {
      if (
        rule.sourceOrganizationId === orgId &&
        rule.targetOrganizationId === targetOrganizationId
      ) {
        hasMatchingRule = true;
        result = OrgAccessLevel.max(result, rule.accessLevel);
      }
    }
  }

  // If no rule exists for this combination, default to FULL access
  if (!hasMatchingRule) {
    return OrgAccessLevel.Full;
  }

  return result;
}
