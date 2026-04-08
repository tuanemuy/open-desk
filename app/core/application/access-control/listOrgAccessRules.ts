import type { UserId } from "@/core/domain/identity/valueObject";
import { ForbiddenError, ForbiddenErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import { buildUserAclContext } from "./buildUserAclContext";
import type { OrgAccessRuleListOutput } from "./dto";

export type ListOrgAccessRulesInput = {
  readonly operatorId: string;
};

export async function listOrgAccessRules({
  container,
  input,
}: ServiceArgs<ListOrgAccessRulesInput>): Promise<OrgAccessRuleListOutput> {
  const operatorId = input.operatorId as UserId;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const userContext = await buildUserAclContext(ctx, operatorId);

    if (!userContext.isCybozuAdmin) {
      throw new ForbiddenError(
        ForbiddenErrorCode.InsufficientPermissions,
        "Cybozu admin permission required",
      );
    }

    const rules = await ctx.orgAccessRuleRepository.findAll();

    return {
      rules: rules.map((rule) => ({
        orgAccessRuleId: rule.orgAccessRuleId,
        sourceOrganizationId: rule.sourceOrganizationId,
        targetOrganizationId: rule.targetOrganizationId,
        accessLevel: rule.accessLevel,
        isEnabled: rule.isEnabled,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt,
      })),
    };
  });
}
