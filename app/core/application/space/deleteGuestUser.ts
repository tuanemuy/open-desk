import type { UserId } from "@/core/domain/identity/valueObject";
import {
  MemberEntity,
  MemberEntityType,
} from "@/core/domain/space/valueObject";
import { buildUserAclContext } from "../access-control/buildUserAclContext";
import { assertSystemAdmin } from "../access-control/helpers";
import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";

export type DeleteGuestUserInput = {
  readonly operatorId: string;
  readonly targetUserId: string;
};

export async function deleteGuestUser({
  container,
  input,
}: ServiceArgs<DeleteGuestUserInput>): Promise<void> {
  const operatorId = input.operatorId as UserId;
  const targetUserId = input.targetUserId as UserId;

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    const userContext = await buildUserAclContext(ctx, operatorId);
    const operatorPermissions = await ctx.systemPermissionRepository.findByUser(
      userContext.userCode,
      userContext.organizationCodes,
      userContext.groupCodes,
    );
    assertSystemAdmin(operatorPermissions, userContext);

    const targetUser = await ctx.userRepository.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `User ${targetUserId} not found`,
      );
    }

    const memberships =
      await ctx.spaceMemberRepository.findByUserId(targetUserId);

    const isGuestUser =
      memberships.length > 0 &&
      (
        await Promise.all(
          memberships.map(async (m) => {
            const space = await ctx.spaceRepository.findById(m.spaceId);
            return space?.isGuest ?? false;
          }),
        )
      ).every((isGuest) => isGuest);

    if (memberships.length === 0) {
      throw new ValidationError(
        ValidationErrorCode.InvalidInput,
        `User ${targetUserId} is not a guest user`,
      );
    }

    if (!isGuestUser) {
      throw new ValidationError(
        ValidationErrorCode.InvalidInput,
        `User ${targetUserId} is not a guest user`,
      );
    }

    for (const membership of memberships) {
      const memberEntity = MemberEntity.create({
        type: MemberEntityType.User,
        id: targetUserId,
        code: targetUser.loginName,
      });
      await ctx.spaceMemberRepository.delete(membership.spaceId, memberEntity);
    }

    await ctx.userRepository.delete(targetUserId);
  });
}
