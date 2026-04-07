import type { UserId } from "@/core/domain/identity/valueObject";
import { buildUserAclContext } from "../access-control/buildUserAclContext";
import { assertSystemAdmin } from "../access-control/helpers";
import type { ServiceArgs } from "../types";
import type { SpaceUsageListOutput } from "./dto";

export type ListSpaceUsageInput = {
  readonly operatorId: string;
  readonly offset?: number;
  readonly limit?: number;
};

export async function listSpaceUsage({
  container,
  input,
}: ServiceArgs<ListSpaceUsageInput>): Promise<SpaceUsageListOutput> {
  const operatorId = input.operatorId as UserId;
  const offset = input.offset ?? 0;
  const limit = input.limit ?? 100;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const userContext = await buildUserAclContext(ctx, operatorId);
    const operatorPermissions = await ctx.systemPermissionRepository.findByUser(
      userContext.userCode,
      userContext.organizationCodes,
      userContext.groupCodes,
    );
    assertSystemAdmin(operatorPermissions, userContext);

    const spaces = await ctx.spaceRepository.list({}, offset, limit);
    const totalCount = await ctx.spaceRepository.count({});

    const usages = await Promise.all(
      spaces.map(async (space) => {
        const members = await ctx.spaceMemberRepository.findBySpaceId(
          space.spaceId,
        );
        const adminCount = members.filter((m) => m.isAdmin).length;
        return {
          spaceId: space.spaceId,
          name: space.name,
          isGuest: space.isGuest,
          memberCount: members.length,
          adminCount,
          createdAt: space.createdAt,
        };
      }),
    );

    return { spaces: usages, totalCount };
  });
}
