import { UserId } from "@/core/domain/identity/valueObject";
import { Profile } from "@/core/domain/people/entity";
import { NotFoundError, NotFoundErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { GetProfileOutput } from "./dto";

export type GetProfileInput = {
  targetUserId: string;
};

export async function getProfile({
  container,
  input,
}: ServiceArgs<GetProfileInput>): Promise<GetProfileOutput> {
  const targetUserId = UserId.create(input.targetUserId);

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const user = await ctx.userRepository.findById(targetUserId);
    if (!user) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `User not found: ${input.targetUserId}`,
      );
    }

    let profile = await ctx.profileRepository.findByUserId(targetUserId);
    if (!profile) {
      const { entity: newProfile } = Profile.create({ userId: targetUserId });
      await ctx.profileRepository.save(newProfile);
      profile = newProfile;
    }

    const organization = user.primaryOrganizationId
      ? await ctx.organizationRepository.findById(user.primaryOrganizationId)
      : null;

    return {
      userId: user.userId,
      displayName: user.displayName,
      email: user.email,
      organization: organization?.name ?? "",
      coverImageFileKey: profile.coverImageFileKey,
      comment: profile.comment,
      updatedAt: profile.updatedAt,
    };
  });
}
