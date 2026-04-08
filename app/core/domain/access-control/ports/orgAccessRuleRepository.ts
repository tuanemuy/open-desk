import type { OrgAccessRule } from "../entity";
import type { OrgAccessRuleId, OrganizationId } from "../valueObject";

export interface OrgAccessRuleRepository {
  findById(orgAccessRuleId: OrgAccessRuleId): Promise<OrgAccessRule | null>;
  findAll(): Promise<OrgAccessRule[]>;
  findBySourceOrganizationId(
    organizationId: OrganizationId,
  ): Promise<OrgAccessRule[]>;
  findByTargetOrganizationId(
    organizationId: OrganizationId,
  ): Promise<OrgAccessRule[]>;
  findByOrganizationPair(
    sourceOrganizationId: OrganizationId,
    targetOrganizationId: OrganizationId,
  ): Promise<OrgAccessRule | null>;
  save(rule: OrgAccessRule): Promise<OrgAccessRule>;
  delete(orgAccessRuleId: OrgAccessRuleId): Promise<void>;
}
