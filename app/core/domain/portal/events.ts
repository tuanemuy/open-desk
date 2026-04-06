import type { DomainEventBase } from "@/core/domain/common/event";
import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import type { AnnouncementId as AnnouncementIdType } from "./valueObject";

// ============================================
// Announcement Events
// ============================================

export type AnnouncementUpdatedEvent = DomainEventBase<
  "portal.announcement.updated",
  { announcementId: AnnouncementIdType; updatedBy: UserIdType }
>;

// ============================================
// Union Types
// ============================================

export type AnnouncementEvent = AnnouncementUpdatedEvent;

export type PortalEvent = AnnouncementEvent;

// ============================================
// Event Factories
// ============================================

export const PortalEvents = {
  announcementUpdated: (
    announcementId: AnnouncementIdType,
    updatedBy: UserIdType,
  ): AnnouncementUpdatedEvent => ({
    type: "portal.announcement.updated",
    payload: { announcementId, updatedBy },
    occurredAt: new Date(),
  }),
};
