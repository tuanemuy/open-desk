import { data } from "react-router";
import { container } from "@/core/application/container/server.instance";
import { getProfile } from "@/core/application/people/getProfile";
import { listPosts } from "@/core/application/people/listPosts";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

type Post = {
  id: string;
  authorName: string;
  authorInitial: string;
  colorIndex: 1 | 2 | 3;
  time: string;
  body: string;
};

type UserProfile = {
  id: string;
  name: string;
  initial: string;
  email: string;
  isSelf: boolean;
};

export type UserLoaderData = {
  user: UserProfile;
  posts: Post[];
};

/**
 * Format a Date to a Japanese locale display string.
 */
function formatDateTime(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}年${m}月${d}日 ${hh}:${mm}`;
}

export async function loader({
  request,
  params,
}: Route.LoaderArgs): Promise<UserLoaderData> {
  const auth = await requireAuth(request, container);
  const userId = params.userId;

  // Fetch profile
  const profile = await handleUseCase(() =>
    getProfile({
      container,
      headers: request.headers,
      input: { targetUserId: userId },
    }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  const user: UserProfile = {
    id: profile.userId,
    name: profile.displayName,
    initial: profile.displayName.charAt(0),
    email: profile.email,
    isSelf: profile.userId === (auth.userId as string),
  };

  // Fetch posts
  const postsResult = await handleUseCase(() =>
    listPosts({
      container,
      headers: request.headers,
      input: { targetUserId: userId, offset: 0, limit: 20 },
    }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  const COLOR_INDICES: readonly (1 | 2 | 3)[] = [1, 2, 3];

  const posts: Post[] = postsResult.posts.map((p, i) => ({
    id: p.postId,
    authorName: profile.displayName,
    authorInitial: profile.displayName.charAt(0),
    colorIndex: COLOR_INDICES[i % COLOR_INDICES.length] as 1 | 2 | 3,
    time: formatDateTime(p.createdAt),
    body: p.content,
  }));

  return { user, posts };
}
