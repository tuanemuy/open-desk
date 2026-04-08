import { SystemPermission } from "@/core/domain/access-control/entity";
import type { UserId } from "@/core/domain/identity/valueObject";
import type { SpaceId } from "@/core/domain/space/valueObject";
import { buildUserAclContext } from "../access-control/buildUserAclContext";
import {
  ForbiddenError,
  ForbiddenErrorCode,
  NotFoundError,
  NotFoundErrorCode,
} from "../error";
import type { TransactionContext } from "../unitOfWork";

export async function assertSpaceAdmin(
  ctx: TransactionContext,
  spaceId: SpaceId,
  operatorId: UserId,
): Promise<void> {
  const member = await ctx.spaceMemberRepository.findBySpaceIdAndUserId(
    spaceId,
    operatorId,
  );
  if (!member || !member.isAdmin) {
    throw new ForbiddenError(
      ForbiddenErrorCode.InsufficientPermissions,
      "Space admin permission required",
    );
  }
}

export async function assertSpaceMember(
  ctx: TransactionContext,
  spaceId: SpaceId,
  operatorId: UserId,
): Promise<void> {
  const member = await ctx.spaceMemberRepository.findBySpaceIdAndUserId(
    spaceId,
    operatorId,
  );
  if (!member) {
    throw new ForbiddenError(
      ForbiddenErrorCode.InsufficientPermissions,
      "Space membership required",
    );
  }
}

export async function assertSpaceAccessible(
  ctx: TransactionContext,
  spaceId: SpaceId,
  operatorId: UserId,
  isPrivate: boolean,
): Promise<void> {
  if (isPrivate) {
    await assertSpaceMember(ctx, spaceId, operatorId);
  }
}

export async function assertSystemAdminForSpace(
  ctx: TransactionContext,
  operatorId: UserId,
): Promise<void> {
  const userContext = await buildUserAclContext(ctx, operatorId);

  if (userContext.isCybozuAdmin) {
    return;
  }

  const permissions = await ctx.systemPermissionRepository.findByUser(
    userContext.userCode,
    userContext.organizationCodes,
    userContext.groupCodes,
  );

  const hasSystemAdmin = permissions.some((p) =>
    SystemPermission.hasRight(p, "SYSTEM_ADMIN"),
  );

  if (!hasSystemAdmin) {
    throw new ForbiddenError(
      ForbiddenErrorCode.InsufficientPermissions,
      "System admin permission required",
    );
  }
}

export async function getSpaceOrThrow(
  ctx: TransactionContext,
  spaceId: SpaceId,
): Promise<import("@/core/domain/space/entity").Space> {
  const space = await ctx.spaceRepository.findById(spaceId);
  if (!space) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      `Space ${spaceId} not found`,
    );
  }
  return space;
}
