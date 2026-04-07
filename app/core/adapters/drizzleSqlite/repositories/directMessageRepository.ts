import type { InferSelectModel } from "drizzle-orm";
import { and, count, eq, gte, like, lte, sql } from "drizzle-orm";
import { directMessages } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import type { DirectMessage } from "@/core/domain/message/entity";
import type {
  DirectMessageListResult,
  DirectMessageRepository,
  DirectMessageSearchParams,
} from "@/core/domain/message/ports/directMessageRepository";
import type {
  DirectMessageId as DirectMessageIdType,
  FileKey as FileKeyType,
  MessageThreadId as MessageThreadIdType,
  RichTextHtml as RichTextHtmlType,
} from "@/core/domain/message/valueObject";
import type { Executor } from "../client";

type DirectMessageDataModel = InferSelectModel<typeof directMessages>;

export class DrizzleSqliteDirectMessageRepository
  implements DirectMessageRepository
{
  constructor(private readonly executor: Executor) {}

  private into(data: DirectMessageDataModel): DirectMessage {
    return {
      messageId: data.id as DirectMessageIdType,
      threadId: data.threadId as MessageThreadIdType,
      senderId: data.senderId as UserIdType,
      content: data.content as RichTextHtmlType,
      attachmentFileKeys:
        data.attachmentFileKeys as unknown as readonly FileKeyType[],
      createdAt: data.createdAt,
    };
  }

  async findById(
    messageId: DirectMessageIdType,
  ): Promise<DirectMessage | null> {
    try {
      const results = await this.executor
        .select()
        .from(directMessages)
        .where(eq(directMessages.id, messageId))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find direct message by id",
        error,
      );
    }
  }

  async findByThreadId(params: {
    threadId: MessageThreadIdType;
    offset: number;
    limit: number;
  }): Promise<DirectMessageListResult> {
    try {
      const [items, countResult] = await Promise.all([
        this.executor
          .select()
          .from(directMessages)
          .where(eq(directMessages.threadId, params.threadId))
          .orderBy(sql`${directMessages.createdAt} DESC`)
          .limit(params.limit)
          .offset(params.offset),
        this.executor
          .select({ count: count() })
          .from(directMessages)
          .where(eq(directMessages.threadId, params.threadId)),
      ]);

      return {
        messages: items.map((item) => this.into(item)),
        totalCount: countResult[0]?.count ?? 0,
      };
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find direct messages by thread id",
        error,
      );
    }
  }

  async save(message: DirectMessage): Promise<void> {
    try {
      await this.executor
        .insert(directMessages)
        .values({
          id: message.messageId,
          threadId: message.threadId,
          senderId: message.senderId,
          content: message.content,
          attachmentFileKeys: message.attachmentFileKeys as unknown as string[],
          createdAt: message.createdAt,
        })
        .onConflictDoUpdate({
          target: directMessages.id,
          set: {
            content: message.content,
            attachmentFileKeys:
              message.attachmentFileKeys as unknown as string[],
          },
        });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save direct message",
        error,
      );
    }
  }

  async search(
    params: DirectMessageSearchParams,
  ): Promise<DirectMessageListResult> {
    try {
      const conditions = [like(directMessages.content, `%${params.keyword}%`)];

      if (params.threadId !== undefined) {
        conditions.push(eq(directMessages.threadId, params.threadId));
      }

      if (params.senderId !== undefined) {
        conditions.push(eq(directMessages.senderId, params.senderId));
      }

      if (params.dateFrom !== undefined) {
        conditions.push(gte(directMessages.createdAt, params.dateFrom));
      }

      if (params.dateTo !== undefined) {
        conditions.push(lte(directMessages.createdAt, params.dateTo));
      }

      const whereClause = and(...conditions);

      const [items, countResult] = await Promise.all([
        this.executor
          .select()
          .from(directMessages)
          .where(whereClause)
          .orderBy(sql`${directMessages.createdAt} DESC`)
          .limit(params.limit)
          .offset(params.offset),
        this.executor
          .select({ count: count() })
          .from(directMessages)
          .where(whereClause),
      ]);

      return {
        messages: items.map((item) => this.into(item)),
        totalCount: countResult[0]?.count ?? 0,
      };
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to search direct messages",
        error,
      );
    }
  }
}
