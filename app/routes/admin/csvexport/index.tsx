import { Download } from "lucide-react";
import { container } from "@/core/application/container/server.instance";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request, container);
  return {};
}

export function meta(_args: Route.MetaArgs) {
  return [{ title: "ファイルへの書き出し - cybozu.com共通管理 - OpenDesk" }];
}

export default function CsvExportPage(_props: Route.ComponentProps) {
  return (
    <section>
      <h2 className="mb-lg font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        ファイルへの書き出し
      </h2>
      <p className="mb-lg text-sm text-neutral-500">
        ユーザーや組織のデータをCSVファイルとして書き出します。
      </p>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card p-lg">
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
          type="button"
          className="inline-flex h-[36px] items-center gap-sm rounded-md border-none bg-primary px-lg font-body text-sm font-[var(--weight-medium)] text-on-primary transition-[background-color] duration-[var(--transition-default)] hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Download className="h-[14px] w-[14px]" />
          書き出す
        </button>
      </div>
    </section>
  );
}
