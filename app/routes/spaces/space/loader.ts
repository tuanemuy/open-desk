import { data } from "react-router";
import { container } from "@/core/application/container/server.instance";
import { getSpace } from "@/core/application/space/getSpace";
import { listMembers } from "@/core/application/space/listMembers";
import { listRelatedLinks } from "@/core/application/space/listRelatedLinks";
import { SpaceId as AppSpaceId } from "@/core/domain/app/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";
import type { SpaceId } from "@/core/domain/space/valueObject";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

type ThreadItem = {
  id: string;
  title: string;
  lastUpdated: string;
};

type AppItem = {
  id: string;
  name: string;
  kind: "file" | "customer" | "task";
};

type MemberItem = {
  id: string;
  name: string;
  initial: string;
  colorIndex: 1 | 2 | 3 | 4;
};

type LinkItem = {
  id: string;
  label: string;
  url: string;
};

export type SpaceLoaderData = {
  space: {
    id: string;
    name: string;
    isPublic: boolean;
    isFavorite: boolean;
    announcementHtml: string;
  };
  threads: ThreadItem[];
  apps: AppItem[];
  members: MemberItem[];
  links: LinkItem[];
};

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
  return `${y}/${m}/${d}`;
}

const COLOR_INDICES: readonly (1 | 2 | 3 | 4)[] = [1, 2, 3, 4];

export async function loader({
  request,
  params,
}: Route.LoaderArgs): Promise<SpaceLoaderData> {
  const auth = await requireAuth(request, container);
  const spaceId = params.spaceId;

  // Fetch space via use case
  const spaceDto = await handleUseCase(() =>
    getSpace({
      container,
      headers: request.headers,
      input: { operatorId: auth.userId, spaceId },
    }),
  ).match(
    (r) => r,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  // Fetch members and links via use cases (these create their own transactions)
  const [membersResult, linksResult] = await Promise.all([
    handleUseCase(() =>
      listMembers({
        container,
        headers: request.headers,
        input: { operatorId: auth.userId, spaceId },
      }),
    ).match(
      (r) => r,
      (e) => {
        throw data({ message: e.message }, { status: e.status });
      },
    ),
    handleUseCase(() =>
      listRelatedLinks({
        container,
        headers: request.headers,
        input: { operatorId: auth.userId, spaceId },
      }),
    ).match(
      (r) => r,
      (e) => {
        throw data({ message: e.message }, { status: e.status });
      },
    ),
  ]);

  // Fetch threads, apps, announcement, and bookmarks via repository (single transaction)
  const { threads, apps, announcement, bookmarks } =
    await container.unitOfWorkProvider.transaction(async (ctx) => {
      const [threadsData, appsData, announcementData, bookmarksData] =
        await Promise.all([
          ctx.threadRepository.findBySpaceId(spaceId as SpaceId),
          ctx.appRepository.findBySpaceId(AppSpaceId.create(spaceId), 0, 100),
          ctx.spaceAnnouncementRepository.findBySpaceId(spaceId as SpaceId),
          ctx.bookmarkRepository.findByUserId(auth.userId),
        ]);
      return {
        threads: threadsData,
        apps: appsData,
        announcement: announcementData,
        bookmarks: bookmarksData,
      };
    });

  // Map threads
  const threadItems: ThreadItem[] = threads.map((t) => ({
    id: t.threadId as string,
    title: t.title as string,
    lastUpdated: formatTimeAgo(t.updatedAt),
  }));

  // Map apps
  const appItems: AppItem[] = apps.map((a) => ({
    id: a.appId as string,
    name: a.name as string,
    kind: "file" as const,
  }));

  // Map members - resolve display names for USER-type members
  const userMemberIds: string[] = [];
  for (const m of membersResult.members) {
    if (m.entity.type === "USER") {
      userMemberIds.push(m.entity.id as string);
    }
  }

  const userNameMap = new Map<string, string>();
  if (userMemberIds.length > 0) {
    await container.unitOfWorkProvider.transaction(async (ctx) => {
      for (const uid of userMemberIds) {
        const user = await ctx.userRepository.findById(uid as UserId);
        if (user) {
          userNameMap.set(uid, user.displayName as string);
        }
      }
    });
  }

  const memberItems: MemberItem[] = [];
  for (const [i, m] of membersResult.members.entries()) {
    const entityId = m.entity.id as string;
    const name =
      m.entity.type === "USER"
        ? (userNameMap.get(entityId) ?? m.entity.code)
        : m.entity.code;
    memberItems.push({
      id: entityId,
      name,
      initial: name.charAt(0),
      colorIndex: COLOR_INDICES[i % COLOR_INDICES.length],
    });
  }

  // Map links
  const linkItems: LinkItem[] = linksResult.links.map((l) => ({
    id: l.linkId,
    label: l.title,
    url: l.url,
  }));

  // Check if the current space is bookmarked by the user
  const spaceUrlPattern = `/spaces/${spaceId}`;
  const isFavorite = bookmarks.some(
    (b) => (b.url as string) === spaceUrlPattern,
  );

  return {
    space: {
      id: spaceDto.spaceId,
      name: spaceDto.name,
      isPublic: !spaceDto.isPrivate,
      isFavorite,
      announcementHtml: announcement?.body ?? "",
    },
    threads: threadItems,
    apps: appItems,
    members: memberItems,
    links: linkItems,
  };
}
