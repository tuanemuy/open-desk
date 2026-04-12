import { AlertCircle, CheckCircle2, Upload } from "lucide-react";
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
  return [{ title: "ファイルからの読み込み - cybozu.com共通管理 - OpenDesk" }];
}

export default function CsvImportPage(_props: Route.ComponentProps) {
  const fetcher = useCompositeAction<typeof handlers>();

  const isImporting = fetcher.isPending("importCsv");

  const importResult =
    fetcher.data?.intent === "importCsv" && fetcher.data.status === "success"
      ? (fetcher.data.data as {
          importedCount: number;
          skippedCount: number;
          errors: Array<{ row: number; message: string }>;
        })
      : null;

  const importError =
    fetcher.data?.intent === "importCsv" && fetcher.data.status === "error"
      ? fetcher.data.error
      : null;

  return (
    <section>
      <h2 className="mb-lg font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        ファイルからの読み込み
      </h2>
      <p className="mb-lg text-sm text-neutral-500">
        CSVファイルからユーザーや組織のデータを一括で読み込みます。
      </p>

      {importResult && (
        <div className="mb-lg rounded-lg border border-success bg-success-light p-lg">
          <div className="mb-sm flex items-center gap-sm">
            <CheckCircle2 className="h-[16px] w-[16px] text-success" />
            <span className="font-heading text-base font-[var(--weight-semibold)] text-success">
              読み込み完了
            </span>
          </div>
          <p className="text-sm text-neutral-700">
            {importResult.importedCount}件を読み込みました。
            {importResult.skippedCount > 0 &&
              `${importResult.skippedCount}件をスキップしました。`}
          </p>
          {importResult.errors.length > 0 && (
            <div className="mt-md">
              <p className="mb-sm text-sm font-[var(--weight-medium)] text-neutral-600">
                エラー詳細:
              </p>
              <ul className="max-h-[200px] overflow-y-auto text-sm text-neutral-600">
                {importResult.errors.map((err) => (
                  <li key={`row-${err.row}`} className="mb-xs">
                    行 {err.row}: {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {importError && (
        <div className="mb-lg rounded-lg border border-error bg-error-light p-lg">
          <div className="flex items-center gap-sm">
            <AlertCircle className="h-[16px] w-[16px] text-error" />
            <span className="font-heading text-base font-[var(--weight-semibold)] text-error">
              エラー
            </span>
          </div>
          <p className="mt-sm text-sm text-neutral-700">
            {importError?.[""]?.[0] ?? "読み込みに失敗しました"}
          </p>
        </div>
      )}

      <fetcher.Form
        method="post"
        encType="multipart/form-data"
        className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card p-lg"
      >
        <input type="hidden" name="intent" value="importCsv" />

        <div className="mb-lg">
          <div className="mb-md border-b border-neutral-200 pb-sm font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
            読み込み対象
          </div>
          <div className="flex flex-col gap-md">
            <label className="flex cursor-pointer items-center gap-sm">
              <input
                type="radio"
                name="importType"
                value="users"
                defaultChecked
                className="h-[18px] w-[18px] shrink-0 cursor-pointer accent-primary"
              />
              <span className="text-base text-neutral-800">ユーザーの情報</span>
            </label>
            <label className="flex cursor-pointer items-center gap-sm">
              <input
                type="radio"
                name="importType"
                value="organizations"
                className="h-[18px] w-[18px] shrink-0 cursor-pointer accent-primary"
              />
              <span className="text-base text-neutral-800">組織の情報</span>
            </label>
            <label className="flex cursor-pointer items-center gap-sm">
              <input
                type="radio"
                name="importType"
                value="groups"
                className="h-[18px] w-[18px] shrink-0 cursor-pointer accent-primary"
              />
              <span className="text-base text-neutral-800">グループの情報</span>
            </label>
          </div>
        </div>

        <div className="mb-lg">
          <div className="mb-md border-b border-neutral-200 pb-sm font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
            ファイルの選択
          </div>
          <div className="flex items-center gap-md">
            <input
              type="file"
              name="csvFile"
              accept=".csv"
              className="text-sm text-neutral-600 file:mr-md file:h-[34px] file:cursor-pointer file:rounded-md file:border file:border-neutral-200 file:bg-bg-card file:px-lg file:font-body file:text-sm file:font-[var(--weight-medium)] file:text-neutral-700 file:transition-[border-color,background-color] file:duration-[var(--transition-default)] hover:file:border-neutral-300 hover:file:bg-neutral-50"
            />
          </div>
          <p className="mt-sm text-xs text-neutral-400">
            文字コード: UTF-8 / ファイル形式: CSV
          </p>
        </div>

        <div className="mb-lg">
          <label className="flex cursor-pointer items-center gap-sm">
            <input
              type="checkbox"
              name="hasHeader"
              defaultChecked
              className="h-[18px] w-[18px] shrink-0 cursor-pointer accent-primary"
            />
            <span className="text-sm text-neutral-700">
              先頭行をヘッダーとして扱う
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isImporting}
          className="inline-flex h-[36px] items-center gap-sm rounded-md border-none bg-primary px-lg font-body text-sm font-[var(--weight-medium)] text-on-primary transition-[background-color] duration-[var(--transition-default)] hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
        >
          <Upload className="h-[14px] w-[14px]" />
          {isImporting ? "読み込み中..." : "読み込む"}
        </button>
      </fetcher.Form>
    </section>
  );
}
