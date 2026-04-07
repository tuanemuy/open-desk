import type { UserId } from "@/core/domain/identity/valueObject";
import { replaceMembers as replaceMembersDomain } from "@/core/domain/space/services/spaceMembershipService";
import type { MemberEntity, SpaceId } from "@/core/domain/space/valueObject";
import { ForbiddenError, ForbiddenErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { MemberListOutput } from "./dto";
import { assertSpaceAdmin, getSpaceOrThrow } from "./helpers";

export type ReplaceMembersInput = {
  readonly operatorId: string;
  readonly spaceId: string;
  readonly members: readonly {
    readonly entity: MemberEntity;
    readonly isAdmin: boolean;
    readonly includeSubs: boolean;
  }[];
};

export async function replaceMembers({
  container,
  input,
}: ServiceArgs<ReplaceMembersInput>): Promise<MemberListOutput> {
  const operatorId = input.operatorId as UserId;
  const spaceId = input.spaceId as SpaceId;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    await getSpaceOrThrow(ctx, spaceId);
    await assertSpaceAdmin(ctx, spaceId, operatorId);

    const result = await replaceMembersDomain(
      {
        spaceRepository: ctx.spaceRepository,
        spaceMemberRepository: ctx.spaceMemberRepository,
      },
      { spaceId, members: input.members },
    );

    if (!result.ok) {
      const error = result.error;
      switch (error.kind) {
        case "NoAdminMember":
          throw new ForbiddenError(
            ForbiddenErrorCode.InsufficientPermissions,
            "At least one admin member is required",
          );
        default:
          throw new ForbiddenError(
            ForbiddenErrorCode.InsufficientPermissions,
            `Member update failed: ${error.kind}`,
          );
      }
    }

    const members = await ctx.spaceMemberRepository.findBySpaceId(spaceId);
    return {
      members: members.map((m) => ({
        entity: m.entity,
        isAdmin: m.isAdmin,
        includeSubs: m.includeSubs,
      })),
    };
  });
}
