import { ChevronDown, LayoutGrid, Plus, Star, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import { toast } from "sonner";
import type { BookmarkListByCategoryOutput } from "@/core/application/bookmark/dto";
import type { BookmarkId } from "@/core/domain/bookmark/valueObject";
import { useCompositeAction } from "@/lib/compositeAction";
import type { handlers } from "@/routes/api/bookmarks-impl.server";

type TabId = "app" | "search" | "other";

const tabs: { id: TabId; label: string }[] = [
  { id: "app", label: "アプリ" },
  { id: "search", label: "検索結果" },
  { id: "other", label: "その他" },
];

type BookmarkPanelProps = {
  bookmarks: BookmarkListByCategoryOutput;
};

export function BookmarkPanel({ bookmarks }: BookmarkPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("app");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedApps, setExpandedApps] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();

  const fetcher = useCompositeAction<typeof handlers>();

  fetcher.register("create", {
    onSuccess: () => {
      setShowAddDialog(false);
      toast.success("ブックマークに保存されました。");
    },
    onHandlerError: ({ error }) => {
      toast.error(error?.[""]?.[0] ?? "ブックマークの作成に失敗しました。");
    },
  });

  fetcher.register("delete", {
    onSuccess: () => {
      setDeletingId(null);
      toast.success("ブックマークを削除しました。");
    },
    onHandlerError: ({ error }) => {
      toast.error(error?.[""]?.[0] ?? "ブックマークの削除に失敗しました。");
    },
  });

  // Initialize all app groups as expanded
  useEffect(() => {
    const appIds = new Set(bookmarks.app.map((b) => b.appId as string));
    setExpandedApps(appIds);
  }, [bookmarks.app]);

  // Close panel on outside click
  useEffect(() => {
    if (!isOpen) return;

    function handleClick(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setShowAddDialog(false);
        setDeletingId(null);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  // Close panel on Escape
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
        setShowAddDialog(false);
        setDeletingId(null);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const togglePanel = useCallback(() => {
    setIsOpen((prev) => {
      if (prev) {
        setShowAddDialog(false);
        setDeletingId(null);
      }
      return !prev;
    });
  }, []);

  const toggleAccordion = useCallback((appId: string) => {
    setExpandedApps((prev) => {
      const next = new Set(prev);
      if (next.has(appId)) {
        next.delete(appId);
      } else {
        next.add(appId);
      }
      return next;
    });
  }, []);

  // Group app bookmarks by appId
  const appGroups = groupByAppId(bookmarks.app);

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        className={`inline-flex items-center gap-xs rounded-md px-md py-sm font-body text-sm font-[var(--weight-medium)] no-underline transition-[color,background-color] duration-[var(--transition-default)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary ${
          isOpen
            ? "bg-primary-lighter text-primary"
            : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800"
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-controls="bookmark-panel"
        onClick={togglePanel}
      >
        <Star className="h-[15px] w-[15px] shrink-0" />
        ブックマーク
      </button>

      {/* Backdrop */}
      {isOpen && <div className="fixed inset-0 z-150" aria-hidden="true" />}

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          id="bookmark-panel"
          role="dialog"
          aria-label="ブックマーク"
          className="absolute top-[calc(100%+var(--space-sm))] left-0 z-200 w-[360px] overflow-hidden rounded-lg border border-neutral-200 bg-bg-card shadow-lg"
        >
          {/* Panel Header: Add bookmark */}
          <div className="border-b border-neutral-200 p-md">
            <button
              type="button"
              className="flex w-full items-center gap-sm rounded-md border border-primary-light bg-primary-lighter px-md py-sm font-body text-sm font-[var(--weight-medium)] text-primary transition-[background-color,border-color] duration-[var(--transition-default)] hover:border-primary hover:bg-primary-light focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="h-3.5 w-3.5 shrink-0" />
              このページをブックマークする
            </button>
          </div>

          {/* Tab Bar */}
          <div className="flex border-b border-neutral-200" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`tab-btn-${tab.id}`}
                aria-selected={activeTab === tab.id}
                aria-controls={`tab-${tab.id}`}
                className={`flex-1 cursor-pointer border-b-2 border-transparent bg-transparent px-md py-sm text-center font-body text-sm font-[var(--weight-medium)] transition-[color,border-color] duration-[var(--transition-default)] hover:text-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary ${
                  activeTab === tab.id
                    ? "border-b-primary text-primary"
                    : "text-neutral-500"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Panels */}
          <div className="max-h-[400px] overflow-y-auto [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-300 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1">
            {activeTab === "app" && (
              <div id="tab-app" role="tabpanel" aria-labelledby="tab-btn-app">
                {appGroups.length === 0 ? (
                  <EmptyState />
                ) : (
                  appGroups.map((group) => (
                    <AppAccordion
                      key={group.appId}
                      appId={group.appId}
                      appName={group.appName}
                      bookmarks={group.bookmarks}
                      isExpanded={expandedApps.has(group.appId)}
                      onToggle={() => toggleAccordion(group.appId)}
                      deletingId={deletingId}
                      onDeleteClick={setDeletingId}
                      onDeleteCancel={() => setDeletingId(null)}
                      fetcher={fetcher}
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === "search" && (
              <div
                id="tab-search"
                role="tabpanel"
                aria-labelledby="tab-btn-search"
              >
                {bookmarks.search.length === 0 ? (
                  <EmptyState />
                ) : (
                  bookmarks.search.map((bookmark) => (
                    <BookmarkItem
                      key={bookmark.bookmarkId}
                      bookmarkId={bookmark.bookmarkId}
                      name={bookmark.name}
                      url={bookmark.url}
                      deletingId={deletingId}
                      onDeleteClick={setDeletingId}
                      onDeleteCancel={() => setDeletingId(null)}
                      fetcher={fetcher}
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === "other" && (
              <div
                id="tab-other"
                role="tabpanel"
                aria-labelledby="tab-btn-other"
              >
                {bookmarks.other.length === 0 ? (
                  <EmptyState />
                ) : (
                  bookmarks.other.map((bookmark) => (
                    <BookmarkItem
                      key={bookmark.bookmarkId}
                      bookmarkId={bookmark.bookmarkId}
                      name={bookmark.name}
                      url={bookmark.url}
                      deletingId={deletingId}
                      onDeleteClick={setDeletingId}
                      onDeleteCancel={() => setDeletingId(null)}
                      fetcher={fetcher}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Bookmark Dialog */}
      {showAddDialog && (
        <AddBookmarkDialog
          currentUrl={location.pathname + location.search}
          currentTitle={typeof document !== "undefined" ? document.title : ""}
          onClose={() => setShowAddDialog(false)}
          fetcher={fetcher}
        />
      )}
    </div>
  );
}

/* ============================================================
 * Sub-components
 * ============================================================ */

function EmptyState() {
  return (
    <div className="px-md py-lg text-center text-sm text-neutral-500">
      ブックマークはありません。
    </div>
  );
}

type AppGroup = {
  appId: string;
  appName: string;
  bookmarks: { bookmarkId: BookmarkId; name: string; url: string }[];
};

function groupByAppId(items: BookmarkListByCategoryOutput["app"]): AppGroup[] {
  const map = new Map<string, AppGroup>();
  for (const item of items) {
    const id = item.appId as string;
    const existing = map.get(id);
    if (existing) {
      existing.bookmarks.push({
        bookmarkId: item.bookmarkId,
        name: item.name,
        url: item.url,
      });
    } else {
      map.set(id, {
        appId: id,
        appName: extractAppName(id),
        bookmarks: [
          {
            bookmarkId: item.bookmarkId,
            name: item.name,
            url: item.url,
          },
        ],
      });
    }
  }
  return Array.from(map.values());
}

function extractAppName(appId: string): string {
  return appId;
}

type FetcherType = ReturnType<typeof useCompositeAction<typeof handlers>>;

type AppAccordionProps = {
  appId: string;
  appName: string;
  bookmarks: { bookmarkId: BookmarkId; name: string; url: string }[];
  isExpanded: boolean;
  onToggle: () => void;
  deletingId: string | null;
  onDeleteClick: (id: string) => void;
  onDeleteCancel: () => void;
  fetcher: FetcherType;
};

function AppAccordion({
  appId,
  appName,
  bookmarks,
  isExpanded,
  onToggle,
  deletingId,
  onDeleteClick,
  onDeleteCancel,
  fetcher,
}: AppAccordionProps) {
  return (
    <div className="border-b border-neutral-200 last:border-b-0">
      <button
        type="button"
        className="flex w-full items-center gap-sm bg-bg-section px-md py-sm text-left font-body text-sm font-[var(--weight-semibold)] text-neutral-700 transition-[background-color] duration-[var(--transition-default)] hover:bg-neutral-150 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
        aria-expanded={isExpanded}
        aria-controls={`accordion-body-${appId}`}
        onClick={onToggle}
      >
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-neutral-400 transition-transform duration-[var(--transition-default)] ${
            isExpanded ? "rotate-180" : "rotate-0"
          }`}
        />
        <LayoutGrid className="h-4 w-4 shrink-0 text-neutral-500" />
        <span className="min-w-0 flex-1 truncate">{appName}</span>
        <span className="shrink-0 text-xs font-[var(--weight-normal)] text-neutral-400">
          {bookmarks.length}
        </span>
      </button>
      {isExpanded && (
        <div id={`accordion-body-${appId}`} aria-hidden={!isExpanded}>
          {bookmarks.map((bookmark) => (
            <BookmarkItem
              key={bookmark.bookmarkId}
              bookmarkId={bookmark.bookmarkId}
              name={bookmark.name}
              url={bookmark.url}
              deletingId={deletingId}
              onDeleteClick={onDeleteClick}
              onDeleteCancel={onDeleteCancel}
              fetcher={fetcher}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type BookmarkItemProps = {
  bookmarkId: BookmarkId;
  name: string;
  url: string;
  deletingId: string | null;
  onDeleteClick: (id: string) => void;
  onDeleteCancel: () => void;
  fetcher: FetcherType;
};

function BookmarkItem({
  bookmarkId,
  name,
  url,
  deletingId,
  onDeleteClick,
  onDeleteCancel,
  fetcher,
}: BookmarkItemProps) {
  const isDeleting = deletingId === (bookmarkId as string);
  const idStr = bookmarkId as string;

  const handleDelete = () => {
    fetcher.submit(
      { intent: "delete", bookmarkId: idStr },
      { method: "post", action: "/api/bookmarks" },
    );
  };

  return (
    <div
      className={
        "group relative flex items-center gap-sm px-md py-sm pl-xl transition-[background-color] duration-[var(--transition-default)] hover:bg-neutral-100 [&+&]:border-t [&+&]:border-neutral-200"
      }
    >
      <a
        href={url}
        className="min-w-0 flex-1 truncate text-sm text-primary no-underline transition-colors duration-[var(--transition-default)] hover:text-primary-dark hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {name}
      </a>

      {isDeleting ? (
        <div className="relative">
          <button
            type="button"
            className="flex h-[22px] w-[22px] items-center justify-center rounded-sm border-none bg-error-light text-error"
            aria-label="削除する"
            title="削除する"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <div
            role="alertdialog"
            aria-label="削除の確認"
            className="absolute top-[calc(100%+var(--space-xs))] right-0 z-300 w-[220px] rounded-md border border-neutral-200 bg-bg-card p-md shadow-lg before:absolute before:top-[-5px] before:right-sm before:h-[10px] before:w-[10px] before:rotate-45 before:border-t before:border-l before:border-neutral-200 before:bg-bg-card before:content-['']"
          >
            <p className="mb-md text-sm leading-normal text-neutral-700">
              削除します。よろしいですか？
            </p>
            <div className="flex justify-end gap-sm">
              <button
                type="button"
                className="inline-flex h-[30px] items-center rounded-md border border-neutral-200 bg-bg-card px-md font-body text-xs font-[var(--weight-medium)] text-neutral-600 transition-[background-color,border-color] duration-[var(--transition-default)] hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                onClick={onDeleteCancel}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="inline-flex h-[30px] items-center rounded-md border border-error bg-error px-md font-body text-xs font-[var(--weight-medium)] text-on-primary transition-[background-color,opacity] duration-[var(--transition-default)] hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error"
                onClick={handleDelete}
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-sm border-none bg-transparent text-neutral-400 opacity-0 transition-[opacity,color,background-color] duration-[var(--transition-default)] group-hover:opacity-100 hover:bg-error-light hover:text-error focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-label="削除する"
          title="削除する"
          onClick={() => onDeleteClick(idStr)}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

type AddBookmarkDialogProps = {
  currentUrl: string;
  currentTitle: string;
  onClose: () => void;
  fetcher: FetcherType;
};

function AddBookmarkDialog({
  currentUrl,
  currentTitle,
  onClose,
  fetcher,
}: AddBookmarkDialogProps) {
  const [name, setName] = useState(currentTitle);
  const [url, setUrl] = useState(currentUrl);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetcher.submit(
      { intent: "create", name, url },
      { method: "post", action: "/api/bookmarks" },
    );
  };

  return (
    <div className="fixed inset-0 z-400 flex items-center justify-center">
      {/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop overlay for dismissing modal */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: Escape key handled by parent dialog */}
      <div className="absolute inset-0 bg-neutral-900/20" onClick={onClose} />
      <div
        role="dialog"
        aria-label="ページのブックマーク"
        aria-modal="true"
        className="relative z-10 w-[400px] rounded-xl border border-neutral-200 bg-bg-card p-lg shadow-lg"
      >
        <h3 className="mb-lg font-heading text-lg font-[var(--weight-semibold)] text-neutral-900">
          ページのブックマーク
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-md">
            <label
              htmlFor="bookmark-name"
              className="mb-xs block text-sm font-[var(--weight-medium)] text-neutral-600"
            >
              名前
            </label>
            <input
              id="bookmark-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-[34px] w-full rounded-sm border border-neutral-300 bg-bg-card px-md font-body text-sm text-neutral-800 outline-none transition-[border-color,box-shadow] duration-[var(--transition-default)] placeholder:text-neutral-400 focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-lighter)]"
              required
            />
          </div>
          <div className="mb-lg">
            <label
              htmlFor="bookmark-url"
              className="mb-xs block text-sm font-[var(--weight-medium)] text-neutral-600"
            >
              URL
            </label>
            <input
              id="bookmark-url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-[34px] w-full rounded-sm border border-neutral-300 bg-bg-card px-md font-body text-sm text-neutral-800 outline-none transition-[border-color,box-shadow] duration-[var(--transition-default)] placeholder:text-neutral-400 focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-lighter)]"
              required
            />
          </div>
          <div className="flex justify-end gap-sm">
            <button
              type="button"
              className="inline-flex h-[34px] items-center rounded-md border border-neutral-200 bg-bg-card px-md font-body text-sm font-[var(--weight-medium)] text-neutral-700 transition-[border-color,background-color] duration-[var(--transition-default)] hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              onClick={onClose}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="inline-flex h-[34px] items-center rounded-md border border-primary bg-primary px-md font-body text-sm font-[var(--weight-medium)] text-on-primary transition-[background-color] duration-[var(--transition-default)] hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              OK
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
