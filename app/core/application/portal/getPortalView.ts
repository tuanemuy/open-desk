import type { ServiceArgs } from "@/core/application/types";
import { UserId } from "@/core/domain/identity/valueObject";
import type { PortalViewOutput } from "./dto";

export type GetPortalViewInput = {
  operatorId: string;
};

export async function getPortalView({
  container,
  input,
}: ServiceArgs<GetPortalViewInput>): Promise<PortalViewOutput> {
  UserId.create(input.operatorId);

  const announcement = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.portalAnnouncementRepository.findLatest();
    },
  );

  return {
    announcement: announcement
      ? {
          announcementId: announcement.announcementId,
          title: announcement.title,
          body: announcement.body,
          attachmentFileKeys: announcement.attachmentFileKeys,
          lastUpdatedBy: announcement.lastUpdatedBy,
          updatedAt: announcement.updatedAt,
        }
      : null,
  };
}
