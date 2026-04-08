import type {
  OrgAccessLevel,
  OrganizationId,
} from "@/core/domain/access-control/valueObject";
import { OrgAccessLevel as OrgAccessLevelVO } from "@/core/domain/access-control/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";
import type { ServiceArgs } from "../types";
import { buildUserAclContext } from "./buildUserAclContext";
import type { EvaluateOrgAccessOutput } from "./dto";

export type EvaluateOrgAccessInput = {
  readonly targetUserId: string;
  readonly targetOrganizationId: string;
};

export async function evaluateOrgAccess({
  container,
  input,
}: ServiceArgs<EvaluateOrgAccessInput>): Promise<EvaluateOrgAccessOutput> {
  const targetUserId = input.targetUserId as UserId;
  const targetOrganizationId =
    input.targetOrganizationId as unknown as OrganizationId;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const userContext = await buildUserAclContext(ctx, targetUserId);

    if (userContext.isCybozuAdmin) {
      return {
        userId: targetUserId,
        targetOrganizationId: input.targetOrganizationId,
        accessLevel: OrgAccessLevelVO.Full,
      };
    }

    const userOrgIds =
      await ctx.membershipRepository.getOrganizationIdsByUserId(targetUserId);

    const allRules = await ctx.orgAccessRuleRepository.findAll();

    const enabledRules = allRules.filter((r) => r.isEnabled);

    let resultLevel: OrgAccessLevel = OrgAccessLevelVO.None;

    for (const rule of enabledRules) {
      if (rule.targetOrganizationId !== targetOrganizationId) {
        continue;
      }

      const userBelongsToSource = userOrgIds.some(
        (orgId) =>
          (orgId as unknown as string) ===
          (rule.sourceOrganizationId as unknown as string),
      );

      if (userBelongsToSource) {
        resultLevel = OrgAccessLevelVO.max(resultLevel, rule.accessLevel);
      }
    }

    return {
      userId: targetUserId,
      targetOrganizationId: input.targetOrganizationId,
      accessLevel: resultLevel,
    };
  });
}
