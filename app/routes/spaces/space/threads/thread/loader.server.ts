import { data } from "react-router";
import { container } from "@/core/application/container/server.instance";
import { SpaceId as AppSpaceId } from "@/core/domain/app/valueObject";
import type { UserId } from "@/core/domain/identity/valueObject";
import type { SpaceId, ThreadId } from "@/core/domain/space/valueObject";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

type SidebarThread = {
  id: string;
  title: string;
  commentCount: number;
};

type SidebarApp = {
  id: string;
  name: string;
  kind: "file" | "customer";
};

type SidebarMember = {
  id: string;
  name: string;
  initial: string;
  colorIndex: 1 | 2 | 3 | 4;
};

type Comment = {
  id: string;
  author: string;
  initial: string;
  colorIndex: 1 | 2 | 3 | 4;
  time: string;
  body: string[];
};

export type ThreadLoaderData = {
  space: {
    id: string;
    name: string;
  };
  thread: {
    id: string;
    title: string;
    author: string;
    createdAt: string;
    body: string[];
    listItems: string[];
  };
  sidebarThreads: SidebarThread[];
  sidebarApps: SidebarApp[];
  sidebarMembers: SidebarMember[];
  comments: Comment[];
};

function formatDateTime(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}年${m}月${d}日 ${hh}:${mm}`;
}

const COLOR_INDICES: readonly (1 | 2 | 3 | 4)[] = [1, 2, 3, 4];

export async function loader({
  request,
  params,
}: Route.LoaderArgs): Promise<ThreadLoaderData> {
  await requireAuth(request, container);
  const spaceId = params.spaceId as SpaceId;
  const threadId = params.threadId as ThreadId;

  const result = await container.unitOfWorkProvider.transaction(async (ctx) => {
    // Fetch the space
    const space = await ctx.spaceRepository.findById(spaceId);
    if (!space) {
      throw data({ message: "スペースが見つかりません" }, { status: 404 });
    }

    // Fetch the thread
    const thread = await ctx.threadRepository.findById(threadId);
    if (!thread) {
      throw data({ message: "スレッドが見つかりません" }, { status: 404 });
    }

    // Fetch comments for this thread
    const commentResult = await ctx.threadCommentRepository.findByThreadId(
      threadId,
      0,
      100,
    );

    // Fetch all threads in this space for the sidebar
    const allThreads = await ctx.threadRepository.findBySpaceId(spaceId);

    // Fetch apps in this space for the sidebar
    const apps = await ctx.appRepository.findBySpaceId(
      AppSpaceId.create(spaceId as string),
      0,
      100,
    );

    // Fetch members for the sidebar
    const members = await ctx.spaceMemberRepository.findBySpaceId(spaceId);

    // Collect all user IDs that need name resolution
    const userIdsToResolve = new Set<string>();
    userIdsToResolve.add(thread.creatorId as string);
    for (const c of commentResult.comments) {
      userIdsToResolve.add(c.creatorId as string);
    }
    for (const m of members) {
      if (m.entity.type === "USER") {
        userIdsToResolve.add(m.entity.id as string);
      }
    }

    // Resolve user names
    const userNameMap = new Map<string, string>();
    for (const uid of userIdsToResolve) {
      const user = await ctx.userRepository.findById(uid as UserId);
      if (user) {
        userNameMap.set(uid, user.displayName as string);
      }
    }

    // Count comments per thread for sidebar
    const threadCommentCounts = new Map<string, number>();
    for (const t of allThreads) {
      const countResult = await ctx.threadCommentRepository.findByThreadId(
        t.threadId,
        0,
        1,
      );
      threadCommentCounts.set(t.threadId as string, countResult.totalCount);
    }

    return {
      space,
      thread,
      commentResult,
      allThreads,
      apps,
      members,
      userNameMap,
      threadCommentCounts,
    };
  });

  const {
    space: spaceEntity,
    thread: threadEntity,
    commentResult,
    allThreads,
    apps,
    members,
    userNameMap,
    threadCommentCounts,
  } = result;

  const threadAuthor =
    userNameMap.get(threadEntity.creatorId as string) ?? "不明";

  // Parse thread body into paragraphs and list items
  const bodyText = threadEntity.body ?? "";
  const bodyParagraphs =
    bodyText.length > 0 ? bodyText.split("\n").filter((l) => l.length > 0) : [];

  const threadData = {
    id: threadEntity.threadId as string,
    title: threadEntity.title as string,
    author: threadAuthor,
    createdAt: formatDateTime(threadEntity.createdAt),
    body: bodyParagraphs,
    listItems: [] as string[],
  };

  // Build sidebar threads
  const sidebarThreads: SidebarThread[] = allThreads.map((t) => ({
    id: t.threadId as string,
    title: t.title as string,
    commentCount: threadCommentCounts.get(t.threadId as string) ?? 0,
  }));

  // Build sidebar apps
  const sidebarApps: SidebarApp[] = apps.map((a) => ({
    id: a.appId as string,
    name: a.name as string,
    kind: "file" as const,
  }));

  // Build sidebar members
  const sidebarMembers: SidebarMember[] = members.map((m, i) => {
    const entityId = m.entity.id as string;
    const name =
      m.entity.type === "USER"
        ? (userNameMap.get(entityId) ?? m.entity.code)
        : m.entity.code;
    return {
      id: entityId,
      name,
      initial: name.charAt(0),
      colorIndex: COLOR_INDICES[i % COLOR_INDICES.length],
    };
  });

  // Build comments
  const comments: Comment[] = commentResult.comments.map((c, i) => {
    const authorName = userNameMap.get(c.creatorId as string) ?? "不明";
    return {
      id: c.commentId as string,
      author: authorName,
      initial: authorName.charAt(0),
      colorIndex: COLOR_INDICES[i % COLOR_INDICES.length],
      time: formatDateTime(c.createdAt),
      body: c.text ? c.text.split("\n").filter((l) => l.length > 0) : [],
    };
  });

  return {
    space: {
      id: spaceEntity.spaceId as string,
      name: spaceEntity.name as string,
    },
    thread: threadData,
    sidebarThreads,
    sidebarApps,
    sidebarMembers,
    comments,
  };
}
