import { SystemPermission } from "@/core/domain/access-control/entity";
import type { UserAclContext } from "@/core/domain/access-control/valueObject";
import { UserAclContext as UserAclContextVO } from "@/core/domain/access-control/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { TransactionContext } from "../unitOfWork";

/**
 * Build a UserAclContext from the available repositories.
 * This gathers user info, organization memberships, and group memberships
 * to construct the ACL evaluation context.
 */
export async function buildUserAclContext(
  ctx: TransactionContext,
  userId: UserId,
): Promise<UserAclContext> {
  const user = await ctx.userRepository.findById(userId);
  if (!user) {
    throw new NotFoundError(
      NotFoundErrorCode.NotFound,
      `User ${userId} not found`,
    );
  }

  const orgIds =
    await ctx.membershipRepository.getOrganizationIdsByUserId(userId);
  const groupIds = await ctx.membershipRepository.getGroupIdsByUserId(userId);

  const organizationCodes: string[] = [];
  for (const orgId of orgIds) {
    const org = await ctx.organizationRepository.findById(orgId);
    if (org) {
      organizationCodes.push(org.code);
    }
  }

  const groupCodes: string[] = [];
  for (const groupId of groupIds) {
    const group = await ctx.groupRepository.findById(groupId);
    if (group) {
      groupCodes.push(group.code);
    }
  }

  const systemPermissions = await ctx.systemPermissionRepository.findByUser(
    user.loginName,
    organizationCodes,
    groupCodes,
  );
  const isCybozuAdmin = systemPermissions.some((p) =>
    SystemPermission.hasRight(p, "SYSTEM_ADMIN"),
  );

  return UserAclContextVO.create({
    userId: user.userId,
    userCode: user.loginName,
    organizationCodes,
    groupCodes,
    isCybozuAdmin,
  });
}
