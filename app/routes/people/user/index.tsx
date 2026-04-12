import {
  AlignCenter,
  AlignLeft,
  AtSign,
  Bold,
  Highlighter,
  Italic,
  Link as LinkIcon,
  List,
  Paperclip,
  Redo2,
  RemoveFormatting,
  Smile,
  Type,
  Underline,
  Undo2,
} from "lucide-react";
import { Link } from "react-router";
import type { Route } from "./+types/index";

export { loader } from "./loader.server";

export function meta({ data }: Route.MetaArgs) {
  const name = data?.user?.name ?? "ユーザー";
  return [{ title: `ピープル - ${name} - OpenDesk` }];
}

const postAvatarColorMap = {
  1: "bg-primary",
  2: "bg-accent",
  3: "bg-success",
} as const;

export default function UserProfilePage({ loaderData }: Route.ComponentProps) {
  const { user, posts } = loaderData;

  return (
    <>
      {/* Cover Image */}
      <div
        className="h-[200px] w-full border-b border-neutral-200"
        style={{
          background:
            "linear-gradient(135deg, var(--color-neutral-200) 0%, var(--color-neutral-150) 50%, var(--color-neutral-200) 100%)",
        }}
      />

      {/* Profile Header */}
      <div className="border-b border-neutral-200 bg-bg-card">
        <div className="relative mx-auto flex max-w-[1400px] items-end gap-lg px-xl pb-lg">
          <div className="-mt-8 flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-bg-card bg-primary text-2xl font-[var(--weight-semibold)] text-on-primary">
            {user.initial}
          </div>
          <div className="flex-1 pt-md">
            <h2 className="mb-xs font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
              {user.name}
            </h2>
            <p className="mb-sm text-sm text-neutral-500">{user.email}</p>
            <div className="flex items-center gap-md">
              <Link
                to={`/people/${user.id}`}
                className="text-sm font-[var(--weight-medium)] text-primary no-underline transition-colors duration-[var(--transition-default)] hover:text-primary-dark hover:underline"
              >
                プロフィール詳細
              </Link>
              {user.isSelf && (
                <>
                  <span className="h-3.5 w-px bg-neutral-300" />
                  <button
                    type="button"
                    className="border-none bg-transparent text-sm font-[var(--weight-medium)] text-primary transition-colors duration-[var(--transition-default)] hover:text-primary-dark hover:underline"
                  >
                    カバー画像を設定する
                  </button>
                  <span className="h-3.5 w-px bg-neutral-300" />
                  <button
                    type="button"
                    className="border-none bg-transparent text-sm font-[var(--weight-medium)] text-primary transition-colors duration-[var(--transition-default)] hover:text-primary-dark hover:underline"
                  >
                    プロフィールを編集する
                  </button>
                </>
              )}
              {!user.isSelf && (
                <>
                  <span className="h-3.5 w-px bg-neutral-300" />
                  <button
                    type="button"
                    className="border-none bg-transparent text-sm font-[var(--weight-medium)] text-primary transition-colors duration-[var(--transition-default)] hover:text-primary-dark hover:underline"
                  >
                    フォロー
                  </button>
                  <span className="h-3.5 w-px bg-neutral-300" />
                  <Link
                    to={`/messages/${user.id}`}
                    className="text-sm font-[var(--weight-medium)] text-primary no-underline transition-colors duration-[var(--transition-default)] hover:text-primary-dark hover:underline"
                  >
                    個人メッセージ
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="mx-auto max-w-[720px] px-xl py-lg pb-2xl">
        {/* Post Form */}
        <div
          className="mb-lg overflow-hidden rounded-lg border border-neutral-200 bg-bg-card"
          tabIndex={-1}
        >
          <div className="group">
            <div className="cursor-text p-md px-lg transition-colors duration-[var(--transition-default)] hover:bg-neutral-50 group-focus-within:hidden">
              <span className="text-neutral-400">投稿する</span>
            </div>
            <div className="hidden group-focus-within:block">
              <div className="flex flex-wrap items-center gap-[2px] border-b border-neutral-200 bg-neutral-50 px-md py-sm">
                <ToolbarButton title="宛先指定" aria-label="宛先指定">
                  <AtSign className="h-3.5 w-3.5" />
                </ToolbarButton>
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
                <ToolbarButton title="背景色" aria-label="背景色">
                  <Highlighter className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton title="文字サイズ" aria-label="文字サイズ">
                  <Type className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton title="リンク" aria-label="リンク">
                  <LinkIcon className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarSeparator />
                <ToolbarButton title="元に戻す" aria-label="元に戻す">
                  <Undo2 className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton title="やり直す" aria-label="やり直す">
                  <Redo2 className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarSeparator />
                <ToolbarButton
                  title="箇条書きリスト"
                  aria-label="箇条書きリスト"
                >
                  <List className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton title="左揃え" aria-label="左揃え">
                  <AlignLeft className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton title="中央揃え" aria-label="中央揃え">
                  <AlignCenter className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton
                  title="フォーマット削除"
                  aria-label="フォーマット削除"
                >
                  <RemoveFormatting className="h-3.5 w-3.5" />
                </ToolbarButton>
              </div>
              <div
                className="min-h-[120px] px-lg py-md font-body text-base leading-normal text-neutral-800 outline-none empty:before:text-neutral-400 empty:before:content-[attr(data-placeholder)]"
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

        {/* Posts Feed */}
        {posts.map((post) => (
          <div
            key={post.id}
            className="mb-md rounded-lg border border-neutral-200 bg-bg-card p-lg"
          >
            <div className="mb-md flex items-center gap-md">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-[var(--weight-semibold)] text-on-primary ${postAvatarColorMap[post.colorIndex]}`}
              >
                {post.authorInitial}
              </div>
              <div className="flex-1">
                <div className="text-sm font-[var(--weight-medium)] text-neutral-800">
                  <Link
                    to={`/people/${user.id}`}
                    className="text-inherit no-underline transition-colors duration-[var(--transition-default)] hover:text-primary"
                  >
                    {post.authorName}
                  </Link>
                </div>
                <div className="text-xs text-neutral-500">{post.time}</div>
              </div>
            </div>
            <div className="leading-relaxed text-neutral-700">
              <p>{post.body}</p>
            </div>
          </div>
        ))}
      </div>
    </>
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
