import { Outlet } from "react-router";
import { GlobalHeader } from "@/components/layout/GlobalHeader";
import type { BookmarkListByCategoryOutput } from "@/core/application/bookmark/dto";
import { listBookmarksByCategory } from "@/core/application/bookmark/listBookmarksByCategory";
import { container } from "@/core/application/container/server.instance";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/layout";

const EMPTY_BOOKMARKS: BookmarkListByCategoryOutput = {
  app: [],
  search: [],
  other: [],
};

export async function loader({ request }: Route.LoaderArgs) {
  const auth = await requireAuth(request, container);

  const bookmarks = await handleUseCase(() =>
    listBookmarksByCategory({
      container,
      headers: request.headers,
      input: { userId: auth.userId },
    }),
  ).match(
    (data) => data,
    () => EMPTY_BOOKMARKS,
  );

  return {
    displayName: auth.displayName,
    bookmarks,
  };
}

export default function AuthenticatedLayout({
  loaderData,
}: Route.ComponentProps) {
  const { displayName, bookmarks } = loaderData;

  return (
    <div className="flex min-h-screen flex-col">
      <GlobalHeader displayName={displayName} bookmarks={bookmarks} />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
