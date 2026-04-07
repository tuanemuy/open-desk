import { FileKey as DomainFileKey } from "@/core/domain/file/valueObject";
import { UserId } from "@/core/domain/identity/valueObject";
import { Profile } from "@/core/domain/people/entity";
import { FileKey } from "@/core/domain/people/valueObject";
import {
  NotFoundError,
  NotFoundErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "../error";
import type { ServiceArgs } from "../types";
import type { SetCoverImageOutput } from "./dto";

const COVER_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export type SetCoverImageInput = {
  operatorId: string;
  fileKey: string;
};

export async function setCoverImage({
  container,
  input,
}: ServiceArgs<SetCoverImageInput>): Promise<SetCoverImageOutput> {
  const operatorId = UserId.create(input.operatorId);
  const fileKey = FileKey.create(input.fileKey);

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const profile = await ctx.profileRepository.findByUserId(operatorId);
    if (!profile) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `Profile not found for user: ${input.operatorId}`,
      );
    }

    const domainFileKey = DomainFileKey.create(input.fileKey);
    const storedFile = await ctx.fileRepository.findByKey(domainFileKey);
    if (!storedFile) {
      throw new NotFoundError(
        NotFoundErrorCode.NotFound,
        `File not found: ${input.fileKey}`,
      );
    }

    if (storedFile.size > COVER_IMAGE_MAX_SIZE_BYTES) {
      throw new ValidationError(
        ValidationErrorCode.InvalidInput,
        "Cover image file size exceeds the maximum of 5MB",
      );
    }

    const { entity: updatedProfile } = Profile.setCoverImage(profile, fileKey);
    await ctx.profileRepository.save(updatedProfile);

    return {
      userId: updatedProfile.userId,
      coverImageFileKey: updatedProfile.coverImageFileKey as string,
      updatedAt: updatedProfile.updatedAt,
    };
  });
}
