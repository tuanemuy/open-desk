import type { UserId } from "@/core/domain/identity/valueObject";
import type { Space } from "@/core/domain/space/entity";
import type { SpaceId } from "@/core/domain/space/valueObject";

export type SpaceListFilter = {
  readonly isGuest?: boolean;
  readonly isPrivate?: boolean;
  readonly keyword?: string;
  readonly memberUserId?: UserId;
};

export interface SpaceRepository {
  findById(spaceId: SpaceId): Promise<Space | null>;
  list(
    filter: SpaceListFilter,
    offset: number,
    limit: number,
  ): Promise<Space[]>;
  count(filter: SpaceListFilter): Promise<number>;
  countRegular(): Promise<number>;
  countGuest(): Promise<number>;
  save(space: Space): Promise<void>;
  delete(spaceId: SpaceId): Promise<void>;
}
