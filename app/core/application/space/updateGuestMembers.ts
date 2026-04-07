import type { UserId } from "@/core/domain/identity/valueObject";
import { replaceMembers as replaceMembersDomain } from "@/core/domain/space/services/spaceMembershipService";
import type { MemberEntity, SpaceId } from "@/core/domain/space/valueObject";
import {
  ForbiddenError,
  ForbiddenErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";
import type { MemberListOutput } from "./dto";
import { assertSpaceAdmin, getSpaceOrThrow } from "./helpers";

export type UpdateGuestMembersInput = {
  readonly operatorId: string;
  readonly spaceId: string;
  readonly members: readonly {
    readonly entity: MemberEntity;
    readonly isAdmin: boolean;
    readonly includeSubs: boolean;
  }[];
};

export async function updateGuestMembers({
  container,
  input,
}: ServiceArgs<UpdateGuestMembersInput>): Promise<MemberListOutput> {
  const operatorId = input.operatorId as UserId;
  const spaceId = input.spaceId as SpaceId;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const space = await getSpaceOrThrow(ctx, spaceId);
    if (!space.isGuest) {
      throw new ValidationError(
        ValidationErrorCode.InvalidInput,
        "This operation is only available for guest spaces",
      );
    }
    await assertSpaceAdmin(ctx, spaceId, operatorId);

    const result = await replaceMembersDomain(
      {
        spaceRepository: ctx.spaceRepository,
        spaceMemberRepository: ctx.spaceMemberRepository,
      },
      { spaceId, members: input.members },
    );

    if (!result.ok) {
      throw new ForbiddenError(
        ForbiddenErrorCode.InsufficientPermissions,
        `Member update failed: ${result.error.kind}`,
      );
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
