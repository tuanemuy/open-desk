import {
  CheckSquare,
  ChevronDown,
  FileText,
  Link as LinkIcon,
  Plus,
  Star,
  Users,
} from "lucide-react";
import { Link } from "react-router";
import type { Route } from "./+types/index";

export { loader } from "./loader";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "スペース - OpenDesk" }];
}

const appIconMap = {
  file: FileText,
  customer: Users,
  task: CheckSquare,
} as const;

const appIconColorMap = {
  file: "bg-info-light text-info",
  customer: "bg-success-light text-success",
  task: "bg-warning-light text-warning",
} as const;

const avatarColorMap = {
  1: "bg-primary",
  2: "bg-accent",
  3: "bg-success",
  4: "bg-warning",
} as const;

export default function SpacePage({ loaderData }: Route.ComponentProps) {
  const { space, threads, apps, members, links } = loaderData;

  return (
    <div className="mx-auto max-w-[1400px] px-xl">
      {/* Space Header */}
      <div className="flex items-center gap-md border-b border-neutral-200 py-lg">
        <h2 className="font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
          <Link
            to={`/spaces/${space.id}`}
            className="text-inherit no-underline transition-colors duration-[var(--transition-default)] hover:text-primary"
          >
            {space.name}
          </Link>
        </h2>
        {space.isPublic && (
          <span className="inline-flex h-6 items-center rounded-sm bg-success-light px-sm text-xs font-[var(--weight-medium)] text-success">
            公開
          </span>
        )}
        <div className="ml-auto flex items-center gap-sm">
          <button
            type="button"
            title="お気に入りに追加"
            aria-label="お気に入りに追加"
            className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-md border border-neutral-300 bg-bg-card text-neutral-400 transition-[color,border-color] duration-[var(--transition-default)] hover:border-warning hover:text-warning focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Star className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="inline-flex h-[34px] items-center gap-xs rounded-md border border-neutral-300 bg-bg-card px-md font-body text-sm font-[var(--weight-medium)] text-neutral-700 transition-[background-color,border-color,color] duration-[var(--transition-default)] hover:border-neutral-400 hover:bg-neutral-50 hover:text-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            オプション
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-[1fr_340px] gap-xl py-lg pb-2xl">
        {/* Main Column */}
        <div className="min-w-0">
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card">
            <div className="flex items-center justify-between border-b border-neutral-200 px-lg py-md">
              <h3 className="font-heading text-lg font-[var(--weight-semibold)] text-neutral-800">
                お知らせ
              </h3>
              <Link
                to={`/spaces/${space.id}`}
                className="text-sm font-[var(--weight-medium)] text-primary no-underline transition-colors duration-[var(--transition-default)] hover:text-primary-dark hover:underline"
              >
                スペースの本文を編集
              </Link>
            </div>
            <div className="p-lg leading-relaxed text-neutral-700">
              <p className="mb-md">
                <strong className="font-[var(--weight-semibold)] text-neutral-800">
                  あなたのチームのコミュニケーションスペース
                </strong>
              </p>
              <p className="mb-md">
                ようこそ、製品開発チームのスペースへ。このスペースでは、チーム内のコミュニケーションやプロジェクトの進捗管理を行います。
              </p>
              <p className="mb-md">
                <strong className="font-[var(--weight-semibold)] text-neutral-800">
                  今週のトピック:
                </strong>
              </p>
              <ul className="my-sm mb-md ml-lg list-disc">
                <li className="mb-xs">
                  v2.5リリースに向けたフィーチャーフリーズは
                  <strong className="font-[var(--weight-semibold)] text-neutral-800">
                    4月11日（金）
                  </strong>
                  です
                </li>
                <li className="mb-xs">
                  デザインレビュー会議は毎週水曜 14:00 から実施します
                </li>
                <li className="mb-xs">
                  新メンバーの
                  <Link
                    to="/people/3"
                    className="text-primary no-underline transition-colors duration-[var(--transition-default)] hover:text-primary-dark hover:underline"
                  >
                    佐藤花子さん
                  </Link>
                  が参加しました。よろしくお願いします
                </li>
              </ul>
              <p>
                質問やアイデアがあれば、スレッドに投稿してください。アプリの「
                <Link
                  to={"/apps/1"}
                  className="text-primary no-underline transition-colors duration-[var(--transition-default)] hover:text-primary-dark hover:underline"
                >
                  ファイル管理
                </Link>
                」から関連資料を確認できます。
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-md">
          {/* Threads */}
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card">
            <div className="flex items-center justify-between border-b border-neutral-200 px-md py-md">
              <h4 className="font-heading text-sm font-[var(--weight-semibold)] text-neutral-800">
                スレッド
              </h4>
              <Link
                to={`/spaces/${space.id}`}
                className="text-sm font-[var(--weight-medium)] text-primary no-underline transition-colors duration-[var(--transition-default)] hover:text-primary-dark hover:underline"
              >
                スレッドを作成
              </Link>
            </div>
            <div className="px-md py-sm">
              <ul className="list-none">
                {threads.map((thread) => (
                  <li
                    key={thread.id}
                    className="border-b border-neutral-100 py-sm last:border-b-0"
                  >
                    <Link
                      to={`/spaces/${space.id}/threads/${thread.id}`}
                      className="block rounded-sm p-xs no-underline transition-colors duration-[var(--transition-default)] hover:bg-neutral-50"
                    >
                      <div className="mb-[2px] text-sm font-[var(--weight-medium)] text-primary">
                        {thread.title}
                      </div>
                      <div className="text-xs text-neutral-500">
                        最終更新: {thread.lastUpdated}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Apps */}
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card">
            <div className="flex items-center justify-between border-b border-neutral-200 px-md py-md">
              <h4 className="font-heading text-sm font-[var(--weight-semibold)] text-neutral-800">
                アプリ
              </h4>
              <button
                type="button"
                className="inline-flex items-center gap-xs border-none bg-transparent text-sm font-[var(--weight-medium)] text-primary transition-colors duration-[var(--transition-default)] hover:text-primary-dark hover:underline"
                aria-label="アプリを追加"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="px-md py-sm">
              <ul className="list-none">
                {apps.map((app) => {
                  const IconComponent = appIconMap[app.kind];
                  const colorClass = appIconColorMap[app.kind];
                  return (
                    <li
                      key={app.id}
                      className="flex items-center gap-sm border-b border-neutral-100 px-xs py-sm last:border-b-0"
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-xs ${colorClass}`}
                      >
                        <IconComponent className="h-3.5 w-3.5" />
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
          </div>

          {/* People */}
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card">
            <div className="flex items-center justify-between border-b border-neutral-200 px-md py-md">
              <h4 className="font-heading text-sm font-[var(--weight-semibold)] text-neutral-800">
                ピープル
              </h4>
              <button
                type="button"
                className="inline-flex items-center gap-xs border-none bg-transparent text-sm font-[var(--weight-medium)] text-primary transition-colors duration-[var(--transition-default)] hover:text-primary-dark hover:underline"
                aria-label="メンバーを追加"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="px-md py-sm">
              <div className="flex flex-wrap gap-md py-sm">
                {members.map((member) => (
                  <Link
                    key={member.id}
                    to={`/people/${member.id}`}
                    className="flex flex-col items-center gap-xs no-underline transition-opacity duration-[var(--transition-default)] hover:opacity-80"
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-[var(--weight-semibold)] text-on-primary ${avatarColorMap[member.colorIndex]}`}
                    >
                      {member.initial}
                    </div>
                    <span className="max-w-14 truncate text-center text-xs text-neutral-600">
                      {member.name}
                    </span>
                  </Link>
                ))}
                <div className="flex flex-col items-center gap-xs">
                  <button
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-neutral-300 bg-transparent text-lg text-neutral-400 transition-[border-color,color,background-color] duration-[var(--transition-default)] hover:border-primary hover:bg-primary-lighter hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    aria-label="メンバーを追加"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Related Links */}
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card">
            <div className="flex items-center justify-between border-b border-neutral-200 px-md py-md">
              <h4 className="font-heading text-sm font-[var(--weight-semibold)] text-neutral-800">
                関連リンク
              </h4>
              <button
                type="button"
                className="inline-flex items-center gap-xs border-none bg-transparent text-sm font-[var(--weight-medium)] text-primary transition-colors duration-[var(--transition-default)] hover:text-primary-dark hover:underline"
                aria-label="リンクを追加"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="px-md py-sm">
              <ul className="list-none">
                {links.map((link) => (
                  <li
                    key={link.id}
                    className="border-b border-neutral-100 px-xs py-sm last:border-b-0"
                  >
                    <a
                      href={link.url}
                      className="flex items-center gap-xs text-sm text-primary no-underline transition-colors duration-[var(--transition-default)] hover:text-primary-dark hover:underline"
                    >
                      <LinkIcon className="h-3 w-3 shrink-0 text-neutral-400" />
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
