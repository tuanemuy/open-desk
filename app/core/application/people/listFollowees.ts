import { UserId } from "@/core/domain/identity/valueObject";
import { ValidationError, ValidationErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { ListFolloweesOutput } from "./dto";

export type ListFolloweesInput = {
  targetUserId: string;
  offset: number;
  limit: number;
};

export async function listFollowees({
  container,
  input,
}: ServiceArgs<ListFolloweesInput>): Promise<ListFolloweesOutput> {
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
    const result = await ctx.followRepository.findFollowees({
      followerId: targetUserId,
      offset: input.offset,
      limit: input.limit,
    });

    return {
      followees: result.follows.map((f) => ({
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
