import { and, eq } from "drizzle-orm";
import { threadFollows } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import type { ThreadFollow } from "@/core/domain/space/entity";
import type { ThreadFollowRepository } from "@/core/domain/space/ports/threadFollowRepository";
import type { ThreadId as ThreadIdType } from "@/core/domain/space/valueObject";
import type { Executor } from "../client";

export class DrizzleSqliteThreadFollowRepository
  implements ThreadFollowRepository
{
  constructor(private readonly executor: Executor) {}

  async exists(threadId: ThreadIdType, userId: UserIdType): Promise<boolean> {
    try {
      const results = await this.executor
        .select()
        .from(threadFollows)
        .where(
          and(
            eq(threadFollows.threadId, threadId),
            eq(threadFollows.userId, userId),
          ),
        )
        .limit(1);

      return results.length > 0;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to check thread follow existence",
        error,
      );
    }
  }

  async findByThreadId(threadId: ThreadIdType): Promise<ThreadFollow[]> {
    try {
      const results = await this.executor
        .select()
        .from(threadFollows)
        .where(eq(threadFollows.threadId, threadId));

      return results.map((r) => ({
        threadId: r.threadId as ThreadIdType,
        userId: r.userId as UserIdType,
      }));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find thread follows by thread id",
        error,
      );
    }
  }

  async findByUserId(userId: UserIdType): Promise<ThreadFollow[]> {
    try {
      const results = await this.executor
        .select()
        .from(threadFollows)
        .where(eq(threadFollows.userId, userId));

      return results.map((r) => ({
        threadId: r.threadId as ThreadIdType,
        userId: r.userId as UserIdType,
      }));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find thread follows by user id",
        error,
      );
    }
  }

  async save(follow: ThreadFollow): Promise<void> {
    try {
      await this.executor
        .insert(threadFollows)
        .values({
          threadId: follow.threadId,
          userId: follow.userId,
        })
        .onConflictDoUpdate({
          target: [threadFollows.threadId, threadFollows.userId],
          set: {
            threadId: follow.threadId,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save thread follow",
        error,
      );
    }
  }

  async delete(threadId: ThreadIdType, userId: UserIdType): Promise<void> {
    try {
      await this.executor
        .delete(threadFollows)
        .where(
          and(
            eq(threadFollows.threadId, threadId),
            eq(threadFollows.userId, userId),
          ),
        );
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete thread follow",
        error,
      );
    }
  }

  async deleteByThreadId(threadId: ThreadIdType): Promise<void> {
    try {
      await this.executor
        .delete(threadFollows)
        .where(eq(threadFollows.threadId, threadId));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete thread follows by thread id",
        error,
      );
    }
  }
}
