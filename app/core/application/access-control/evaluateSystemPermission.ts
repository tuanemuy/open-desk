import { SystemPermission } from "@/core/domain/access-control/entity";
import type { UserId } from "@/core/domain/identity/valueObject";
import type { ServiceArgs } from "../types";
import { buildUserAclContext } from "./buildUserAclContext";
import type { EvaluateSystemPermissionOutput } from "./dto";

export type EvaluateSystemPermissionInput = {
  readonly targetUserId: string;
};

export async function evaluateSystemPermission({
  container,
  input,
}: ServiceArgs<EvaluateSystemPermissionInput>): Promise<EvaluateSystemPermissionOutput> {
  const targetUserId = input.targetUserId as UserId;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const userContext = await buildUserAclContext(ctx, targetUserId);

    if (userContext.isCybozuAdmin) {
      return {
        userId: targetUserId,
        systemAdmin: true,
        appGroupViewable: true,
        appGroupManageable: true,
        appCreate: true,
        appManage: true,
        spaceCreate: true,
        guestSpaceCreate: true,
      };
    }

    const permissions = await ctx.systemPermissionRepository.findByUser(
      userContext.userCode,
      userContext.organizationCodes,
      userContext.groupCodes,
    );

    const hasSystemAdmin = permissions.some((p) =>
      SystemPermission.hasRight(p, "SYSTEM_ADMIN"),
    );

    if (hasSystemAdmin) {
      return {
        userId: targetUserId,
        systemAdmin: true,
        appGroupViewable: true,
        appGroupManageable: true,
        appCreate: true,
        appManage: true,
        spaceCreate: true,
        guestSpaceCreate: true,
      };
    }

    const result = {
      userId: targetUserId,
      systemAdmin: false,
      appGroupViewable: false,
      appGroupManageable: false,
      appCreate: false,
      appManage: false,
      spaceCreate: false,
      guestSpaceCreate: false,
    };

    for (const p of permissions) {
      if (p.appGroupViewable) result.appGroupViewable = true;
      if (p.appGroupManageable) result.appGroupManageable = true;
      if (p.appCreate) result.appCreate = true;
      if (p.appManage) result.appManage = true;
      if (p.spaceCreate) result.spaceCreate = true;
      if (p.guestSpaceCreate) result.guestSpaceCreate = true;
    }

    return result;
  });
}
