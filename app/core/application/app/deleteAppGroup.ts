import { SystemPermission } from "@/core/domain/access-control/entity";
import { AppGroupId } from "@/core/domain/app/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";
import { buildUserAclContext } from "../access-control/buildUserAclContext";
import {
  ForbiddenError,
  ForbiddenErrorCode,
  NotFoundError,
  NotFoundErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";

export type DeleteAppGroupInput = {
  readonly operatorId: string;
  readonly appGroupId: string;
};

export async function deleteAppGroup({
  container,
  input,
}: ServiceArgs<DeleteAppGroupInput>): Promise<void> {
  const operatorId = input.operatorId as UserId;
  const appGroupId = AppGroupId.create(input.appGroupId);

  await container.unitOfWorkProvider.transaction(async (ctx) => {
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

    const group = await ctx.appGroupRepository.findById(appGroupId);
    if (!group) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `App group ${input.appGroupId} not found`,
      );
    }

    await ctx.appGroupRepository.delete(appGroupId);
  });
}
