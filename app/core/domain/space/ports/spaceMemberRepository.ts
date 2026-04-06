import type { UserId } from "@/core/domain/identity/valueObject";
import type { SpaceMember } from "@/core/domain/space/entity";
import type { MemberEntity, SpaceId } from "@/core/domain/space/valueObject";

export interface SpaceMemberRepository {
  findBySpaceId(spaceId: SpaceId): Promise<SpaceMember[]>;
  findAdminsBySpaceId(spaceId: SpaceId): Promise<SpaceMember[]>;
  findBySpaceIdAndUserId(
    spaceId: SpaceId,
    userId: UserId,
  ): Promise<SpaceMember | null>;
  findByUserId(userId: UserId): Promise<SpaceMember[]>;
  countAdminsBySpaceId(spaceId: SpaceId): Promise<number>;
  save(member: SpaceMember): Promise<void>;
  delete(spaceId: SpaceId, entity: MemberEntity): Promise<void>;
  deleteBySpaceId(spaceId: SpaceId): Promise<void>;
  replaceAll(spaceId: SpaceId, members: SpaceMember[]): Promise<void>;
}
