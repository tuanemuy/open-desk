import type { UserId } from "@/core/domain/identity/valueObject";
import { SpaceAnnouncement } from "@/core/domain/space/entity";
import type { SpaceId } from "@/core/domain/space/valueObject";
import { ValidationError, ValidationErrorCode } from "../error";
import type { ServiceArgs } from "../types";
import type { AnnouncementOutput } from "./dto";
import { assertSpaceAdmin, getSpaceOrThrow } from "./helpers";

export type UpdateAnnouncementInput = {
  readonly operatorId: string;
  readonly spaceId: string;
  readonly body: string;
};

export async function updateAnnouncement({
  container,
  input,
}: ServiceArgs<UpdateAnnouncementInput>): Promise<AnnouncementOutput> {
  const operatorId = input.operatorId as UserId;
  const spaceId = input.spaceId as SpaceId;

  return await container.unitOfWorkProvider.transaction(async (ctx) => {
    const space = await getSpaceOrThrow(ctx, spaceId);
    if (!space.useMultiThread) {
      throw new ValidationError(
        ValidationErrorCode.InvalidInput,
        "Multi-thread must be enabled for announcements",
      );
    }
    await assertSpaceAdmin(ctx, spaceId, operatorId);

    const existing =
      await ctx.spaceAnnouncementRepository.findBySpaceId(spaceId);

    let announcement: import("@/core/domain/space/entity").SpaceAnnouncement;
    if (existing) {
      const { entity } = SpaceAnnouncement.updateBody(
        existing,
        input.body,
        operatorId,
      );
      announcement = entity;
    } else {
      const { entity } = SpaceAnnouncement.create({
        spaceId,
        body: input.body,
        updatedBy: operatorId,
      });
      announcement = entity;
    }

    await ctx.spaceAnnouncementRepository.save(announcement);

    return {
      spaceId: announcement.spaceId,
      body: announcement.body,
      updatedBy: announcement.updatedBy,
      updatedAt: announcement.updatedAt,
    };
  });
}
