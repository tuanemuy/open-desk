import { UserId } from "@/core/domain/identity/valueObject";
import { Profile } from "@/core/domain/people/entity";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { UpdateCommentOutput } from "./dto";

export type UpdateCommentInput = {
  operatorId: string;
  comment: string;
};

export async function updateComment({
  container,
  input,
}: ServiceArgs<UpdateCommentInput>): Promise<UpdateCommentOutput> {
  const operatorId = UserId.create(input.operatorId);

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const profile = await ctx.profileRepository.findByUserId(operatorId);
    if (!profile) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Profile not found for user: ${input.operatorId}`,
      );
    }

    const { entity: updatedProfile } = Profile.updateComment(
      profile,
      input.comment,
    );
    await ctx.profileRepository.save(updatedProfile);

    return {
      userId: updatedProfile.userId,
      comment: updatedProfile.comment,
      updatedAt: updatedProfile.updatedAt,
    };
  });
}
