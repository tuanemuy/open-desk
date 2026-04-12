import { Download } from "lucide-react";
import { data } from "react-router";
import { z } from "zod";
import { exportUserAccessUsagesCsv } from "@/core/application/audit/exportUserAccessUsagesCsv";
import { listUserAccessUsages } from "@/core/application/audit/listUserAccessUsages";
import { container } from "@/core/application/container/server.instance";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
  useCompositeAction,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "ユーザーのアクセス状況 - OpenDeskシステム管理" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request, container);

  const result = await handleUseCase(() =>
    listUserAccessUsages({
      container,
      headers: request.headers,
      input: undefined,
    }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  return { usages: result.usages };
}

const handlers = {
  exportCsv: defineHandler({
    schema: z.object({}),
    handler: async (_value, args) => {
      await requireAuth(args.request, container);

      return handleUseCase(() =>
        exportUserAccessUsagesCsv({
          container,
          headers: args.request.headers,
          input: undefined,
        }),
      ).match(
        (result) => success({ usages: result.usages }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}

function formatDate(date: Date | string | null): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function UserAccessPage({ loaderData }: Route.ComponentProps) {
  const { usages } = loaderData;
  const downloadFetcher = useCompositeAction<typeof handlers>();

  const handleDownload = () => {
    const formData = new FormData();
    formData.set("intent", "exportCsv");
    downloadFetcher.submit(formData, { method: "post" });
  };

  return (
    <section>
      <h2 className="mb-lg border-b border-neutral-200 pb-md font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        ユーザーのアクセス状況
      </h2>

      {usages.length === 0 ? (
        <div className="mb-lg rounded-lg border border-neutral-200 bg-bg-card p-2xl text-center text-sm text-neutral-500">
          アクセス状況のデータはありません。
        </div>
      ) : (
        <div className="mb-lg overflow-hidden rounded-lg border border-neutral-200 bg-bg-card">
          <table className="w-full border-collapse text-base">
            <thead>
              <tr>
                <th className="border-b border-neutral-200 bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
                  ユーザー
                </th>
                <th className="border-b border-neutral-200 bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
                  最終アクセス日
                </th>
                <th className="border-b border-neutral-200 bg-bg-section px-md py-sm text-right text-sm font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
                  過去30日間のアクセス日数
                </th>
              </tr>
            </thead>
            <tbody>
              {usages.map((usage) => (
                <tr
                  key={usage.userId}
                  className="transition-colors duration-[var(--transition-default)] last:*:border-b-0 hover:bg-neutral-100"
                >
                  <td className="border-b border-neutral-200 px-md py-sm text-neutral-800">
                    {usage.userId}
                  </td>
                  <td className="border-b border-neutral-200 px-md py-sm text-neutral-800">
                    {formatDate(usage.lastAccessDate)}
                  </td>
                  <td className="border-b border-neutral-200 px-md py-sm text-right text-neutral-800">
                    {usage.accessDaysLast30}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center gap-md">
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloadFetcher.isPending("exportCsv")}
          className="inline-flex h-9 items-center gap-sm rounded-md border border-neutral-200 bg-bg-card px-md font-body text-sm font-[var(--weight-medium)] text-neutral-700 transition-[border-color,background-color] duration-[var(--transition-default)] hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
        >
          <Download className="h-3.5 w-3.5" />
          {downloadFetcher.isPending("exportCsv")
            ? "ダウンロード中..."
            : "CSV形式でダウンロードする"}
        </button>
      </div>
    </section>
  );
}
