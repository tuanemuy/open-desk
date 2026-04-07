import type { UserId } from "@/core/domain/identity/valueObject";
import type { SpaceId } from "@/core/domain/space/valueObject";
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
