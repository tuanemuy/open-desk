import type { InferSelectModel } from "drizzle-orm";
import { and, count, eq } from "drizzle-orm";
import { threads } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import type { Thread } from "@/core/domain/space/entity";
import type { ThreadRepository } from "@/core/domain/space/ports/threadRepository";
import type {
  SpaceId as SpaceIdType,
  ThreadId as ThreadIdType,
  ThreadTitle as ThreadTitleType,
} from "@/core/domain/space/valueObject";
import type { Executor } from "../client";

type ThreadDataModel = InferSelectModel<typeof threads>;

export class DrizzleSqliteThreadRepository implements ThreadRepository {
  constructor(private readonly executor: Executor) {}

  private into(data: ThreadDataModel): Thread {
    return {
      threadId: data.id as ThreadIdType,
      spaceId: data.spaceId as SpaceIdType,
      title: data.title as ThreadTitleType,
      body: data.body,
      creatorId: data.creatorId as UserIdType,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      isDefault: data.isDefault,
      notifyOnCreate: data.notifyOnCreate,
    };
  }

  async findById(threadId: ThreadIdType): Promise<Thread | null> {
    try {
      const results = await this.executor
        .select()
        .from(threads)
        .where(eq(threads.id, threadId))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find thread by id",
        error,
      );
    }
  }

  async findBySpaceId(spaceId: SpaceIdType): Promise<Thread[]> {
    try {
      const results = await this.executor
        .select()
        .from(threads)
        .where(eq(threads.spaceId, spaceId));

      return results.map((r) => this.into(r));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find threads by space id",
        error,
      );
    }
  }

  async findDefaultBySpaceId(spaceId: SpaceIdType): Promise<Thread | null> {
    try {
      const results = await this.executor
        .select()
        .from(threads)
        .where(and(eq(threads.spaceId, spaceId), eq(threads.isDefault, true)))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find default thread by space id",
        error,
      );
    }
  }

  async save(thread: Thread): Promise<void> {
    try {
      await this.executor
        .insert(threads)
        .values({
          id: thread.threadId,
          spaceId: thread.spaceId,
          title: thread.title,
          body: thread.body,
          creatorId: thread.creatorId,
          isDefault: thread.isDefault,
          notifyOnCreate: thread.notifyOnCreate,
          createdAt: thread.createdAt,
          updatedAt: thread.updatedAt,
        })
        .onConflictDoUpdate({
          target: threads.id,
          set: {
            title: thread.title,
            body: thread.body,
            isDefault: thread.isDefault,
            notifyOnCreate: thread.notifyOnCreate,
            updatedAt: thread.updatedAt,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save thread",
        error,
      );
    }
  }

  async delete(threadId: ThreadIdType): Promise<void> {
    try {
      await this.executor.delete(threads).where(eq(threads.id, threadId));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete thread",
        error,
      );
    }
  }

  async countBySpaceId(spaceId: SpaceIdType): Promise<number> {
    try {
      const result = await this.executor
        .select({ count: count() })
        .from(threads)
        .where(eq(threads.spaceId, spaceId));

      return result[0]?.count ?? 0;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to count threads by space id",
        error,
      );
    }
  }
}
