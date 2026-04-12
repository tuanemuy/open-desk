import { SystemPermission } from "@/core/domain/access-control/entity";
import { AppGroup } from "@/core/domain/app/entity";
import type { AppId as AppIdType } from "@/core/domain/app/valueObject";
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
import type { AppGroupDto } from "./dto";

export type UpdateAppGroupInput = {
  readonly operatorId: string;
  readonly appGroupId: string;
  readonly name?: string;
  readonly isDefault?: boolean;
  readonly appIds?: readonly string[];
};

export async function updateAppGroup({
  container,
  input,
}: ServiceArgs<UpdateAppGroupInput>): Promise<AppGroupDto> {
  const operatorId = input.operatorId as UserId;
  const appGroupId = AppGroupId.create(input.appGroupId);

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

    let group = await ctx.appGroupRepository.findById(appGroupId);
    if (!group) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `App group ${input.appGroupId} not found`,
      );
    }

    if (input.name !== undefined) {
      group = AppGroup.rename(group, input.name);
    }

    if (input.isDefault !== undefined) {
      if (input.isDefault) {
        const currentDefault = await ctx.appGroupRepository.findDefault();
        if (currentDefault && currentDefault.appGroupId !== appGroupId) {
          const unsetDefault = AppGroup.setDefault(currentDefault, false);
          await ctx.appGroupRepository.save(unsetDefault);
        }
      }
      group = AppGroup.setDefault(group, input.isDefault);
    }

    if (input.appIds !== undefined) {
      group = AppGroup.replaceApps(
        group,
        input.appIds as unknown as readonly AppIdType[],
      );
    }

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
