import { data } from "react-router";
import { isStubNotImplementedError } from "@/core/adapters/stub/error";
import { container } from "@/core/application/container/server.instance";
import { searchGlobal } from "@/core/application/search/searchGlobal";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

export type ResultType =
  | "record"
  | "comment"
  | "thread"
  | "people"
  | "message"
  | "file";

export type SearchResult = {
  id: string;
  type: ResultType;
  title: string;
  snippetParts: SnippetPart[];
  location: string;
  author: string | null;
  createdAt: string;
};

export type SnippetPart = {
  text: string;
  highlighted: boolean;
};

export type SearchLoaderData = {
  keyword: string;
  results: SearchResult[];
  totalCount: number;
};

const SOURCE_TYPE_MAP: Record<string, ResultType> = {
  RECORD: "record",
  COMMENT: "comment",
  THREAD: "thread",
  PEOPLE: "people",
  MESSAGE: "message",
  FILE: "file",
};

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

export async function loader({
  request,
}: Route.LoaderArgs): Promise<SearchLoaderData> {
  const auth = await requireAuth(request, container);

  const url = new URL(request.url);
  const keyword = url.searchParams.get("keyword") ?? "";

  if (!keyword) {
    return { keyword: "", results: [], totalCount: 0 };
  }

  // SearchIndexProvider is currently a stub that throws "Not implemented".
  // Catch that error and return empty results gracefully.
  const searchResult = await handleUseCase(() =>
    searchGlobal({
      container,
      headers: request.headers,
      input: {
        operatorId: auth.userId,
        keyword,
        offset: 0,
        limit: 50,
      },
    }),
  ).match(
    (r) => r,
    (e) => {
      // If this is a stub / "Not implemented" error, return null to indicate empty results
      if (isStubNotImplementedError(e)) {
        return null;
      }
      throw data({ message: e.message }, { status: e.status });
    },
  );

  if (!searchResult) {
    return { keyword, results: [], totalCount: 0 };
  }

  const results: SearchResult[] = searchResult.items.map((item, i) => ({
    id: item.sourceId || String(i + 1),
    type: SOURCE_TYPE_MAP[item.sourceType] ?? "record",
    title: item.title,
    snippetParts: [{ text: item.snippet, highlighted: false }],
    location: item.locationName,
    author: item.creatorName || null,
    createdAt: formatDate(item.createdAt),
  }));

  return {
    keyword,
    results,
    totalCount: searchResult.totalCount,
  };
}
