import { UserId } from "@/core/domain/identity/valueObject";
import { ValidationError, ValidationErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { ListFollowersOutput } from "./dto";

export type ListFollowersInput = {
  targetUserId: string;
  offset: number;
  limit: number;
};

export async function listFollowers({
  container,
  input,
}: ServiceArgs<ListFollowersInput>): Promise<ListFollowersOutput> {
  if (input.offset < 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Offset must be non-negative",
    );
  }
  if (input.limit < 1 || input.limit > 100) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Limit must be between 1 and 100",
    );
  }

  const targetUserId = UserId.create(input.targetUserId);

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const result = await ctx.followRepository.findFollowers({
      followeeId: targetUserId,
      offset: input.offset,
      limit: input.limit,
    });

    return {
      followers: result.follows.map((f) => ({
        followerId: f.followerId,
        followeeId: f.followeeId,
        createdAt: f.createdAt,
      })),
      totalCount: result.totalCount,
      offset: input.offset,
      limit: input.limit,
    };
  });
}
