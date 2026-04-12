import {
  AlignLeft,
  File,
  FileText,
  Mail,
  MessageSquare,
  User,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/index";
import type { ResultType, SearchResult, SnippetPart } from "./loader.server";

export { loader } from "./loader.server";

export function meta({ loaderData }: Route.MetaArgs) {
  return [
    {
      title: `「${loaderData.keyword}」の検索結果 - OpenDesk`,
    },
  ];
}

type SearchMode = "fulltext" | "title";

const resultTypeConfig: Record<
  ResultType,
  {
    label: string;
    bgClass: string;
    textClass: string;
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  record: {
    label: "レコード",
    bgClass: "bg-primary-lighter",
    textClass: "text-primary-dark",
    Icon: FileText,
  },
  comment: {
    label: "コメント",
    bgClass: "bg-success-light",
    textClass: "text-success",
    Icon: MessageSquare,
  },
  thread: {
    label: "スレッド",
    bgClass: "bg-warning-light",
    textClass: "text-warning",
    Icon: AlignLeft,
  },
  people: {
    label: "ピープル",
    bgClass: "bg-accent-light",
    textClass: "text-accent",
    Icon: User,
  },
  message: {
    label: "メッセージ",
    bgClass: "bg-info-light",
    textClass: "text-info",
    Icon: Mail,
  },
  file: {
    label: "ファイル",
    bgClass: "bg-neutral-150",
    textClass: "text-neutral-600",
    Icon: File,
  },
};

const filterTypes = [
  { key: "record" as const, label: "レコード" },
  { key: "comment" as const, label: "レコードコメント" },
  { key: "thread" as const, label: "スペース・スレッド" },
  { key: "people" as const, label: "ピープル" },
  { key: "message" as const, label: "メッセージ" },
  { key: "file" as const, label: "添付ファイル" },
];

export default function SearchPage({ loaderData }: Route.ComponentProps) {
  const { keyword, results, totalCount } = loaderData;
  const [searchMode, setSearchMode] = useState<SearchMode>("fulltext");
  const [typeFilters, setTypeFilters] = useState<Record<string, boolean>>({
    record: true,
    comment: true,
    thread: true,
    people: true,
    message: true,
    file: true,
  });
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [creatorSearch, setCreatorSearch] = useState("");

  const handleTypeFilterChange = (key: string, checked: boolean) => {
    setTypeFilters((prev) => ({ ...prev, [key]: checked }));
  };

  const filteredResults = results.filter((result) => typeFilters[result.type]);

  return (
    <div className="mx-auto max-w-[1400px] px-xl py-xl pb-3xl">
      {/* Search Context */}
      <div className="mb-lg">
        <h1 className="mb-md font-heading text-xl font-[var(--weight-semibold)] leading-tight text-neutral-900">
          「{keyword}」の検索結果
        </h1>
        <div className="flex gap-xs">
          <button
            type="button"
            className={`inline-block rounded-full px-md py-xs text-sm font-[var(--weight-medium)] no-underline transition-[color,background-color] duration-[var(--transition-default)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              searchMode === "fulltext"
                ? "bg-primary text-on-primary"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-800"
            }`}
            onClick={() => setSearchMode("fulltext")}
          >
            OpenDesk全体を検索
          </button>
          <button
            type="button"
            className={`inline-block rounded-full px-md py-xs text-sm font-[var(--weight-medium)] no-underline transition-[color,background-color] duration-[var(--transition-default)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              searchMode === "title"
                ? "bg-primary text-on-primary"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-800"
            }`}
            onClick={() => setSearchMode("title")}
          >
            タイトル検索
          </button>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="flex items-start gap-lg">
        {/* Left Sidebar: Filters */}
        <aside className="w-[250px] shrink-0">
          <div className="rounded-lg border border-neutral-200 bg-bg-card p-lg">
            {/* Type Filter */}
            <div className="mb-lg">
              <div className="mb-sm text-sm font-[var(--weight-semibold)] text-neutral-700">
                種類
              </div>
              <div className="flex flex-col gap-sm">
                {filterTypes.map((ft) => (
                  <label
                    key={ft.key}
                    className="flex cursor-pointer items-center gap-sm"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 shrink-0 cursor-pointer accent-primary"
                      checked={typeFilters[ft.key]}
                      onChange={(e) =>
                        handleTypeFilterChange(ft.key, e.target.checked)
                      }
                    />
                    <span className="text-sm text-neutral-700 select-none">
                      {ft.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="mb-lg">
              <div className="mb-sm text-sm font-[var(--weight-semibold)] text-neutral-700">
                作成日の範囲
              </div>
              <div className="flex flex-col gap-sm">
                <input
                  type="date"
                  aria-label="開始日"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-[34px] w-full rounded-md border border-neutral-300 bg-bg-card px-sm font-body text-sm text-neutral-800 outline-none transition-[border-color,box-shadow] duration-[var(--transition-default)] hover:border-neutral-400 focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-lighter)]"
                />
                <div className="text-center text-sm text-neutral-500">~</div>
                <input
                  type="date"
                  aria-label="終了日"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-[34px] w-full rounded-md border border-neutral-300 bg-bg-card px-sm font-body text-sm text-neutral-800 outline-none transition-[border-color,box-shadow] duration-[var(--transition-default)] hover:border-neutral-400 focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-lighter)]"
                />
              </div>
            </div>

            {/* Creator Filter */}
            <div className="mb-lg">
              <div className="mb-sm text-sm font-[var(--weight-semibold)] text-neutral-700">
                作成者
              </div>
              <input
                type="text"
                placeholder="ユーザーを検索"
                aria-label="作成者を検索"
                value={creatorSearch}
                onChange={(e) => setCreatorSearch(e.target.value)}
                className="h-[34px] w-full rounded-md border border-neutral-300 bg-bg-card px-sm font-body text-sm text-neutral-800 outline-none transition-[border-color,box-shadow] duration-[var(--transition-default)] placeholder:text-neutral-400 hover:border-neutral-400 focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-lighter)]"
              />
            </div>

            <button
              type="button"
              className="mt-md h-9 w-full rounded-md border-none bg-primary font-body text-sm font-[var(--weight-medium)] text-on-primary transition-[background-color] duration-[var(--transition-default)] hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:bg-primary-darker"
            >
              絞り込む
            </button>
          </div>
        </aside>

        {/* Main: Search Results */}
        <main className="min-w-0 flex-1">
          <div className="mb-md text-sm text-neutral-500">
            {totalCount}件の検索結果
          </div>

          <div className="flex flex-col">
            {filteredResults.map((result) => (
              <SearchResultItem key={result.id} result={result} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

function SearchResultItem({ result }: { result: SearchResult }) {
  const config = resultTypeConfig[result.type];
  const { Icon } = config;

  return (
    <div className="flex gap-md border-b border-neutral-200 py-md first:pt-0">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${config.bgClass} ${config.textClass}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-xs text-base font-[var(--weight-medium)] leading-tight">
          <Link
            to="#"
            className="text-primary no-underline transition-colors duration-[var(--transition-default)] hover:text-primary-dark hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {result.title}
          </Link>
        </div>
        <div className="mb-sm line-clamp-2 text-sm leading-normal text-neutral-600">
          <SnippetText parts={result.snippetParts} />
        </div>
        <div className="flex items-center gap-sm text-xs text-neutral-500">
          <span>{result.location}</span>
          {result.author && (
            <>
              <span className="text-neutral-300">/</span>
              <Link
                to="#"
                className="text-primary no-underline transition-colors duration-[var(--transition-default)] hover:text-primary-dark hover:underline"
              >
                {result.author}
              </Link>
            </>
          )}
          <span className="text-neutral-300">/</span>
          <span>{result.createdAt}</span>
        </div>
      </div>
    </div>
  );
}

function SnippetText({ parts }: { parts: SnippetPart[] }) {
  return (
    <>
      {parts.map((part, index) => {
        const key = `${index}-${part.text.slice(0, 10)}`;
        return part.highlighted ? (
          <strong
            key={key}
            className="rounded-sm bg-warning-light px-[2px] py-[1px] font-[var(--weight-semibold)] text-neutral-900"
          >
            {part.text}
          </strong>
        ) : (
          <span key={key}>{part.text}</span>
        );
      })}
    </>
  );
}
