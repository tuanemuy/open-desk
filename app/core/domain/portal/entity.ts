import type { WithEvents } from "@/core/domain/common/event";
import { BusinessRuleError } from "@/core/domain/error";
import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import { PortalErrorCode } from "./errorCode";
import type { AnnouncementEvent } from "./events";
import { PortalEvents } from "./events";
import type {
  AnnouncementId as AnnouncementIdType,
  FileKey as FileKeyType,
  RichTextHtml as RichTextHtmlType,
} from "./valueObject";
import { AnnouncementId, RichTextHtml } from "./valueObject";

// ============================================
// PortalAnnouncement Entity
// ============================================

type _PortalAnnouncement = Readonly<{
  announcementId: AnnouncementIdType;
  title: string;
  body: RichTextHtmlType;
  attachmentFileKeys: readonly FileKeyType[];
  lastUpdatedBy: UserIdType;
  updatedAt: Date;
  createdAt: Date;
}>;

export type PortalAnnouncement = _PortalAnnouncement;

export const PortalAnnouncement = {
  /**
   * Create a new PortalAnnouncement entity with default values.
   * Used for initial system setup.
   */
  create: (params: {
    title: string;
    body: string;
    createdBy: UserIdType;
  }): WithEvents<_PortalAnnouncement, AnnouncementEvent> => {
    if (params.title.length === 0) {
      throw new BusinessRuleError(
        PortalErrorCode.EmptyTitle,
        "Announcement title cannot be empty",
      );
    }

    const now = new Date();
    const announcement: _PortalAnnouncement = {
      announcementId: AnnouncementId.generate(),
      title: params.title,
      body: RichTextHtml.create(params.body),
      attachmentFileKeys: [],
      lastUpdatedBy: params.createdBy,
      updatedAt: now,
      createdAt: now,
    };

    return {
      entity: announcement,
      events: [],
    };
  },

  /**
   * Reconstruct a PortalAnnouncement entity from persisted data.
   */
  reconstruct: (data: _PortalAnnouncement): _PortalAnnouncement => data,

  /**
   * Update the announcement content.
   * Updates title, body, attachment file keys, and records the updater.
   * @throws BusinessRuleError with EmptyTitle if the title is empty
   */
  update: (
    announcement: _PortalAnnouncement,
    params: {
      title: string;
      body: RichTextHtmlType;
      attachmentFileKeys: readonly FileKeyType[];
      updatedBy: UserIdType;
    },
  ): WithEvents<_PortalAnnouncement, AnnouncementEvent> => {
    if (params.title.length === 0) {
      throw new BusinessRuleError(
        PortalErrorCode.EmptyTitle,
        "Announcement title cannot be empty",
      );
    }

    return {
      entity: {
        ...announcement,
        title: params.title,
        body: params.body,
        attachmentFileKeys: params.attachmentFileKeys,
        lastUpdatedBy: params.updatedBy,
        updatedAt: new Date(),
      },
      events: [
        PortalEvents.announcementUpdated(
          announcement.announcementId,
          params.updatedBy,
        ),
      ],
    };
  },
};
