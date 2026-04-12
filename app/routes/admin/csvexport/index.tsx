import { AlertCircle, Download } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { container } from "@/core/application/container/server.instance";
import { useCompositeAction } from "@/lib/compositeAction";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";
import type { handlers } from "./action.server";

export { action } from "./action.server";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request, container);
  return {};
}

export function meta(_args: Route.MetaArgs) {
  return [{ title: "ファイルへの書き出し - cybozu.com共通管理 - OpenDesk" }];
}

/**
 * Trigger a browser download for the given CSV content.
 */
function downloadCsv(csvContent: string, fileName: string): void {
  const bom = "\uFEFF";
  const blob = new Blob([bom + csvContent], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export default function CsvExportPage(_props: Route.ComponentProps) {
  const fetcher = useCompositeAction<typeof handlers>();
  const downloadedRef = useRef(false);

  const isExporting = fetcher.isPending("exportCsv");

  const exportError =
    fetcher.data?.intent === "exportCsv" && fetcher.data.status === "error"
      ? fetcher.data.error
      : null;

  const handleDownload = useCallback(() => {
    if (
      fetcher.data?.intent === "exportCsv" &&
      fetcher.data.status === "success" &&
      !downloadedRef.current
    ) {
      const data = fetcher.data.data as {
        csvContent: string;
        fileName: string;
        totalCount: number;
      };
      downloadCsv(data.csvContent, data.fileName);
      downloadedRef.current = true;
    }
  }, [fetcher.data]);

  useEffect(() => {
    downloadedRef.current = false;
  }, [fetcher.state]);

  useEffect(() => {
    handleDownload();
  }, [handleDownload]);

  return (
    <section>
      <h2 className="mb-lg font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        ファイルへの書き出し
      </h2>
      <p className="mb-lg text-sm text-neutral-500">
        ユーザーや組織のデータをCSVファイルとして書き出します。
      </p>

      {exportError && (
        <div className="mb-lg rounded-lg border border-error bg-error-light p-lg">
          <div className="flex items-center gap-sm">
            <AlertCircle className="h-[16px] w-[16px] text-error" />
            <span className="font-heading text-base font-[var(--weight-semibold)] text-error">
              エラー
            </span>
          </div>
          <p className="mt-sm text-sm text-neutral-700">
            {exportError?.[""]?.[0] ?? "書き出しに失敗しました"}
          </p>
        </div>
      )}

      <fetcher.Form
        method="post"
        className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card p-lg"
      >
        <input type="hidden" name="intent" value="exportCsv" />

        <div className="mb-lg">
          <div className="mb-md border-b border-neutral-200 pb-sm font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
            書き出し対象
          </div>
          <div className="flex flex-col gap-md">
            <label className="flex cursor-pointer items-center gap-sm">
              <input
                type="radio"
                name="exportType"
                value="users"
                defaultChecked
                className="h-[18px] w-[18px] shrink-0 cursor-pointer accent-primary"
              />
              <span className="text-base text-neutral-800">ユーザーの情報</span>
            </label>
            <label className="flex cursor-pointer items-center gap-sm">
              <input
                type="radio"
                name="exportType"
                value="organizations"
                className="h-[18px] w-[18px] shrink-0 cursor-pointer accent-primary"
              />
              <span className="text-base text-neutral-800">組織の情報</span>
            </label>
            <label className="flex cursor-pointer items-center gap-sm">
              <input
                type="radio"
                name="exportType"
                value="groups"
                className="h-[18px] w-[18px] shrink-0 cursor-pointer accent-primary"
              />
              <span className="text-base text-neutral-800">グループの情報</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={isExporting}
          className="inline-flex h-[36px] items-center gap-sm rounded-md border-none bg-primary px-lg font-body text-sm font-[var(--weight-medium)] text-on-primary transition-[background-color] duration-[var(--transition-default)] hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
        >
          <Download className="h-[14px] w-[14px]" />
          {isExporting ? "書き出し中..." : "書き出す"}
        </button>
      </fetcher.Form>
    </section>
  );
}
