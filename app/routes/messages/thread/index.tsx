import {
  AlignCenter,
  AlignLeft,
  Bold,
  Highlighter,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Paperclip,
  Redo2,
  RemoveFormatting,
  Smile,
  Type,
  Underline,
  Undo2,
} from "lucide-react";
import type { Route } from "./+types/index";

export { loader } from "./loader.server";

export function meta({ data }: Route.MetaArgs) {
  const name = data?.recipient?.name ?? "メッセージ";
  return [{ title: `メッセージ - ${name} - OpenDesk` }];
}

export default function MessageThreadPage({
  loaderData,
}: Route.ComponentProps) {
  const { recipient, messages } = loaderData;

  return (
    <div className="mx-auto max-w-[800px] px-xl">
      {/* Message Header */}
      <div className="flex items-center gap-md border-b border-neutral-200 py-lg">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-lg font-[var(--weight-semibold)] text-on-primary">
          {recipient.initial}
        </div>
        <h2 className="font-heading text-xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
          {recipient.name}とのメッセージ
        </h2>
      </div>

      {/* Message Input Area */}
      <div className="border-b border-neutral-200 py-lg">
        <div
          className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card"
          tabIndex={-1}
        >
          <div className="group">
            <div className="cursor-text px-lg py-md transition-colors duration-[var(--transition-default)] hover:bg-neutral-50 group-focus-within:hidden">
              <span className="text-neutral-400">メッセージを送る</span>
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
                <ToolbarButton
                  title="番号付きリスト"
                  aria-label="番号付きリスト"
                >
                  <ListOrdered className="h-3.5 w-3.5" />
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
                className="min-h-[100px] px-lg py-md font-body text-base leading-normal text-neutral-800 outline-none empty:before:text-neutral-400 empty:before:content-[attr(data-placeholder)]"
                contentEditable
                data-placeholder="メッセージを送る"
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
                  送信
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message Thread */}
      <div className="pb-2xl">
        {messages.map((message) => (
          <div
            key={message.id}
            className="border-b border-neutral-200 py-lg last:border-b-0"
          >
            <div className="mb-sm flex items-center gap-sm">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-[var(--weight-semibold)] text-on-primary ${
                  message.isSelf ? "bg-primary" : "bg-accent"
                }`}
              >
                {message.senderInitial}
              </div>
              <div className="flex items-baseline gap-sm">
                <span className="text-sm font-[var(--weight-medium)] text-neutral-800">
                  {message.senderName}
                </span>
                <span className="text-xs text-neutral-500">{message.time}</span>
              </div>
            </div>
            <div className="ml-[calc(36px+var(--space-sm))] leading-relaxed text-neutral-700">
              {message.body.map((paragraph) => (
                <p key={paragraph} className="mb-sm last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        ))}
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
