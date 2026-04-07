import { Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import type { BookmarkListByCategoryOutput } from "@/core/application/bookmark/dto";
import { BookmarkPanel } from "./BookmarkPanel";

const navItems = [
  { label: "ポータル", to: "/portal" },
  { label: "通知", to: "/notifications" },
  { label: "メッセージ", to: "/messages" },
] as const;

type GlobalHeaderProps = {
  displayName?: string;
  bookmarks: BookmarkListByCategoryOutput;
};

export function GlobalHeader({ displayName, bookmarks }: GlobalHeaderProps) {
  const location = useLocation();
  const initial = displayName?.charAt(0) ?? "?";
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showSettingsMenu) return;
    function handleOutside(e: MouseEvent) {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(e.target as Node)
      ) {
        setShowSettingsMenu(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [showSettingsMenu]);

  return (
    <header className="sticky top-0 z-100 flex h-[56px] items-center border-b border-neutral-200 bg-bg-header">
      <div className="mx-auto flex w-full max-w-[1400px] items-center gap-xl px-xl">
        <Link
          to="/portal"
          className="shrink-0 font-heading text-lg font-[var(--weight-normal)] tracking-tight text-neutral-800 no-underline select-none"
        >
          Open
          <strong className="font-[var(--weight-semibold)] text-primary">
            Desk
          </strong>
        </Link>

        <nav className="flex items-center gap-xs">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`rounded-md px-md py-sm text-sm font-[var(--weight-medium)] no-underline transition-[color,background-color] duration-[var(--transition-default)] ${
                  isActive
                    ? "bg-primary-lighter text-primary"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800"
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          <BookmarkPanel bookmarks={bookmarks} />
        </nav>

        <div className="ml-auto flex items-center gap-md">
          <div className="relative">
            <svg
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              role="img"
            >
              <title>検索</title>
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="全体検索"
              className="h-[34px] w-60 rounded-full border border-neutral-200 bg-neutral-100 pl-9 pr-md font-body text-sm text-neutral-800 outline-none transition-[border-color,background-color,box-shadow] duration-[var(--transition-default)] placeholder:text-neutral-400 hover:border-neutral-300 hover:bg-bg-card focus:border-primary focus:bg-bg-card focus:shadow-[0_0_0_3px_var(--color-primary-lighter)]"
            />
          </div>

          <div ref={settingsRef} className="relative">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-bg-card text-neutral-500 transition-[color,background-color,shadow] duration-[var(--transition-default)] hover:bg-neutral-100 hover:text-neutral-700 hover:shadow-sm"
              title="設定"
              aria-label="設定"
              onClick={() => setShowSettingsMenu((v) => !v)}
            >
              <Settings className="h-4 w-4" />
            </button>

            {showSettingsMenu && (
              <div className="absolute top-full right-0 mt-sm w-56 rounded-lg border border-neutral-200 bg-bg-card shadow-md">
                <Link
                  to="/admin/system/apps"
                  className="block px-md py-sm text-sm text-neutral-700 no-underline transition-colors duration-[var(--transition-default)] first:rounded-t-lg hover:bg-neutral-100"
                  onClick={() => setShowSettingsMenu(false)}
                >
                  OpenDeskシステム管理
                </Link>
                <Link
                  to="/admin"
                  className="block border-t border-neutral-100 px-md py-sm text-sm text-neutral-700 no-underline transition-colors duration-[var(--transition-default)] hover:bg-neutral-100"
                  onClick={() => setShowSettingsMenu(false)}
                >
                  cybozu.com共通管理
                </Link>
                <Link
                  to="/settings"
                  className="block border-t border-neutral-100 px-md py-sm text-sm text-neutral-700 no-underline transition-colors duration-[var(--transition-default)] last:rounded-b-lg hover:bg-neutral-100"
                  onClick={() => setShowSettingsMenu(false)}
                >
                  個人設定
                </Link>
              </div>
            )}
          </div>

          <div
            className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-primary-light text-sm font-[var(--weight-medium)] text-primary-darker"
            title={displayName ?? "User"}
          >
            {initial}
          </div>
        </div>
      </div>
    </header>
  );
}
