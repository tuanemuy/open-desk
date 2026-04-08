import { OrgAccessRule } from "@/core/domain/access-control/entity";
import type {
  OrgAccessLevel,
  OrganizationId,
} from "@/core/domain/access-control/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";
import {
  ConflictError,
  ConflictErrorCode,
  ForbiddenError,
  ForbiddenErrorCode,
  NotFoundError,
  NotFoundErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";
import { buildUserAclContext } from "./buildUserAclContext";
import type { OrgAccessRuleDto } from "./dto";

export type CreateOrgAccessRuleInput = {
  readonly operatorId: string;
  readonly sourceOrganizationId: string;
  readonly targetOrganizationId: string;
  readonly accessLevel: OrgAccessLevel;
  readonly isEnabled: boolean;
};

export async function createOrgAccessRule({
  container,
  input,
}: ServiceArgs<CreateOrgAccessRuleInput>): Promise<OrgAccessRuleDto> {
  const operatorId = input.operatorId as UserId;
  const sourceOrgId = input.sourceOrganizationId as unknown as OrganizationId;
  const targetOrgId = input.targetOrganizationId as unknown as OrganizationId;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const userContext = await buildUserAclContext(ctx, operatorId);

    if (!userContext.isCybozuAdmin) {
      throw new ForbiddenError(
        ForbiddenErrorCode.InsufficientPermissions,
        "Cybozu admin permission required",
      );
    }

    const sourceOrg = await ctx.organizationRepository.findById(
      input.sourceOrganizationId as unknown as import("@/core/domain/identity/valueObject").OrganizationId,
    );
    if (!sourceOrg) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Source organization ${input.sourceOrganizationId} not found`,
      );
    }

    const targetOrg = await ctx.organizationRepository.findById(
      input.targetOrganizationId as unknown as import("@/core/domain/identity/valueObject").OrganizationId,
    );
    if (!targetOrg) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Target organization ${input.targetOrganizationId} not found`,
      );
    }

    const existing = await ctx.orgAccessRuleRepository.findByOrganizationPair(
      sourceOrgId,
      targetOrgId,
    );
    if (existing) {
      throw new ConflictError(
        ConflictErrorCode.Conflict,
        "Org access rule already exists for this organization pair",
      );
    }

    const rule = OrgAccessRule.create({
      sourceOrganizationId: sourceOrgId,
      targetOrganizationId: targetOrgId,
      accessLevel: input.accessLevel,
      isEnabled: input.isEnabled,
    });

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
