import { eq } from "drizzle-orm";
import type { PushSubscription } from "web-push";
import webpush from "web-push";
import type { Database } from "@/core/adapters/drizzleSqlite/client";
import { pushSubscriptions } from "@/core/adapters/drizzleSqlite/schema";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { UserId as UserIdType } from "@/core/domain/identity/valueObject";
import type { Notification } from "@/core/domain/notification/entity";
import type { DesktopNotificationPublisher } from "@/core/domain/notification/ports/desktopNotificationPublisher";

/**
 * VAPID configuration for Web Push.
 */
export type VapidConfig = Readonly<{
  publicKey: string;
  privateKey: string;
  subject: string;
}>;

/**
 * Web Push payload structure sent to the Service Worker.
 */
type WebPushPayload = Readonly<{
  title: string;
  body: string;
  icon?: string;
  url?: string;
}>;

/**
 * HTTP status codes indicating a subscription is no longer valid.
 * 404 = Not Found (subscription removed)
 * 410 = Gone (subscription expired)
 */
const EXPIRED_SUBSCRIPTION_STATUS_CODES = [404, 410] as const;

/**
 * Check whether a web-push error indicates an expired/invalid subscription.
 */
function isExpiredSubscriptionError(error: unknown): boolean {
  if (error instanceof webpush.WebPushError) {
    return (EXPIRED_SUBSCRIPTION_STATUS_CODES as readonly number[]).includes(
      error.statusCode,
    );
  }
  return false;
}

/**
 * Build the JSON payload for a Web Push notification.
 */
function buildPayload(notification: Notification): string {
  const payload: WebPushPayload = {
    title: String(notification.title),
    body: String(notification.content),
  };
  return JSON.stringify(payload);
}

/**
 * Web Push implementation of DesktopNotificationPublisher.
 *
 * Sends push notifications via the Web Push protocol using VAPID authentication.
 * Push subscriptions are stored in the `push_subscriptions` database table.
 */
export class WebPushDesktopNotificationPublisher
  implements DesktopNotificationPublisher
{
  private readonly db: Database;

  constructor(vapidConfig: VapidConfig, db: Database) {
    this.db = db;

    webpush.setVapidDetails(
      vapidConfig.subject,
      vapidConfig.publicKey,
      vapidConfig.privateKey,
    );
  }

  async publish(
    recipientId: UserIdType,
    notification: Notification,
  ): Promise<void> {
    const subscriptionRows = await this.db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, recipientId));

    if (subscriptionRows.length === 0) {
      return;
    }

    const payload = buildPayload(notification);
    const expiredSubscriptionIds: string[] = [];

    const results = await Promise.allSettled(
      subscriptionRows.map(async (row) => {
        const subscription: PushSubscription = {
          endpoint: row.endpoint,
          expirationTime: row.expirationTime ?? null,
          keys: {
            p256dh: row.keyP256dh,
            auth: row.keyAuth,
          },
        };

        try {
          await webpush.sendNotification(subscription, payload);
        } catch (error: unknown) {
          if (isExpiredSubscriptionError(error)) {
            expiredSubscriptionIds.push(row.id);
            return;
          }
          throw error;
        }
      }),
    );

    // Remove expired/invalid subscriptions from the database
    if (expiredSubscriptionIds.length > 0) {
      await Promise.allSettled(
        expiredSubscriptionIds.map((id) =>
          this.db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, id)),
        ),
      );
    }

    // Collect non-expired failures
    const failures = results.filter(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );

    if (failures.length > 0) {
      throw new SystemError(
        SystemErrorCode.ExternalApiError,
        `Failed to send ${failures.length} of ${subscriptionRows.length} push notifications for user ${recipientId}`,
        failures[0].reason,
      );
    }
  }
}
