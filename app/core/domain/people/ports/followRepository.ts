import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import type { Follow } from "@/core/domain/people/entity";

/**
 * Parameters for listing followers of a user.
 */
export type FollowerListParams = {
  readonly followeeId: UserIdType;
  readonly offset: number;
  readonly limit: number;
};

/**
 * Parameters for listing users that a user is following.
 */
export type FolloweeListParams = {
  readonly followerId: UserIdType;
  readonly offset: number;
  readonly limit: number;
};

/**
 * Paginated follow listing result.
 */
export type FollowListResult = {
  readonly follows: readonly Follow[];
  readonly totalCount: number;
};

/**
 * Repository port for Follow entity persistence.
 */
export interface FollowRepository {
  /**
   * Find a follow relationship between two users.
   * @returns The follow relationship, or null if not found.
   */
  findByPair(
    followerId: UserIdType,
    followeeId: UserIdType,
  ): Promise<Follow | null>;

  /**
   * Find followers of a user with pagination (newest first).
   */
  findFollowers(params: FollowerListParams): Promise<FollowListResult>;

  /**
   * Find users that a user is following with pagination (newest first).
   */
  findFollowees(params: FolloweeListParams): Promise<FollowListResult>;

  /**
   * Save a follow relationship (insert only).
   */
  save(follow: Follow): Promise<void>;

  /**
   * Delete a follow relationship (unfollow).
   */
  delete(followerId: UserIdType, followeeId: UserIdType): Promise<void>;
}
