import { data } from "react-router";
import { container } from "@/core/application/container/server.instance";
import { listNotifications } from "@/core/application/notification/listNotifications";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

export type NotificationItem = {
  id: string;
  appName: string;
  title: string;
  description: string;
  timeAgo: string;
  userName: string;
  unread: boolean;
};

export type NotificationsLoaderData = {
  notifications: NotificationItem[];
};

/**
 * Format a Date to a relative time-ago string in Japanese.
 */
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "たった今";
  if (diffMinutes < 60) return `${diffMinutes}分前`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}時間前`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "昨日";
  if (diffDays < 7) return `${diffDays}日前`;

  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}/${m}/${d}`;
}

/**
 * Map a SourceType to a human-readable app name in Japanese.
 */
function sourceTypeToAppName(sourceType: string): string {
  switch (sourceType) {
    case "RECORD":
      return "レコード";
    case "COMMENT":
      return "コメント";
    case "THREAD":
      return "スレッド";
    default:
      return "通知";
  }
}

export async function loader({
  request,
}: Route.LoaderArgs): Promise<NotificationsLoaderData> {
  const auth = await requireAuth(request, container);

  const result = await handleUseCase(() =>
    listNotifications({
      container,
      headers: request.headers,
      input: { operatorId: auth.userId, limit: 50 },
    }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  const notifications: NotificationItem[] = result.notifications.map((n) => ({
    id: n.notificationId,
    appName: sourceTypeToAppName(n.sourceType),
    title: n.title,
    description: n.content,
    timeAgo: formatTimeAgo(n.createdAt),
    userName: n.senderId ?? "システム通知",
    unread: !n.isRead,
  }));

  return { notifications };
}
