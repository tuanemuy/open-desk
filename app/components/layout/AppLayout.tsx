import { Outlet } from "react-router";
import type { BookmarkListByCategoryOutput } from "@/core/application/bookmark/dto";
import { GlobalHeader } from "./GlobalHeader";

type AppLayoutProps = {
  displayName?: string;
  bookmarks: BookmarkListByCategoryOutput;
};

export function AppLayout({ displayName, bookmarks }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <GlobalHeader displayName={displayName} bookmarks={bookmarks} />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
