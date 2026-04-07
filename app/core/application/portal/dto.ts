import type { UserId } from "@/core/domain/identity/valueObject";
import type {
  AnnouncementId,
  FileKey,
  RichTextHtml,
} from "@/core/domain/portal/valueObject";

export type AnnouncementOutput = {
  announcementId: AnnouncementId;
  title: string;
  body: RichTextHtml;
  attachmentFileKeys: readonly FileKey[];
  lastUpdatedBy: UserId;
  updatedAt: Date;
};

export type PortalAnnouncementData = {
  announcementId: AnnouncementId;
  title: string;
  body: RichTextHtml;
  attachmentFileKeys: readonly FileKey[];
  lastUpdatedBy: UserId;
  updatedAt: Date;
} | null;

export type PortalViewOutput = {
  announcement: PortalAnnouncementData;
};
