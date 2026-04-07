import type { UserId } from "@/core/domain/identity/valueObject";
import type { SpaceId } from "@/core/domain/space/valueObject";
import type { ServiceArgs } from "../types";
import type { SpaceDto } from "./dto";
import { assertSpaceAccessible, getSpaceOrThrow } from "./helpers";

export type GetSpaceInput = {
  readonly operatorId: string;
  readonly spaceId: string;
};

export async function getSpace({
  container,
  input,
}: ServiceArgs<GetSpaceInput>): Promise<SpaceDto> {
  const operatorId = input.operatorId as UserId;
  const spaceId = input.spaceId as SpaceId;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const space = await getSpaceOrThrow(ctx, spaceId);
    await assertSpaceAccessible(ctx, spaceId, operatorId, space.isPrivate);

    return {
      spaceId: space.spaceId,
      name: space.name,
      isPrivate: space.isPrivate,
      isGuest: space.isGuest,
      useMultiThread: space.useMultiThread,
      fixedMember: space.fixedMember,
      appCreationPermission: space.appCreationPermission,
      coverImage: space.coverImage,
      portalDisplay: space.portalDisplay,
      defaultThreadId: space.defaultThreadId,
      creatorId: space.creatorId,
      createdAt: space.createdAt,
      updatedAt: space.updatedAt,
    };
  });
}
