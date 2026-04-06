import type { PortalAnnouncement } from "@/core/domain/portal/entity";
import type { AnnouncementId as AnnouncementIdType } from "@/core/domain/portal/valueObject";

/**
 * Repository port for PortalAnnouncement entity persistence.
 */
export interface PortalAnnouncementRepository {
  /**
   * Find the latest announcement.
   * Since only one announcement exists system-wide, this always returns at most one.
   * @returns The announcement, or null if not yet initialized
   */
  findLatest(): Promise<PortalAnnouncement | null>;

  /**
   * Find an announcement by its identifier.
   * @param announcementId - The announcement identifier
   * @returns The announcement, or null if not found
   */
  findById(
    announcementId: AnnouncementIdType,
  ): Promise<PortalAnnouncement | null>;

  /**
   * Save an announcement (insert or update).
   * @param announcement - The announcement to save
   */
  save(announcement: PortalAnnouncement): Promise<void>;
}
