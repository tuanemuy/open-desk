import type { UserId } from "@/core/domain/identity/valueObject";
import type { SpaceId } from "@/core/domain/space/valueObject";
import type { ServiceArgs } from "../types";
import type { MemberListOutput } from "./dto";
import { assertSpaceAccessible, getSpaceOrThrow } from "./helpers";

export type ListMembersInput = {
  readonly operatorId: string;
  readonly spaceId: string;
};

export async function listMembers({
  container,
  input,
}: ServiceArgs<ListMembersInput>): Promise<MemberListOutput> {
  const operatorId = input.operatorId as UserId;
  const spaceId = input.spaceId as SpaceId;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const space = await getSpaceOrThrow(ctx, spaceId);
    await assertSpaceAccessible(ctx, spaceId, operatorId, space.isPrivate);

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
