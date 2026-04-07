import type { UserId } from "@/core/domain/identity/valueObject";
import { createSpace as createSpaceDomain } from "@/core/domain/space/services/spaceCreationService";
import type {
  AppCreationPermission,
  CoverImage,
  MemberEntity,
} from "@/core/domain/space/valueObject";
import { SpaceName } from "@/core/domain/space/valueObject";
import { buildUserAclContext } from "../access-control/buildUserAclContext";
import { ForbiddenError, ForbiddenErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { CreateGuestSpaceOutput } from "./dto";

export type CreateGuestSpaceInput = {
  readonly operatorId: string;
  readonly name: string;
  readonly useMultiThread: boolean;
  readonly fixedMember: boolean;
  readonly appCreationPermission: AppCreationPermission;
  readonly coverImage: CoverImage;
  readonly members: readonly {
    readonly entity: MemberEntity;
    readonly isAdmin: boolean;
    readonly includeSubs: boolean;
  }[];
};

export async function createGuestSpace({
  container,
  input,
}: ServiceArgs<CreateGuestSpaceInput>): Promise<CreateGuestSpaceOutput> {
  const operatorId = input.operatorId as UserId;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const userContext = await buildUserAclContext(ctx, operatorId);
    const operatorPermissions = await ctx.systemPermissionRepository.findByUser(
      userContext.userCode,
      userContext.organizationCodes,
      userContext.groupCodes,
    );
    const hasGuestSpaceCreate =
      userContext.isCybozuAdmin ||
      operatorPermissions.some((p) => p.guestSpaceCreate || p.systemAdmin);
    if (!hasGuestSpaceCreate) {
      throw new ForbiddenError(
        ForbiddenErrorCode.InsufficientPermissions,
        "Guest space creation permission required",
      );
    }

    const spaceName = SpaceName.create(input.name);
    const result = await createSpaceDomain(
      {
        spaceRepository: ctx.spaceRepository,
        threadRepository: ctx.threadRepository,
        spaceMemberRepository: ctx.spaceMemberRepository,
      },
      {
        name: spaceName,
        isPrivate: true,
        isGuest: true,
        useMultiThread: input.useMultiThread,
        fixedMember: input.fixedMember,
        appCreationPermission: input.appCreationPermission,
        coverImage: input.coverImage,
        members: input.members,
        creatorId: operatorId,
      },
    );

    if (!result.ok) {
      const error = result.error;
      switch (error.kind) {
        case "SpaceLimitExceeded":
          throw new ForbiddenError(
            ForbiddenErrorCode.InsufficientPermissions,
            `Guest space limit exceeded (max: ${error.limit})`,
          );
        case "NoAdminMember":
          throw new ForbiddenError(
            ForbiddenErrorCode.InsufficientPermissions,
            "At least one admin member is required",
          );
        case "GuestSpaceFeatureDisabled":
          throw new ForbiddenError(
            ForbiddenErrorCode.InsufficientPermissions,
            "Guest space feature is disabled",
          );
        case "SpaceTemplateNotFound":
          throw new ForbiddenError(
            ForbiddenErrorCode.InsufficientPermissions,
            `Template ${error.templateId} not found`,
          );
      }
    }

    const { space, defaultThread } = result.value;
    return {
      spaceId: space.spaceId,
      name: space.name,
      isPrivate: space.isPrivate,
      isGuest: space.isGuest,
      useMultiThread: space.useMultiThread,
      fixedMember: space.fixedMember,
      appCreationPermission: space.appCreationPermission,
      coverImage: space.coverImage,
      defaultThreadId: defaultThread.threadId,
      createdAt: space.createdAt,
    };
  });
}
