import type { InferSelectModel } from "drizzle-orm";
import { and, count, eq, or, sql } from "drizzle-orm";
import { messageThreads } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import type { MessageThread } from "@/core/domain/message/entity";
import type {
  MessageThreadListResult,
  MessageThreadRepository,
} from "@/core/domain/message/ports/messageThreadRepository";
import type { MessageThreadId as MessageThreadIdType } from "@/core/domain/message/valueObject";
import type { Executor } from "../client";

type MessageThreadDataModel = InferSelectModel<typeof messageThreads>;

export class DrizzleSqliteMessageThreadRepository
  implements MessageThreadRepository
{
  constructor(private readonly executor: Executor) {}

  private into(data: MessageThreadDataModel): MessageThread {
    return {
      threadId: data.id as MessageThreadIdType,
      participantIds: [
        data.participant1Id as UserIdType,
        data.participant2Id as UserIdType,
      ] as const,
      lastMessageAt: data.lastMessageAt,
      createdAt: data.createdAt,
    };
  }

  /**
   * Sort two UserIds lexicographically to ensure consistent ordering.
   */
  private sortParticipants(
    id1: UserIdType,
    id2: UserIdType,
  ): readonly [UserIdType, UserIdType] {
    return id1 <= id2 ? [id1, id2] : [id2, id1];
  }

  async findById(threadId: MessageThreadIdType): Promise<MessageThread | null> {
    try {
      const results = await this.executor
        .select()
        .from(messageThreads)
        .where(eq(messageThreads.id, threadId))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find message thread by id",
        error,
      );
    }
  }

  async findByParticipantIds(
    participantId1: UserIdType,
    participantId2: UserIdType,
  ): Promise<MessageThread | null> {
    try {
      const [sorted1, sorted2] = this.sortParticipants(
        participantId1,
        participantId2,
      );

      const results = await this.executor
        .select()
        .from(messageThreads)
        .where(
          and(
            eq(messageThreads.participant1Id, sorted1),
            eq(messageThreads.participant2Id, sorted2),
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
        "Failed to find message thread by participant ids",
        error,
      );
    }
  }

  async findByParticipantUserId(params: {
    userId: UserIdType;
    offset: number;
    limit: number;
  }): Promise<MessageThreadListResult> {
    try {
      const whereClause = or(
        eq(messageThreads.participant1Id, params.userId),
        eq(messageThreads.participant2Id, params.userId),
      );

      const [items, countResult] = await Promise.all([
        this.executor
          .select()
          .from(messageThreads)
          .where(whereClause)
          .orderBy(sql`${messageThreads.lastMessageAt} DESC NULLS LAST`)
          .limit(params.limit)
          .offset(params.offset),
        this.executor
          .select({ count: count() })
          .from(messageThreads)
          .where(whereClause),
      ]);

      return {
        threads: items.map((item) => this.into(item)),
        totalCount: countResult[0]?.count ?? 0,
      };
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find message threads by participant user id",
        error,
      );
    }
  }

  async save(thread: MessageThread): Promise<void> {
    try {
      const [sorted1, sorted2] = this.sortParticipants(
        thread.participantIds[0],
        thread.participantIds[1],
      );

      await this.executor
        .insert(messageThreads)
        .values({
          id: thread.threadId,
          participant1Id: sorted1,
          participant2Id: sorted2,
          lastMessageAt: thread.lastMessageAt,
          createdAt: thread.createdAt,
        })
        .onConflictDoUpdate({
          target: messageThreads.id,
          set: {
            lastMessageAt: thread.lastMessageAt,
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save message thread",
        error,
      );
    }
  }
}
