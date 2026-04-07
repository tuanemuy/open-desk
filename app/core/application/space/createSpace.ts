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
import type { CreateSpaceOutput } from "./dto";

export type CreateSpaceInput = {
  readonly operatorId: string;
  readonly name: string;
  readonly isPrivate: boolean;
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

export async function createSpace({
  container,
  input,
}: ServiceArgs<CreateSpaceInput>): Promise<CreateSpaceOutput> {
  const operatorId = input.operatorId as UserId;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const userContext = await buildUserAclContext(ctx, operatorId);

    const operatorPermissions = await ctx.systemPermissionRepository.findByUser(
      userContext.userCode,
      userContext.organizationCodes,
      userContext.groupCodes,
    );

    const hasSpaceCreate =
      userContext.isCybozuAdmin ||
      operatorPermissions.some((p) => p.spaceCreate || p.systemAdmin);

    if (!hasSpaceCreate) {
      throw new ForbiddenError(
        ForbiddenErrorCode.InsufficientPermissions,
        "Space creation permission required",
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
        isPrivate: input.isPrivate,
        isGuest: false,
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
            `Space limit exceeded (max: ${error.limit})`,
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
      useMultiThread: space.useMultiThread,
      fixedMember: space.fixedMember,
      appCreationPermission: space.appCreationPermission,
      coverImage: space.coverImage,
      defaultThreadId: defaultThread.threadId,
      createdAt: space.createdAt,
    };
  });
}
