import { UserId } from "@/core/domain/identity/valueObject";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { UnfollowOutput } from "./dto";

export type UnfollowInput = {
  followerId: string;
  followeeId: string;
};

export async function unfollow({
  container,
  input,
}: ServiceArgs<UnfollowInput>): Promise<UnfollowOutput> {
  const followerId = UserId.create(input.followerId);
  const followeeId = UserId.create(input.followeeId);

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const existing = await ctx.followRepository.findByPair(
      followerId,
      followeeId,
    );
    if (!existing) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        "Follow relationship not found",
      );
    }

    await ctx.followRepository.delete(followerId, followeeId);

    return {
      followerId: input.followerId,
      followeeId: input.followeeId,
    };
  });
}
