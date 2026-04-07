import { SystemPermission } from "@/core/domain/access-control/entity";
import type { AclEntity } from "@/core/domain/access-control/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";
import { ConflictError, ConflictErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import { buildUserAclContext } from "./buildUserAclContext";
import type { SystemPermissionDto } from "./dto";
import { assertSystemAdmin, toSystemPermissionDto } from "./helpers";

export type AddSystemPermissionInput = {
  readonly operatorId: string;
  readonly entity: AclEntity;
  readonly includeSubs: boolean;
  readonly systemAdmin: boolean;
  readonly appGroupViewable: boolean;
  readonly appGroupManageable: boolean;
  readonly appCreate: boolean;
  readonly appManage: boolean;
  readonly spaceCreate: boolean;
  readonly guestSpaceCreate: boolean;
};

export async function addSystemPermission({
  container,
  input,
}: ServiceArgs<AddSystemPermissionInput>): Promise<SystemPermissionDto> {
  const operatorId = input.operatorId as UserId;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const userContext = await buildUserAclContext(ctx, operatorId);

    const operatorPermissions = await ctx.systemPermissionRepository.findByUser(
      userContext.userCode,
      userContext.organizationCodes,
      userContext.groupCodes,
    );

    assertSystemAdmin(operatorPermissions, userContext);

    const existing = await ctx.systemPermissionRepository.findByEntity(
      input.entity,
    );
    if (existing) {
      throw new ConflictError(
        ConflictErrorCode.Conflict,
        "System permission already exists for this entity",
      );
    }

    const { entity: permission } = SystemPermission.create({
      entity: input.entity,
      includeSubs: input.includeSubs,
      systemAdmin: input.systemAdmin,
      appGroupViewable: input.appGroupViewable,
      appGroupManageable: input.appGroupManageable,
      appCreate: input.appCreate,
      appManage: input.appManage,
      spaceCreate: input.spaceCreate,
      guestSpaceCreate: input.guestSpaceCreate,
    });

    await ctx.systemPermissionRepository.save(permission);

    return toSystemPermissionDto(permission);
  });
}
