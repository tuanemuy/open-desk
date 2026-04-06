import type { SpaceAnnouncement } from "@/core/domain/space/entity";
import type { SpaceId } from "@/core/domain/space/valueObject";

export interface SpaceAnnouncementRepository {
  findBySpaceId(spaceId: SpaceId): Promise<SpaceAnnouncement | null>;
  save(announcement: SpaceAnnouncement): Promise<void>;
  deleteBySpaceId(spaceId: SpaceId): Promise<void>;
}
