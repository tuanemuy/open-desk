import { SystemPermission } from "@/core/domain/access-control/entity";
import type { UserId } from "@/core/domain/identity/valueObject";
import { buildUserAclContext } from "../access-control/buildUserAclContext";
import { ForbiddenError, ForbiddenErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { AppGroupListOutput } from "./dto";

export type ListAppGroupsInput = {
  readonly operatorId: string;
  readonly offset?: number;
  readonly limit?: number;
};

export async function listAppGroups({
  container,
  input,
}: ServiceArgs<ListAppGroupsInput>): Promise<AppGroupListOutput> {
  const operatorId = input.operatorId as UserId;
  const offset = input.offset ?? 0;
  const limit = input.limit ?? 100;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const userContext = await buildUserAclContext(ctx, operatorId);

    const permissions = await ctx.systemPermissionRepository.findByUser(
      userContext.userCode,
      userContext.organizationCodes,
      userContext.groupCodes,
    );

    const hasViewOrManage =
      userContext.isCybozuAdmin ||
      permissions.some(
        (p) =>
          SystemPermission.hasRight(p, "APP_GROUP_VIEWABLE") ||
          SystemPermission.hasRight(p, "APP_GROUP_MANAGEABLE"),
      );

    if (!hasViewOrManage) {
      throw new ForbiddenError(
        ForbiddenErrorCode.InsufficientPermissions,
        "App group viewable or manageable permission required",
      );
    }

    const { groups, totalCount } = await ctx.appGroupRepository.list(
      offset,
      limit,
    );

    return {
      groups: groups.map((g) => ({
        appGroupId: g.appGroupId,
        name: g.name,
        isDefault: g.isDefault,
        appIds: g.appIds,
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
      })),
      totalCount,
    };
  });
}
