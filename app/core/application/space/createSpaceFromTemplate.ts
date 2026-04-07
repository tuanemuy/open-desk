import type { UserId } from "@/core/domain/identity/valueObject";
import { createSpaceFromTemplate as createFromTemplateDomain } from "@/core/domain/space/services/spaceCreationService";
import type {
  MemberEntity,
  SpaceTemplateId,
} from "@/core/domain/space/valueObject";
import { SpaceName } from "@/core/domain/space/valueObject";
import { buildUserAclContext } from "../access-control/buildUserAclContext";
import {
  ForbiddenError,
  ForbiddenErrorCode,
  NotFoundError,
  NotFoundErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";
import type { CreateSpaceFromTemplateOutput } from "./dto";

export type CreateSpaceFromTemplateInput = {
  readonly operatorId: string;
  readonly templateId: string;
  readonly name: string;
  readonly isPrivate: boolean;
  readonly fixedMember: boolean;
  readonly members: readonly {
    readonly entity: MemberEntity;
    readonly isAdmin: boolean;
    readonly includeSubs: boolean;
  }[];
};

export async function createSpaceFromTemplate({
  container,
  input,
}: ServiceArgs<CreateSpaceFromTemplateInput>): Promise<CreateSpaceFromTemplateOutput> {
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

    const result = await createFromTemplateDomain(
      {
        spaceRepository: ctx.spaceRepository,
        threadRepository: ctx.threadRepository,
        spaceMemberRepository: ctx.spaceMemberRepository,
        spaceTemplateRepository: ctx.spaceTemplateRepository,
      },
      {
        templateId: input.templateId as SpaceTemplateId,
        name: spaceName,
        isPrivate: input.isPrivate,
        isGuest: false,
        fixedMember: input.fixedMember,
        members: input.members,
        creatorId: operatorId,
      },
    );

    if (!result.ok) {
      const error = result.error;
      switch (error.kind) {
        case "SpaceTemplateNotFound":
          throw new NotFoundError(
            NotFoundErrorCode.NotFound,
            `Template ${error.templateId} not found`,
          );
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
      }
    }

    const { space, threads } = result.value;

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
      threads: threads.map((t) => ({ threadId: t.threadId, title: t.title })),
    };
  });
}
