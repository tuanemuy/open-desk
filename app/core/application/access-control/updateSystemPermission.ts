import { SystemPermission } from "@/core/domain/access-control/entity";
import { SystemPermissionId } from "@/core/domain/access-control/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import { buildUserAclContext } from "./buildUserAclContext";
import type { SystemPermissionDto } from "./dto";
import { assertSystemAdmin, toSystemPermissionDto } from "./helpers";

export type UpdateSystemPermissionInput = {
  readonly operatorId: string;
  readonly systemPermissionId: string;
  readonly systemAdmin: boolean;
  readonly appGroupViewable: boolean;
  readonly appGroupManageable: boolean;
  readonly appCreate: boolean;
  readonly appManage: boolean;
  readonly spaceCreate: boolean;
  readonly guestSpaceCreate: boolean;
};

export async function updateSystemPermission({
  container,
  input,
}: ServiceArgs<UpdateSystemPermissionInput>): Promise<SystemPermissionDto> {
  const operatorId = input.operatorId as UserId;
  const systemPermissionId = SystemPermissionId.create(
    input.systemPermissionId,
  );

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const userContext = await buildUserAclContext(ctx, operatorId);

    const operatorPermissions = await ctx.systemPermissionRepository.findByUser(
      userContext.userCode,
      userContext.organizationCodes,
      userContext.groupCodes,
    );

    assertSystemAdmin(operatorPermissions, userContext);

    const allPermissions = await ctx.systemPermissionRepository.findAll();
    const permission = allPermissions.find(
      (p) => p.systemPermissionId === systemPermissionId,
    );
    if (!permission) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `System permission ${input.systemPermissionId} not found`,
      );
    }

    const { entity: updatedPermission } = SystemPermission.updateRights(
      permission,
      {
        systemAdmin: input.systemAdmin,
        appGroupViewable: input.appGroupViewable,
        appGroupManageable: input.appGroupManageable,
        appCreate: input.appCreate,
        appManage: input.appManage,
        spaceCreate: input.spaceCreate,
        guestSpaceCreate: input.guestSpaceCreate,
      },
    );

    await ctx.systemPermissionRepository.save(updatedPermission);

    return toSystemPermissionDto(updatedPermission);
  });
}
