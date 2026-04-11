import { Bookmark, CheckCircle, LayoutGrid, List } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/index";
import type { NotificationItem } from "./loader";

export { loader } from "./loader";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "通知 - OpenDesk" }];
}

type FilterValue = "mention" | "readLater" | "all";
type ReadStatus = "unread" | "read";
type ViewMode = "detail" | "list";

export default function NotificationsPage({
  loaderData,
}: Route.ComponentProps) {
  const { notifications } = loaderData;
  const [filter, setFilter] = useState<FilterValue>("mention");
  const [readStatus, setReadStatus] = useState<ReadStatus>("unread");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [showButtons, setShowButtons] = useState(false);
  const [selectedNotificationId, setSelectedNotificationId] = useState<
    string | null
  >(notifications[0]?.id ?? null);

  const selectedNotification =
    viewMode === "detail"
      ? (notifications.find((n) => n.id === selectedNotificationId) ?? null)
      : null;

  return (
    <div className="mx-auto max-w-[1400px] px-xl">
      {/* Page Title */}
      <div className="py-lg pb-md">
        <h2 className="font-heading text-xl font-[var(--weight-semibold)] tracking-tight text-neutral-900">
          通知
        </h2>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-md border-b border-neutral-200 py-md">
        <select
          className="h-[34px] cursor-pointer appearance-none rounded-md border border-neutral-200 bg-bg-card py-0 pr-9 pl-md font-body text-sm font-[var(--weight-medium)] text-neutral-700 outline-none transition-[border-color] duration-[var(--transition-default)] bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%2714%27%20height=%2714%27%20viewBox=%270%200%2024%2024%27%20fill=%27none%27%20stroke=%27%23777%27%20stroke-width=%272%27%20stroke-linecap=%27round%27%20stroke-linejoin=%27round%27%3E%3Cpath%20d=%27m6%209%206%206%206-6%27/%3E%3C/svg%3E')] bg-[position:right_10px_center] bg-no-repeat hover:border-neutral-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-label="表示する通知を切り替える"
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterValue)}
        >
          <option value="mention">自分宛</option>
          <option value="readLater">あとで読む</option>
          <option value="all">すべて</option>
          <option disabled>---</option>
          <option value="createFilter">絞り込みを作成する</option>
        </select>
        <div className="flex overflow-hidden rounded-md border border-neutral-200">
          <button
            type="button"
            className={`h-8 border-none px-md font-body text-sm font-[var(--weight-medium)] transition-[color,background-color] duration-[var(--transition-default)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary ${
              readStatus === "unread"
                ? "bg-primary-lighter text-primary-dark"
                : "bg-bg-card text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700"
            }`}
            onClick={() => setReadStatus("unread")}
          >
            未読
          </button>
          <button
            type="button"
            className={`h-8 border-l border-neutral-200 px-md font-body text-sm font-[var(--weight-medium)] transition-[color,background-color] duration-[var(--transition-default)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary ${
              readStatus === "read"
                ? "bg-primary-lighter text-primary-dark"
                : "bg-bg-card text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700"
            }`}
            onClick={() => setReadStatus("read")}
          >
            既読
          </button>
        </div>
      </div>

      {/* Options Bar */}
      <div className="flex items-center justify-between border-b border-neutral-200 py-sm">
        <div className="flex items-center gap-sm">
          <label className="flex cursor-pointer items-center gap-sm rounded-sm px-sm py-xs text-sm text-neutral-600 transition-colors duration-[var(--transition-default)] select-none hover:text-neutral-800">
            <input
              type="checkbox"
              className="h-4 w-4 cursor-pointer accent-primary"
              checked={showButtons}
              onChange={(e) => setShowButtons(e.target.checked)}
            />
            通知にボタンを常に表示する
          </label>
        </div>
        <div className="flex overflow-hidden rounded-md border border-neutral-200">
          <button
            type="button"
            className={`flex h-[30px] w-9 items-center justify-center border-none transition-[color,background-color] duration-[var(--transition-default)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary ${
              viewMode === "detail"
                ? "bg-primary-lighter text-primary-dark"
                : "bg-bg-card text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600"
            }`}
            title="詳細表示"
            aria-label="詳細表示"
            onClick={() => setViewMode("detail")}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={`flex h-[30px] w-9 items-center justify-center border-l border-neutral-200 transition-[color,background-color] duration-[var(--transition-default)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary ${
              viewMode === "list"
                ? "bg-primary-lighter text-primary-dark"
                : "bg-bg-card text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600"
            }`}
            title="一覧表示"
            aria-label="一覧表示"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Notification Content */}
      {notifications.length === 0 ? (
        <div className="py-2xl text-center text-sm text-neutral-500">
          通知はありません。
        </div>
      ) : viewMode === "detail" ? (
        <div className="flex gap-0 border border-t-0 border-neutral-200 rounded-b-lg bg-bg-card">
          {/* Left pane: notification list */}
          <div
            className="w-[360px] shrink-0 overflow-y-auto border-r border-neutral-200"
            role="menu"
            aria-label="通知リスト"
          >
            <ul className="list-none">
              {notifications.map((notif) => (
                <li key={notif.id}>
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={selectedNotificationId === notif.id}
                    className={`flex w-full cursor-pointer items-start gap-sm border-b border-neutral-100 px-md py-md text-left transition-colors duration-[var(--transition-default)] last:border-b-0 ${
                      selectedNotificationId === notif.id
                        ? "bg-primary-lighter"
                        : notif.unread
                          ? "bg-primary-lighter/50 hover:bg-neutral-50"
                          : "hover:bg-neutral-50"
                    }`}
                    onClick={() => setSelectedNotificationId(notif.id)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex items-center gap-sm">
                        {notif.unread && (
                          <span className="inline-block h-[7px] w-[7px] shrink-0 rounded-full bg-primary" />
                        )}
                        <span className="text-xs font-[var(--weight-medium)] text-neutral-500">
                          {notif.appName}
                        </span>
                      </div>
                      <div className="mb-xs truncate text-sm font-[var(--weight-medium)] leading-tight text-neutral-800">
                        {notif.title}
                      </div>
                      <div className="flex items-center gap-sm text-xs text-neutral-400">
                        <span>{notif.timeAgo}</span>
                        <span className="font-[var(--weight-medium)] text-neutral-500">
                          {notif.userName}
                        </span>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Right pane: detail iframe */}
          <div className="min-w-0 flex-1">
            {selectedNotification ? (
              <div className="flex h-full flex-col">
                {/* Breadcrumb */}
                <nav className="border-b border-neutral-200 px-lg py-sm">
                  <ol className="flex list-none items-center gap-xs text-sm text-neutral-500">
                    <li>
                      <Link
                        to="/notifications"
                        className="text-primary no-underline transition-colors duration-[var(--transition-default)] hover:text-primary-dark hover:underline"
                      >
                        通知
                      </Link>
                    </li>
                    <li className="text-xs text-neutral-400" aria-hidden="true">
                      &gt;
                    </li>
                    <li>
                      <span className="text-neutral-600">
                        {selectedNotification.appName}
                      </span>
                    </li>
                    <li className="text-xs text-neutral-400" aria-hidden="true">
                      &gt;
                    </li>
                    <li>
                      <span className="text-neutral-800">
                        {selectedNotification.title}
                      </span>
                    </li>
                  </ol>
                </nav>
                {/* iframe */}
                <div className="flex-1">
                  <iframe
                    src={selectedNotification.sourceUrl}
                    title={selectedNotification.title}
                    className="h-full min-h-[500px] w-full border-none"
                  />
                </div>
              </div>
            ) : (
              <div className="flex h-[500px] items-center justify-center text-sm text-neutral-500">
                通知を選択してください
              </div>
            )}
          </div>
        </div>
      ) : (
        <ul className="list-none rounded-b-lg border border-t-0 border-neutral-200 bg-bg-card">
          {notifications.map((notif) => (
            <NotificationListItem
              key={notif.id}
              notification={notif}
              showButtons={showButtons}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function NotificationListItem({
  notification,
  showButtons,
}: {
  notification: NotificationItem;
  showButtons: boolean;
}) {
  return (
    <li
      className={`flex items-start gap-md border-b border-neutral-100 px-lg py-md transition-colors duration-[var(--transition-default)] last:border-b-0 last:rounded-b-lg ${
        notification.unread ? "bg-primary-lighter" : "hover:bg-neutral-50"
      }`}
    >
      <div
        className={`flex shrink-0 items-center gap-xs pt-0.5 ${showButtons ? "visible" : "invisible group-hover:visible"}`}
      >
        <button
          className="flex h-7 w-7 items-center justify-center rounded-sm border-none bg-transparent text-neutral-400 transition-[color,background-color] duration-[var(--transition-default)] hover:bg-primary-lighter hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
          type="button"
          title="あとで読む"
          aria-label="あとで読む"
        >
          <Bookmark className="h-4 w-4" />
        </button>
        <button
          className="flex h-7 w-7 items-center justify-center rounded-sm border-none bg-transparent text-neutral-400 transition-[color,background-color] duration-[var(--transition-default)] hover:bg-primary-lighter hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
          type="button"
          title="既読にする"
          aria-label="既読にする"
        >
          <CheckCircle className="h-4 w-4" />
        </button>
      </div>
      <div className="min-w-0 flex-1">
        <Link to="#" className="block text-inherit no-underline">
          <div className="mb-0.5 flex items-center gap-sm">
            {notification.unread && (
              <span className="inline-block h-[7px] w-[7px] shrink-0 rounded-full bg-primary" />
            )}
            <span className="text-xs font-[var(--weight-medium)] text-neutral-500">
              {notification.appName}
            </span>
          </div>
          <div className="mb-xs text-sm font-[var(--weight-medium)] leading-tight text-neutral-800 hover:underline">
            {notification.title}
          </div>
          <div className="mb-xs text-sm leading-normal text-neutral-600">
            {notification.description}
          </div>
          <div className="flex items-center gap-sm text-xs text-neutral-400">
            <span>{notification.timeAgo}</span>
            <span className="font-[var(--weight-medium)] text-neutral-500">
              {notification.userName}
            </span>
          </div>
        </Link>
      </div>
    </li>
  );
}
