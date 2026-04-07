import { Upload } from "lucide-react";
import { container } from "@/core/application/container/server.instance";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request, container);
  return {};
}

export function meta(_args: Route.MetaArgs) {
  return [{ title: "ファイルからの読み込み - cybozu.com共通管理 - OpenDesk" }];
}

export default function CsvImportPage(_props: Route.ComponentProps) {
  return (
    <section>
      <h2 className="mb-lg font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        ファイルからの読み込み
      </h2>
      <p className="mb-lg text-sm text-neutral-500">
        CSVファイルからユーザーや組織のデータを一括で読み込みます。
      </p>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card p-lg">
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
              accept=".csv"
              className="text-sm text-neutral-600 file:mr-md file:h-[34px] file:cursor-pointer file:rounded-md file:border file:border-neutral-200 file:bg-bg-card file:px-lg file:font-body file:text-sm file:font-[var(--weight-medium)] file:text-neutral-700 file:transition-[border-color,background-color] file:duration-[var(--transition-default)] hover:file:border-neutral-300 hover:file:bg-neutral-50"
            />
          </div>
          <p className="mt-sm text-xs text-neutral-400">
            文字コード: UTF-8 / ファイル形式: CSV
          </p>
        </div>

        <button
          type="button"
          className="inline-flex h-[36px] items-center gap-sm rounded-md border-none bg-primary px-lg font-body text-sm font-[var(--weight-medium)] text-on-primary transition-[background-color] duration-[var(--transition-default)] hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Upload className="h-[14px] w-[14px]" />
          読み込む
        </button>
      </div>
    </section>
  );
}
