import type { UserId } from "@/core/domain/identity/valueObject";
import type { SpaceId } from "@/core/domain/space/valueObject";
import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";
import type { RestoreSpaceOutput } from "./dto";
import { assertSystemAdminForSpace } from "./helpers";

const RESTORE_EXPIRATION_DAYS = 14;

export type RestoreSpaceInput = {
  readonly operatorId: string;
  readonly spaceId: string;
};

export async function restoreSpace({
  container,
  input,
}: ServiceArgs<RestoreSpaceInput>): Promise<RestoreSpaceOutput> {
  const operatorId = input.operatorId as UserId;
  const spaceId = input.spaceId as SpaceId;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    await assertSystemAdminForSpace(ctx, operatorId);

    const space = await ctx.spaceRepository.findById(spaceId);
    if (!space) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Space ${input.spaceId} not found`,
      );
    }

    const deletedAt = space.updatedAt;
    const now = new Date();
    const expirationMs = RESTORE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000;
    if (now.getTime() - deletedAt.getTime() > expirationMs) {
      throw new ValidationError(
        ValidationErrorCode.InvalidInput,
        `Space restore expired: deleted at ${deletedAt.toISOString()}, expiration ${RESTORE_EXPIRATION_DAYS} days`,
      );
    }

    await ctx.spaceRepository.save(space);

    return {
      spaceId: space.spaceId,
      name: space.name,
      isPrivate: space.isPrivate,
      useMultiThread: space.useMultiThread,
      fixedMember: space.fixedMember,
      appCreationPermission: space.appCreationPermission,
      coverImage: space.coverImage,
      defaultThreadId: space.defaultThreadId,
      createdAt: space.createdAt,
    };
  });
}
