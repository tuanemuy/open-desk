import type { SystemPermission } from "@/core/domain/access-control/entity";
import { SystemPermission as SystemPermissionEntity } from "@/core/domain/access-control/entity";
import type { UserAclContext } from "@/core/domain/access-control/valueObject";
import { ForbiddenError, ForbiddenErrorCode } from "../error";
import type { SystemPermissionDto } from "./dto";

/**
 * Check that the operator has system admin permission.
 * Throws ForbiddenError if not authorized.
 */
export function assertSystemAdmin(
  permissions: readonly SystemPermission[],
  userContext: UserAclContext,
): void {
  if (userContext.isCybozuAdmin) {
    return;
  }

  const hasSystemAdmin = permissions.some((p) =>
    SystemPermissionEntity.hasRight(p, "SYSTEM_ADMIN"),
  );

  if (!hasSystemAdmin) {
    throw new ForbiddenError(
      ForbiddenErrorCode.InsufficientPermissions,
      "System admin permission required",
    );
  }
}

/**
 * Convert a SystemPermission entity to a DTO.
 */
export function toSystemPermissionDto(
  permission: SystemPermission,
): SystemPermissionDto {
  return {
    systemPermissionId: permission.systemPermissionId,
    entity: permission.entity,
    includeSubs: permission.includeSubs,
    systemAdmin: permission.systemAdmin,
    appGroupViewable: permission.appGroupViewable,
    appGroupManageable: permission.appGroupManageable,
    appCreate: permission.appCreate,
    appManage: permission.appManage,
    spaceCreate: permission.spaceCreate,
    guestSpaceCreate: permission.guestSpaceCreate,
  };
}
