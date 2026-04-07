import {
  Bold,
  FileText,
  Italic,
  List,
  Paperclip,
  Plus,
  Smile,
  Type,
  Underline,
  Users,
} from "lucide-react";
import { Link } from "react-router";
import type { Route } from "./+types/index";

export { loader } from "./loader";

export function meta({ data }: Route.MetaArgs) {
  const title = data?.thread?.title ?? "スレッド";
  return [{ title: `${title} - OpenDesk` }];
}

const appIconMap = {
  file: FileText,
  customer: Users,
} as const;

const appIconColorMap = {
  file: "bg-info-light text-info",
  customer: "bg-success-light text-success",
} as const;

const avatarColorMap = {
  1: "bg-primary",
  2: "bg-accent",
  3: "bg-success",
  4: "bg-warning",
} as const;

export default function ThreadPage({ loaderData }: Route.ComponentProps) {
  const {
    space,
    thread,
    sidebarThreads,
    sidebarApps,
    sidebarMembers,
    comments,
  } = loaderData;

  return (
    <div className="mx-auto max-w-[1400px] px-xl">
      {/* Action Bar */}
      <div className="flex items-center gap-md border-b border-neutral-200 py-md">
        <span className="text-sm font-[var(--weight-semibold)] text-neutral-800">
          <Link
            to={`/spaces/${space.id}`}
            className="text-primary no-underline transition-colors duration-[var(--transition-default)] hover:text-primary-dark hover:underline"
          >
            {space.name}
          </Link>
        </span>
        <div className="ml-auto flex items-center gap-md">
          <Link
            to={`/spaces/${space.id}`}
            className="text-sm font-[var(--weight-medium)] text-neutral-600 no-underline transition-colors duration-[var(--transition-default)] hover:text-primary"
          >
            スレッドを追加
          </Link>
          <button
            type="button"
            className="border-none bg-transparent text-sm font-[var(--weight-medium)] text-neutral-600 transition-colors duration-[var(--transition-default)] hover:text-primary"
          >
            フォローを解除
          </button>
          <button
            type="button"
            className="border-none bg-transparent text-sm font-[var(--weight-medium)] text-neutral-600 transition-colors duration-[var(--transition-default)] hover:text-primary"
          >
            サイドパネルを非表示にする
          </button>
        </div>
      </div>

      {/* Thread Layout */}
      <div className="grid min-h-[calc(100vh-56px-50px)] grid-cols-[280px_1fr] gap-0">
        {/* Left Sidebar */}
        <aside className="overflow-y-auto border-r border-neutral-200 bg-bg-card">
          {/* Threads Section */}
          <div className="border-b border-neutral-200">
            <div className="flex items-center justify-between p-md text-sm font-[var(--weight-semibold)] text-neutral-800">
              スレッド
            </div>
            <ul className="list-none">
              {sidebarThreads.map((t) => {
                const isActive = t.id === thread.id;
                return (
                  <li
                    key={t.id}
                    className={`border-b border-neutral-100 last:border-b-0 ${
                      isActive
                        ? "border-l-[3px] border-l-primary bg-primary-lighter pl-[calc(var(--space-md)-3px)]"
                        : "transition-colors duration-[var(--transition-default)] hover:bg-neutral-50"
                    }`}
                  >
                    <Link
                      to={`/spaces/${space.id}/threads/${t.id}`}
                      className="block px-md py-sm no-underline"
                    >
                      <div
                        className={`mb-[2px] text-sm font-[var(--weight-medium)] ${
                          isActive ? "text-primary-dark" : "text-neutral-800"
                        }`}
                      >
                        {t.title}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {t.commentCount}件のコメント
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Apps Section */}
          <div className="border-b border-neutral-200">
            <div className="flex items-center justify-between p-md text-sm font-[var(--weight-semibold)] text-neutral-800">
              アプリ
            </div>
            <ul className="list-none">
              {sidebarApps.map((app) => {
                const IconComponent = appIconMap[app.kind];
                const colorClass = appIconColorMap[app.kind];
                return (
                  <li
                    key={app.id}
                    className="flex items-center gap-sm border-b border-neutral-100 px-md py-sm last:border-b-0"
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-sm text-xs ${colorClass}`}
                    >
                      <IconComponent className="h-3 w-3" />
                    </span>
                    <Link
                      to={`/apps/${app.id}`}
                      className="text-sm font-[var(--weight-medium)] text-neutral-700 no-underline transition-colors duration-[var(--transition-default)] hover:text-primary"
                    >
                      {app.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* People Section */}
          <div className="border-b border-neutral-200">
            <div className="flex items-center justify-between p-md text-sm font-[var(--weight-semibold)] text-neutral-800">
              ピープル
            </div>
            <div className="flex flex-wrap gap-sm px-md pb-md">
              {sidebarMembers.map((member) => (
                <Link
                  key={member.id}
                  to={`/people/${member.id}`}
                  title={member.name}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-[var(--weight-semibold)] text-on-primary no-underline transition-opacity duration-[var(--transition-default)] hover:opacity-80 ${avatarColorMap[member.colorIndex]}`}
                >
                  {member.initial}
                </Link>
              ))}
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-neutral-300 bg-transparent text-sm text-neutral-400 transition-[border-color,color,background-color] duration-[var(--transition-default)] hover:border-primary hover:bg-primary-lighter hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                aria-label="メンバーを追加"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Thread Area */}
        <main className="overflow-y-auto px-xl py-lg">
          {/* Thread Header */}
          <div className="mb-lg">
            <h3 className="mb-sm font-heading text-xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
              {thread.title}
            </h3>
            <div className="flex items-center gap-sm text-sm text-neutral-500">
              <span className="font-[var(--weight-medium)] text-neutral-700">
                {thread.author}
              </span>
              <span className="text-neutral-300">|</span>
              <span>{thread.createdAt}</span>
              <span className="text-neutral-300">|</span>
              <button
                type="button"
                className="border-none bg-transparent font-[var(--weight-medium)] text-primary transition-colors duration-[var(--transition-default)] hover:text-primary-dark hover:underline"
              >
                編集
              </button>
            </div>
          </div>

          {/* Thread Body */}
          <div className="mb-lg border-b border-neutral-200 pb-lg leading-relaxed text-neutral-700">
            <p className="mb-md">{thread.body[0]}</p>
            <p className="mb-md">
              <strong className="font-[var(--weight-semibold)] text-neutral-800">
                主なマイルストーン:
              </strong>
            </p>
            <ul className="my-sm mb-md ml-lg list-disc">
              {thread.listItems.map((item) => (
                <li key={item} className="mb-xs">
                  {item}
                </li>
              ))}
            </ul>
            <p>{thread.body[1]}</p>
          </div>

          {/* Comments */}
          <div className="mb-xl">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="flex gap-md border-b border-neutral-100 py-md last:border-b-0"
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-[var(--weight-semibold)] text-on-primary ${avatarColorMap[comment.colorIndex]}`}
                >
                  {comment.initial}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-xs flex items-center gap-sm">
                    <span className="text-sm font-[var(--weight-medium)] text-neutral-800">
                      {comment.author}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {comment.time}
                    </span>
                  </div>
                  <div className="mb-sm leading-normal text-neutral-700">
                    {comment.body.map((paragraph) => (
                      <p key={paragraph} className="mb-sm last:mb-0">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  <div className="flex items-center gap-md">
                    <button
                      type="button"
                      className="border-none bg-transparent text-xs font-[var(--weight-medium)] text-neutral-500 transition-colors duration-[var(--transition-default)] hover:text-primary"
                    >
                      いいね！
                    </button>
                    <button
                      type="button"
                      className="border-none bg-transparent text-xs font-[var(--weight-medium)] text-neutral-500 transition-colors duration-[var(--transition-default)] hover:text-primary"
                    >
                      返信
                    </button>
                    <button
                      type="button"
                      className="border-none bg-transparent text-xs font-[var(--weight-medium)] text-neutral-500 transition-colors duration-[var(--transition-default)] hover:text-primary"
                    >
                      全員に返信
                    </button>
                    <button
                      type="button"
                      className="border-none bg-transparent text-xs font-[var(--weight-medium)] text-neutral-500 transition-colors duration-[var(--transition-default)] hover:text-primary"
                    >
                      リンク
                    </button>
                    <button
                      type="button"
                      className="border-none bg-transparent text-xs font-[var(--weight-medium)] text-neutral-500 transition-colors duration-[var(--transition-default)] hover:text-error"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Comment Input Form */}
          <div
            className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card"
            tabIndex={-1}
          >
            <div className="group">
              <div className="p-md group-focus-within:hidden">
                <span className="text-neutral-400">投稿する</span>
              </div>
              <div className="hidden group-focus-within:block">
                <div className="flex flex-wrap items-center gap-[2px] border-b border-neutral-200 bg-neutral-50 px-md py-sm">
                  <ToolbarButton
                    title="ファイルを添付する"
                    aria-label="ファイルを添付する"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                  </ToolbarButton>
                  <ToolbarButton title="絵文字" aria-label="絵文字">
                    <Smile className="h-3.5 w-3.5" />
                  </ToolbarButton>
                  <ToolbarSeparator />
                  <ToolbarButton title="太字" aria-label="太字">
                    <Bold className="h-3.5 w-3.5" />
                  </ToolbarButton>
                  <ToolbarButton title="斜体" aria-label="斜体">
                    <Italic className="h-3.5 w-3.5" />
                  </ToolbarButton>
                  <ToolbarButton title="下線" aria-label="下線">
                    <Underline className="h-3.5 w-3.5" />
                  </ToolbarButton>
                  <ToolbarSeparator />
                  <ToolbarButton title="文字色" aria-label="文字色">
                    <span className="text-sm">A</span>
                  </ToolbarButton>
                  <ToolbarButton title="文字サイズ" aria-label="文字サイズ">
                    <Type className="h-3.5 w-3.5" />
                  </ToolbarButton>
                  <ToolbarSeparator />
                  <ToolbarButton title="リスト" aria-label="リスト">
                    <List className="h-3.5 w-3.5" />
                  </ToolbarButton>
                </div>
                <div
                  className="min-h-[100px] p-md font-body text-base leading-normal text-neutral-800 outline-none empty:before:text-neutral-400 empty:before:content-[attr(data-placeholder)]"
                  contentEditable
                  data-placeholder="投稿する"
                />
                <div className="flex items-center justify-end gap-sm border-t border-neutral-100 px-md py-sm">
                  <button
                    type="button"
                    className="inline-flex h-[34px] items-center rounded-md border border-neutral-300 bg-transparent px-md font-body text-sm font-[var(--weight-medium)] text-neutral-600 transition-[background-color,border-color] duration-[var(--transition-default)] hover:border-neutral-400 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    キャンセル
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-[34px] items-center rounded-md border-none bg-primary px-md font-body text-sm font-[var(--weight-medium)] text-on-primary transition-colors duration-[var(--transition-default)] hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    書き込む
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function ToolbarButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="flex h-[30px] w-[30px] items-center justify-center rounded-sm border-none bg-transparent text-sm text-neutral-600 transition-[background-color,color] duration-[var(--transition-default)] hover:bg-neutral-200 hover:text-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
      {...props}
    >
      {children}
    </button>
  );
}

function ToolbarSeparator() {
  return <span className="mx-xs h-5 w-px bg-neutral-200" />;
}
