import type { InferSelectModel } from "drizzle-orm";
import { and, count, eq, sql } from "drizzle-orm";
import { follows } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import type { Follow } from "@/core/domain/people/entity";
import type {
  FolloweeListParams,
  FollowerListParams,
  FollowListResult,
  FollowRepository,
} from "@/core/domain/people/ports/followRepository";
import type { Executor } from "../client";

type FollowDataModel = InferSelectModel<typeof follows>;

export class DrizzleSqliteFollowRepository implements FollowRepository {
  constructor(private readonly executor: Executor) {}

  private into(data: FollowDataModel): Follow {
    return {
      followerId: data.followerId as UserIdType,
      followeeId: data.followeeId as UserIdType,
      createdAt: data.createdAt,
    };
  }

  async findByPair(
    followerId: UserIdType,
    followeeId: UserIdType,
  ): Promise<Follow | null> {
    try {
      const results = await this.executor
        .select()
        .from(follows)
        .where(
          and(
            eq(follows.followerId, followerId),
            eq(follows.followeeId, followeeId),
          ),
        )
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find follow by pair",
        error,
      );
    }
  }

  async findFollowers(params: FollowerListParams): Promise<FollowListResult> {
    try {
      const [items, countResult] = await Promise.all([
        this.executor
          .select()
          .from(follows)
          .where(eq(follows.followeeId, params.followeeId))
          .orderBy(sql`${follows.createdAt} DESC`)
          .limit(params.limit)
          .offset(params.offset),
        this.executor
          .select({ count: count() })
          .from(follows)
          .where(eq(follows.followeeId, params.followeeId)),
      ]);

      return {
        follows: items.map((item) => this.into(item)),
        totalCount: countResult[0]?.count ?? 0,
      };
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find followers",
        error,
      );
    }
  }

  async findFollowees(params: FolloweeListParams): Promise<FollowListResult> {
    try {
      const [items, countResult] = await Promise.all([
        this.executor
          .select()
          .from(follows)
          .where(eq(follows.followerId, params.followerId))
          .orderBy(sql`${follows.createdAt} DESC`)
          .limit(params.limit)
          .offset(params.offset),
        this.executor
          .select({ count: count() })
          .from(follows)
          .where(eq(follows.followerId, params.followerId)),
      ]);

      return {
        follows: items.map((item) => this.into(item)),
        totalCount: countResult[0]?.count ?? 0,
      };
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find followees",
        error,
      );
    }
  }

  async save(follow: Follow): Promise<void> {
    try {
      await this.executor
        .insert(follows)
        .values({
          followerId: follow.followerId,
          followeeId: follow.followeeId,
          createdAt: follow.createdAt,
        })
        .onConflictDoUpdate({
          target: [follows.followerId, follows.followeeId],
          set: {
            createdAt: follow.createdAt,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save follow",
        error,
      );
    }
  }

  async delete(followerId: UserIdType, followeeId: UserIdType): Promise<void> {
    try {
      await this.executor
        .delete(follows)
        .where(
          and(
            eq(follows.followerId, followerId),
            eq(follows.followeeId, followeeId),
          ),
        );
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete follow",
        error,
      );
    }
  }
}
