import { data } from "react-router";
import { container } from "@/core/application/container/server.instance";
import { listNotifications } from "@/core/application/notification/listNotifications";
import { getPortalView } from "@/core/application/portal/getPortalView";
import type { AppIcon } from "@/core/domain/app/valueObject";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

type NotificationItem = {
  id: string;
  appName: string;
  message: string;
  timeAgo: string;
  author: string;
  unread: boolean;
};

type SpaceItem = {
  id: string;
  name: string;
  initial: string;
  color: string;
  description: string;
};

type AppItem = {
  id: string;
  name: string;
  spaceName: string;
  icon: "file" | "people" | "calendar";
};

type Announcement = {
  title: string;
  bodyHtml: string;
  author: string;
  date: string;
};

export type PortalLoaderData = {
  announcement: Announcement;
  notifications: NotificationItem[];
  spaces: SpaceItem[];
  apps: AppItem[];
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
  if (diffDays < 7) return `${diffDays}日前`;

  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}/${m}/${d} ${hh}:${mm}`;
}

/**
 * Format a Date as "YYYY/M/D H:mm".
 */
function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const hh = date.getHours();
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}/${m}/${d} ${hh}:${mm}`;
}

/**
 * Map a SourceType to a human-readable app name for display.
 */
function sourceTypeToAppName(sourceType: string, title: string): string {
  switch (sourceType) {
    case "RECORD":
      return "Record";
    case "COMMENT":
      return "Comment";
    case "THREAD":
      return "Thread";
    default:
      return title.split(" ")[0] ?? "Notification";
  }
}

/**
 * Map an AppIcon domain value object to a UI icon key.
 */
function resolveAppIcon(icon: AppIcon): AppItem["icon"] {
  if (icon.type === "PRESET" && icon.key) {
    const presetKeyMap: Record<string, AppItem["icon"]> = {
      people: "people",
      calendar: "calendar",
      file: "file",
    };
    return presetKeyMap[icon.key] ?? "file";
  }
  return "file";
}

const DEFAULT_ANNOUNCEMENT: Announcement = {
  title: "Welcome to OpenDesk",
  bodyHtml:
    "<p>No announcements yet. Check back later for updates from your team.</p>",
  author: "System",
  date: formatDate(new Date()),
};

export async function loader({
  request,
}: Route.LoaderArgs): Promise<PortalLoaderData> {
  const auth = await requireAuth(request, container);

  // Fetch announcement
  const portalView = await handleUseCase(() =>
    getPortalView({
      container,
      headers: request.headers,
      input: { operatorId: auth.userId },
    }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  const announcement: Announcement = portalView.announcement
    ? {
        title: portalView.announcement.title,
        bodyHtml: portalView.announcement.body as string,
        author: portalView.announcement.lastUpdatedBy as string,
        date: formatDate(portalView.announcement.updatedAt),
      }
    : DEFAULT_ANNOUNCEMENT;

  // Fetch notifications (limit: 4)
  const notificationResult = await handleUseCase(() =>
    listNotifications({
      container,
      headers: request.headers,
      input: { operatorId: auth.userId, limit: 4 },
    }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  const notifications: NotificationItem[] =
    notificationResult.notifications.map((n) => ({
      id: n.notificationId,
      appName: sourceTypeToAppName(n.sourceType, n.title),
      message: n.title,
      timeAgo: formatTimeAgo(n.createdAt),
      author: n.senderId ?? "System",
      unread: !n.isRead,
    }));

  // Fetch spaces from DB (use repository directly)
  const spaces: SpaceItem[] = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      const spaceList = await ctx.spaceRepository.list({}, 0, 10);
      const SPACE_COLORS = [
        "var(--color-primary)",
        "var(--color-success)",
        "var(--color-warning)",
        "var(--color-info)",
        "var(--color-danger)",
      ];
      return spaceList.map((s, i) => ({
        id: s.spaceId as string,
        name: s.name as string,
        initial: (s.name as string).charAt(0),
        color: SPACE_COLORS[i % SPACE_COLORS.length] as string,
        description: "",
      }));
    },
  );

  // Fetch apps from DB (use repository directly)
  const apps: AppItem[] = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      const appList = await ctx.appRepository.list({}, 0, 10);
      const results: AppItem[] = [];
      for (const a of appList) {
        let spaceName = "";
        if (a.spaceId) {
          const space = await ctx.spaceRepository.findById(a.spaceId);
          spaceName = space ? (space.name as string) : "";
        }
        results.push({
          id: a.appId as string,
          name: a.name as string,
          spaceName,
          icon: resolveAppIcon(a.icon),
        });
      }
      return results;
    },
  );

  return {
    announcement,
    notifications,
    spaces,
    apps,
  };
}
