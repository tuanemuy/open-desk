import {
  ForbiddenError,
  ForbiddenErrorCode,
  ValidationError,
  ValidationErrorCode,
} from "@/core/application/error";
import type { ServiceArgs } from "@/core/application/types";
import { FileKey as FileFileKey } from "@/core/domain/file/valueObject";
import { UserId } from "@/core/domain/identity/valueObject";
import { PortalAnnouncement } from "@/core/domain/portal/entity";
import { FileKey, RichTextHtml } from "@/core/domain/portal/valueObject";
import type { AnnouncementOutput } from "./dto";

export type UpdateAnnouncementInput = {
  operatorId: string;
  title: string;
  body: string;
  attachmentFileKeys: string[];
};

export async function updateAnnouncement({
  container,
  input,
}: ServiceArgs<UpdateAnnouncementInput>): Promise<AnnouncementOutput> {
  if (input.operatorId.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Operator ID is required",
    );
  }
  if (input.title.length === 0) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Announcement title is required",
    );
  }

  const operatorId = UserId.create(input.operatorId);

  const isAdmin = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      const permissions = await ctx.systemPermissionRepository.findByUser(
        input.operatorId,
        [],
        [],
      );
      return permissions.some((p) => p.systemAdmin);
    },
  );

  if (!isAdmin) {
    throw new ForbiddenError(
      ForbiddenErrorCode.InsufficientPermissions,
      "Only system administrators can update announcements",
    );
  }

  const attachmentFileKeys = input.attachmentFileKeys.map((key) =>
    FileKey.create(key),
  );

  for (const keyStr of input.attachmentFileKeys) {
    const fileKey = FileFileKey.create(keyStr);
    const file = await container.unitOfWorkProvider.transaction(async (ctx) => {
      return ctx.fileRepository.findByKey(fileKey);
    });

    if (file && file.size > 1_073_741_824) {
      throw new ValidationError(
        ValidationErrorCode.InvalidInput,
        "Attachment file exceeds maximum size of 1GB",
      );
    }
  }

  const body = RichTextHtml.create(input.body);

  let announcement = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.portalAnnouncementRepository.findLatest();
    },
  );

  if (!announcement) {
    const { entity: newAnnouncement } = PortalAnnouncement.create({
      title: "お知らせ",
      body: "",
      createdBy: operatorId,
    });
    announcement = newAnnouncement;
  }

  const { entity: updatedAnnouncement } = PortalAnnouncement.update(
    announcement,
    {
      title: input.title,
      body,
      attachmentFileKeys,
      updatedBy: operatorId,
    },
  );

  await container.unitOfWorkProvider.transaction(async (ctx) => {
    await ctx.portalAnnouncementRepository.save(updatedAnnouncement);
  });

  return {
    announcementId: updatedAnnouncement.announcementId,
    title: updatedAnnouncement.title,
    body: updatedAnnouncement.body,
    attachmentFileKeys: updatedAnnouncement.attachmentFileKeys,
    lastUpdatedBy: updatedAnnouncement.lastUpdatedBy,
    updatedAt: updatedAnnouncement.updatedAt,
  };
}
