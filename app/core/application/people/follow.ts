import { UserId } from "@/core/domain/identity/valueObject";
import { Follow } from "@/core/domain/people/entity";
import { ConflictError, ConflictErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { FollowOutput } from "./dto";

export type FollowInput = {
  followerId: string;
  followeeId: string;
};

export async function follow({
  container,
  input,
}: ServiceArgs<FollowInput>): Promise<FollowOutput> {
  const followerId = UserId.create(input.followerId);
  const followeeId = UserId.create(input.followeeId);

  // Follow.create will throw BusinessRuleError if self-follow
  const { entity: followEntity } = Follow.create({ followerId, followeeId });

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const existing = await ctx.followRepository.findByPair(
      followerId,
      followeeId,
    );
    if (existing) {
      throw new ConflictError(
        ConflictErrorCode.Conflict,
        `Already following user: ${input.followeeId}`,
      );
    }

    await ctx.followRepository.save(followEntity);

    return {
      followerId: followEntity.followerId,
      followeeId: followEntity.followeeId,
      createdAt: followEntity.createdAt,
    };
  });
}
