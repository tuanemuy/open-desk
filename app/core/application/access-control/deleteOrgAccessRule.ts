import type { OrgAccessRuleId } from "@/core/domain/access-control/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";
import {
  ForbiddenError,
  ForbiddenErrorCode,
  NotFoundError,
  NotFoundErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";
import { buildUserAclContext } from "./buildUserAclContext";

export type DeleteOrgAccessRuleInput = {
  readonly operatorId: string;
  readonly orgAccessRuleId: string;
};

export async function deleteOrgAccessRule({
  container,
  input,
}: ServiceArgs<DeleteOrgAccessRuleInput>): Promise<void> {
  const operatorId = input.operatorId as UserId;
  const orgAccessRuleId = input.orgAccessRuleId as unknown as OrgAccessRuleId;

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    const userContext = await buildUserAclContext(ctx, operatorId);

    if (!userContext.isCybozuAdmin) {
      throw new ForbiddenError(
        ForbiddenErrorCode.InsufficientPermissions,
        "Cybozu admin permission required",
      );
    }

    const rule = await ctx.orgAccessRuleRepository.findById(orgAccessRuleId);
    if (!rule) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Org access rule ${input.orgAccessRuleId} not found`,
      );
    }

    await ctx.orgAccessRuleRepository.delete(orgAccessRuleId);
  });
}
