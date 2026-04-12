import { SystemPermission } from "@/core/domain/access-control/entity";
import { AppGroup } from "@/core/domain/app/entity";
import type { UserId } from "@/core/domain/identity/valueObject";
import { buildUserAclContext } from "../access-control/buildUserAclContext";
import { ForbiddenError, ForbiddenErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { AppGroupDto } from "./dto";

export type CreateAppGroupInput = {
  readonly operatorId: string;
  readonly name: string;
};

export async function createAppGroup({
  container,
  input,
}: ServiceArgs<CreateAppGroupInput>): Promise<AppGroupDto> {
  const operatorId = input.operatorId as UserId;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const userContext = await buildUserAclContext(ctx, operatorId);

    const permissions = await ctx.systemPermissionRepository.findByUser(
      userContext.userCode,
      userContext.organizationCodes,
      userContext.groupCodes,
    );

    const hasManage =
      userContext.isCybozuAdmin ||
      permissions.some((p) =>
        SystemPermission.hasRight(p, "APP_GROUP_MANAGEABLE"),
      );

    if (!hasManage) {
      throw new ForbiddenError(
        ForbiddenErrorCode.InsufficientPermissions,
        "App group manageable permission required",
      );
    }

    const group = AppGroup.create({ name: input.name });

    await ctx.appGroupRepository.save(group);

    return {
      appGroupId: group.appGroupId,
      name: group.name,
      isDefault: group.isDefault,
      appIds: group.appIds,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };
  });
}
