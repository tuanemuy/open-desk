import { UserId } from "@/core/domain/identity/valueObject";
import { Profile } from "@/core/domain/people/entity";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { RemoveCoverImageOutput } from "./dto";

export type RemoveCoverImageInput = {
  operatorId: string;
};

export async function removeCoverImage({
  container,
  input,
}: ServiceArgs<RemoveCoverImageInput>): Promise<RemoveCoverImageOutput> {
  const operatorId = UserId.create(input.operatorId);

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const profile = await ctx.profileRepository.findByUserId(operatorId);
    if (!profile) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Profile not found for user: ${input.operatorId}`,
      );
    }

    const { entity: updatedProfile } = Profile.removeCoverImage(profile);
    await ctx.profileRepository.save(updatedProfile);

    return {
      userId: updatedProfile.userId,
      coverImageFileKey: null,
      updatedAt: updatedProfile.updatedAt,
    };
  });
}
