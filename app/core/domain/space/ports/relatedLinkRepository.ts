import type { RelatedLink } from "@/core/domain/space/entity";
import type { RelatedLinkId, SpaceId } from "@/core/domain/space/valueObject";

export interface RelatedLinkRepository {
  findById(linkId: RelatedLinkId): Promise<RelatedLink | null>;
  findBySpaceId(spaceId: SpaceId): Promise<RelatedLink[]>;
  save(link: RelatedLink): Promise<void>;
  delete(linkId: RelatedLinkId): Promise<void>;
  deleteBySpaceId(spaceId: SpaceId): Promise<void>;
}
