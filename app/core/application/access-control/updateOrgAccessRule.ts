import { OrgAccessRule } from "@/core/domain/access-control/entity";
import type {
  OrgAccessLevel,
  OrgAccessRuleId,
} from "@/core/domain/access-control/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";
import {
  ForbiddenError,
  ForbiddenErrorCode,
  NotFoundError,
  NotFoundErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";
import { buildUserAclContext } from "./buildUserAclContext";
import type { OrgAccessRuleDto } from "./dto";

export type UpdateOrgAccessRuleInput = {
  readonly operatorId: string;
  readonly orgAccessRuleId: string;
  readonly accessLevel?: OrgAccessLevel;
  readonly isEnabled?: boolean;
};

export async function updateOrgAccessRule({
  container,
  input,
}: ServiceArgs<UpdateOrgAccessRuleInput>): Promise<OrgAccessRuleDto> {
  const operatorId = input.operatorId as UserId;
  const orgAccessRuleId = input.orgAccessRuleId as unknown as OrgAccessRuleId;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const userContext = await buildUserAclContext(ctx, operatorId);

    if (!userContext.isCybozuAdmin) {
      throw new ForbiddenError(
        ForbiddenErrorCode.InsufficientPermissions,
        "Cybozu admin permission required",
      );
    }

    let rule = await ctx.orgAccessRuleRepository.findById(orgAccessRuleId);
    if (!rule) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Org access rule ${input.orgAccessRuleId} not found`,
      );
    }

    if (input.accessLevel !== undefined) {
      rule = OrgAccessRule.updateAccessLevel(rule, input.accessLevel);
    }

    if (input.isEnabled !== undefined) {
      if (input.isEnabled) {
        rule = OrgAccessRule.enable(rule);
      } else {
        rule = OrgAccessRule.disable(rule);
      }
    }

    const saved = await ctx.orgAccessRuleRepository.save(rule);

    return {
      orgAccessRuleId: saved.orgAccessRuleId,
      sourceOrganizationId: saved.sourceOrganizationId,
      targetOrganizationId: saved.targetOrganizationId,
      accessLevel: saved.accessLevel,
      isEnabled: saved.isEnabled,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  });
}
