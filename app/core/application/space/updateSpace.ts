import type { UserId } from "@/core/domain/identity/valueObject";
import { Space } from "@/core/domain/space/entity";
import type {
  AppCreationPermission,
  CoverImage,
  PortalDisplayConfig,
  SpaceId,
} from "@/core/domain/space/valueObject";
import type { ServiceArgs } from "../types";
import type { UpdateSpaceOutput } from "./dto";
import { assertSpaceAdmin, getSpaceOrThrow } from "./helpers";

export type UpdateSpaceInput = {
  readonly operatorId: string;
  readonly spaceId: string;
  readonly name?: string;
  readonly isPrivate?: boolean;
  readonly useMultiThread?: boolean;
  readonly fixedMember?: boolean;
  readonly coverImage?: CoverImage;
  readonly portalDisplay?: PortalDisplayConfig;
  readonly appCreationPermission?: AppCreationPermission;
};

export async function updateSpace({
  container,
  input,
}: ServiceArgs<UpdateSpaceInput>): Promise<UpdateSpaceOutput> {
  const operatorId = input.operatorId as UserId;
  const spaceId = input.spaceId as SpaceId;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    let space = await getSpaceOrThrow(ctx, spaceId);
    await assertSpaceAdmin(ctx, spaceId, operatorId);

    if (input.name !== undefined) {
      const { entity } = Space.rename(space, input.name);
      space = entity;
    }
    if (input.isPrivate !== undefined) {
      const { entity } = Space.setPrivate(space, input.isPrivate);
      space = entity;
    }
    if (input.useMultiThread === true) {
      const { entity } = Space.enableMultiThread(space);
      space = entity;
    }
    if (input.fixedMember !== undefined) {
      const { entity } = Space.setFixedMember(space, input.fixedMember);
      space = entity;
    }
    if (input.coverImage !== undefined) {
      const { entity } = Space.setCoverImage(space, input.coverImage);
      space = entity;
    }
    if (input.portalDisplay !== undefined) {
      const { entity } = Space.setPortalDisplay(space, input.portalDisplay);
      space = entity;
    }
    if (input.appCreationPermission !== undefined) {
      const { entity } = Space.setAppCreationPermission(
        space,
        input.appCreationPermission,
      );
      space = entity;
    }

    await ctx.spaceRepository.save(space);

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
      updatedAt: space.updatedAt,
    };
  });
}
