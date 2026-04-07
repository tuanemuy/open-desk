import type { InferSelectModel } from "drizzle-orm";
import { and, count, eq, inArray, lt, sql } from "drizzle-orm";
import { notifications } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import type { Notification } from "@/core/domain/notification/entity";
import type { NotificationRepository } from "@/core/domain/notification/ports/notificationRepository";
import type {
  NotificationContent as NotificationContentType,
  NotificationId as NotificationIdType,
  NotificationTitle as NotificationTitleType,
  NotificationType as NotificationTypeType,
  SourceType as SourceTypeType,
} from "@/core/domain/notification/valueObject";
import type { Executor } from "../client";

type NotificationDataModel = InferSelectModel<typeof notifications>;

export class DrizzleSqliteNotificationRepository
  implements NotificationRepository
{
  constructor(private readonly executor: Executor) {}

  private into(data: NotificationDataModel): Notification {
    return {
      notificationId: data.id as NotificationIdType,
      recipientId: data.recipientId as UserIdType,
      type: data.type as NotificationTypeType,
      sourceType: data.sourceType as SourceTypeType,
      sourceId: data.sourceId,
      senderId: data.senderId !== null ? (data.senderId as UserIdType) : null,
      title: data.title as NotificationTitleType,
      content: data.content as NotificationContentType,
      isRead: data.isRead,
      isReadLater: data.isReadLater,
      createdAt: data.createdAt,
    };
  }

  async findById(
    notificationId: NotificationIdType,
  ): Promise<Notification | null> {
    try {
      const results = await this.executor
        .select()
        .from(notifications)
        .where(eq(notifications.id, notificationId))
        .limit(1);

      if (results.length === 0) {
        return null;
      }

      return this.into(results[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find notification by id",
        error,
      );
    }
  }

  async findByRecipientId(
    recipientId: UserIdType,
    params: {
      isRead?: boolean;
      isReadLater?: boolean;
      notificationType?: NotificationTypeType;
      offset: number;
      limit: number;
    },
  ): Promise<{ notifications: Notification[]; totalCount: number }> {
    try {
      const conditions = [eq(notifications.recipientId, recipientId)];

      if (params.isRead !== undefined) {
        conditions.push(eq(notifications.isRead, params.isRead));
      }

      if (params.isReadLater !== undefined) {
        conditions.push(eq(notifications.isReadLater, params.isReadLater));
      }

      if (params.notificationType !== undefined) {
        conditions.push(eq(notifications.type, params.notificationType));
      }

      const whereClause = and(...conditions);

      const [items, countResult] = await Promise.all([
        this.executor
          .select()
          .from(notifications)
          .where(whereClause)
          .orderBy(sql`${notifications.createdAt} DESC`)
          .limit(params.limit)
          .offset(params.offset),
        this.executor
          .select({ count: count() })
          .from(notifications)
          .where(whereClause),
      ]);

      return {
        notifications: items.map((item) => this.into(item)),
        totalCount: countResult[0]?.count ?? 0,
      };
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find notifications by recipient id",
        error,
      );
    }
  }

  async save(notification: Notification): Promise<Notification> {
    try {
      await this.executor
        .insert(notifications)
        .values({
          id: notification.notificationId,
          recipientId: notification.recipientId,
          type: notification.type,
          sourceType: notification.sourceType,
          sourceId: notification.sourceId,
          senderId: notification.senderId,
          title: notification.title,
          content: notification.content,
          isRead: notification.isRead,
          isReadLater: notification.isReadLater,
          createdAt: notification.createdAt,
        })
        .onConflictDoUpdate({
          target: notifications.id,
          set: {
            type: notification.type,
            sourceType: notification.sourceType,
            sourceId: notification.sourceId,
            senderId: notification.senderId,
            title: notification.title,
            content: notification.content,
            isRead: notification.isRead,
            isReadLater: notification.isReadLater,
          },
        });

      return notification;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save notification",
        error,
      );
    }
  }

  async saveBatch(notificationList: Notification[]): Promise<Notification[]> {
    try {
      if (notificationList.length === 0) {
        return [];
      }

      await this.executor.insert(notifications).values(
        notificationList.map((n) => ({
          id: n.notificationId,
          recipientId: n.recipientId,
          type: n.type,
          sourceType: n.sourceType,
          sourceId: n.sourceId,
          senderId: n.senderId,
          title: n.title,
          content: n.content,
          isRead: n.isRead,
          isReadLater: n.isReadLater,
          createdAt: n.createdAt,
        })),
      );

      return notificationList;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save notifications in batch",
        error,
      );
    }
  }

  async delete(notificationId: NotificationIdType): Promise<void> {
    try {
      await this.executor
        .delete(notifications)
        .where(eq(notifications.id, notificationId));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete notification",
        error,
      );
    }
  }

  async markAsReadBatch(
    recipientId: UserIdType,
    notificationIds?: NotificationIdType[],
  ): Promise<number> {
    try {
      const conditions = [
        eq(notifications.recipientId, recipientId),
        eq(notifications.isRead, false),
      ];

      if (notificationIds !== undefined && notificationIds.length > 0) {
        conditions.push(inArray(notifications.id, notificationIds));
      }

      const result = await this.executor
        .update(notifications)
        .set({ isRead: true })
        .where(and(...conditions));

      return result.rowsAffected;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to mark notifications as read in batch",
        error,
      );
    }
  }

  async countUnread(recipientId: UserIdType): Promise<number> {
    try {
      const result = await this.executor
        .select({ count: count() })
        .from(notifications)
        .where(
          and(
            eq(notifications.recipientId, recipientId),
            eq(notifications.isRead, false),
          ),
        );

      return result[0]?.count ?? 0;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to count unread notifications",
        error,
      );
    }
  }

  async deleteExpired(before: Date): Promise<number> {
    try {
      const result = await this.executor
        .delete(notifications)
        .where(lt(notifications.createdAt, before));

      return result.rowsAffected;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete expired notifications",
        error,
      );
    }
  }
}
