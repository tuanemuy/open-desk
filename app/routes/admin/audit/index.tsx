import { Download } from "lucide-react";
import { data, Form } from "react-router";
import { z } from "zod";
import { exportAuditLogsCsv } from "@/core/application/audit/exportAuditLogsCsv";
import { listAuditLogs } from "@/core/application/audit/listAuditLogs";
import { container } from "@/core/application/container/server.instance";
import type { AuditLevel, ServiceType } from "@/core/domain/audit/valueObject";
import { SELECT_CLASSES } from "@/lib/admin";
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

function parseNullableDate(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseNullableEnum<T extends string>(
  value: string | null,
  valid: readonly T[],
): T | null {
  if (!value) return null;
  return (valid as readonly string[]).includes(value) ? (value as T) : null;
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request, container);

  const url = new URL(request.url);
  const dateFrom = parseNullableDate(url.searchParams.get("dateFrom"));
  const dateTo = parseNullableDate(url.searchParams.get("dateTo"));
  const level = parseNullableEnum<AuditLevel>(url.searchParams.get("level"), [
    "CRITICAL",
    "INFO",
  ]);
  const userId = url.searchParams.get("userId") || null;
  const service = parseNullableEnum<ServiceType>(
    url.searchParams.get("service"),
    ["COMMON", "OPEN_DESK", "GAROON", "CYBOZU_OFFICE"],
  );

  const result = await handleUseCase(() =>
    listAuditLogs({
      container,
      headers: request.headers,
      input: {
        filter: {
          dateFrom,
          dateTo,
          level,
          userId,
          service,
          module: null,
          action: null,
          result: null,
        },
        limit: 50,
        offset: 0,
      },
    }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  return { logs: result.logs, totalCount: result.totalCount };
}

const exportCsvSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  level: z.string().optional(),
  userId: z.string().optional(),
  service: z.string().optional(),
});

const handlers = {
  exportCsv: defineHandler({
    schema: exportCsvSchema,
    handler: async (value, args) => {
      await requireAuth(args.request, container);
      const dateFrom = parseNullableDate(value.dateFrom ?? null);
      const dateTo = parseNullableDate(value.dateTo ?? null);
      const level = parseNullableEnum<AuditLevel>(value.level ?? null, [
        "CRITICAL",
        "INFO",
      ]);
      const userId = value.userId || null;
      const service = parseNullableEnum<ServiceType>(value.service ?? null, [
        "COMMON",
        "OPEN_DESK",
        "GAROON",
        "CYBOZU_OFFICE",
      ]);

      return handleUseCase(() =>
        exportAuditLogsCsv({
          container,
          headers: args.request.headers,
          input: {
            filter: {
              dateFrom,
              dateTo,
              level,
              userId,
              service,
              module: null,
              action: null,
              result: null,
            },
          },
        }),
      ).match(
        (result) =>
          success({ logs: result.logs, totalCount: result.totalCount }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}

export function meta(_args: Route.MetaArgs) {
  return [
    {
      title: "監査ログの閲覧とダウンロード - cybozu.com共通管理 - OpenDesk",
    },
  ];
}

const LEVEL_BADGE_CLASSES: Record<string, string> = {
  INFO: "bg-info-light text-info",
  CRITICAL: "bg-warning-light text-warning",
} as const;

const LEVEL_LABELS: Record<string, string> = {
  INFO: "情報",
  CRITICAL: "重要",
} as const;

const SERVICE_LABELS: Record<string, string> = {
  COMMON: "サービス共通",
  OPEN_DESK: "OpenDesk",
  GAROON: "Garoon",
  CYBOZU_OFFICE: "サイボウズ Office",
} as const;

const RESULT_BADGE_CLASSES = {
  SUCCESS: "bg-success-light text-success",
  FAILURE: "bg-error-light text-error",
} as const;

const FILTER_INPUT_CLASSES =
  "h-[34px] rounded-sm border border-neutral-300 bg-bg-card px-md font-body text-sm text-neutral-800 outline-none transition-[border-color,box-shadow] duration-[var(--transition-default)] placeholder:text-neutral-400 focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-lighter)]";

function formatTimestamp(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function AuditLogPage({ loaderData }: Route.ComponentProps) {
  const { logs, totalCount } = loaderData;
  const downloadFetcher = useCompositeAction<typeof handlers>();

  const handleDownload = () => {
    const formData = new FormData();
    formData.set("intent", "exportCsv");
    downloadFetcher.submit(formData, { method: "post" });
  };

  return (
    <section>
      <h2 className="mb-lg font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        監査ログの閲覧とダウンロード
      </h2>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card">
        <div className="p-lg">
          {/* Filter Bar */}
          <Form method="get">
            <div className="mb-lg flex flex-wrap items-end gap-md">
              <div className="flex flex-col gap-xs">
                <span className="text-xs font-[var(--weight-medium)] text-neutral-600">
                  日時範囲
                </span>
                <div className="flex items-center gap-xs">
                  <input
                    type="datetime-local"
                    name="dateFrom"
                    defaultValue="2026-04-01T00:00"
                    className={FILTER_INPUT_CLASSES}
                  />
                  <span className="text-sm text-neutral-400">~</span>
                  <input
                    type="datetime-local"
                    name="dateTo"
                    defaultValue="2026-04-08T23:59"
                    className={FILTER_INPUT_CLASSES}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-xs">
                <span className="text-xs font-[var(--weight-medium)] text-neutral-600">
                  レベル
                </span>
                <select name="level" defaultValue="" className={SELECT_CLASSES}>
                  <option value="">すべて</option>
                  <option value="INFO">情報以上</option>
                  <option value="CRITICAL">重要以上</option>
                </select>
              </div>
              <div className="flex flex-col gap-xs">
                <span className="text-xs font-[var(--weight-medium)] text-neutral-600">
                  ユーザー
                </span>
                <input
                  type="text"
                  name="userId"
                  placeholder="ユーザーを検索"
                  className={FILTER_INPUT_CLASSES}
                  style={{ width: 160 }}
                />
              </div>
              <div className="flex flex-col gap-xs">
                <span className="text-xs font-[var(--weight-medium)] text-neutral-600">
                  サービス
                </span>
                <select
                  name="service"
                  defaultValue=""
                  className={SELECT_CLASSES}
                >
                  <option value="">すべて</option>
                  <option value="COMMON">サービス共通</option>
                  <option value="OPEN_DESK">OpenDesk</option>
                  <option value="GAROON">Garoon</option>
                </select>
              </div>
              <button
                type="submit"
                className="h-[34px] rounded-md border-none bg-primary px-lg font-body text-sm font-[var(--weight-medium)] text-on-primary transition-[background-color] duration-[var(--transition-default)] hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                検索
              </button>
            </div>
          </Form>

          {/* Audit Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="bg-bg-section px-md py-sm text-left text-xs font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
                    レベル
                  </th>
                  <th className="bg-bg-section px-md py-sm text-left text-xs font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
                    日時
                  </th>
                  <th className="bg-bg-section px-md py-sm text-left text-xs font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
                    接続元
                  </th>
                  <th className="bg-bg-section px-md py-sm text-left text-xs font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
                    ユーザー
                  </th>
                  <th className="bg-bg-section px-md py-sm text-left text-xs font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
                    サービス
                  </th>
                  <th className="bg-bg-section px-md py-sm text-left text-xs font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
                    モジュール
                  </th>
                  <th className="bg-bg-section px-md py-sm text-left text-xs font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
                    アクション
                  </th>
                  <th className="bg-bg-section px-md py-sm text-left text-xs font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
                    結果
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.auditLogId}
                    className="border-b border-neutral-200 transition-colors duration-[var(--transition-default)] last:border-b-0 hover:bg-neutral-100"
                  >
                    <td className="px-md py-sm whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-xs rounded-sm px-sm py-[2px] text-xs font-[var(--weight-medium)] ${LEVEL_BADGE_CLASSES[log.level] ?? "bg-neutral-100 text-neutral-600"}`}
                      >
                        {LEVEL_LABELS[log.level] ?? log.level}
                      </span>
                    </td>
                    <td className="px-md py-sm whitespace-nowrap">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="px-md py-sm whitespace-nowrap">
                      {log.sourceIp ?? "-"}
                    </td>
                    <td className="px-md py-sm whitespace-nowrap">
                      {log.userId ?? "-"}
                    </td>
                    <td className="px-md py-sm whitespace-nowrap">
                      {SERVICE_LABELS[log.service] ?? log.service}
                    </td>
                    <td className="px-md py-sm whitespace-nowrap">
                      {log.module}
                    </td>
                    <td className="px-md py-sm whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="px-md py-sm whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-xs rounded-sm px-sm py-[2px] text-xs font-[var(--weight-medium)] ${RESULT_BADGE_CLASSES[log.result]}`}
                      >
                        {log.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Download */}
          <div className="mt-lg flex items-center gap-md">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloadFetcher.isPending("exportCsv")}
              className="inline-flex h-[36px] items-center gap-sm rounded-md border border-neutral-200 bg-bg-card px-lg font-body text-sm font-[var(--weight-medium)] text-neutral-700 transition-[border-color,background-color] duration-[var(--transition-default)] hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
            >
              <Download className="h-[14px] w-[14px]" />
              {downloadFetcher.isPending("exportCsv")
                ? "ダウンロード中..."
                : "ダウンロード"}
            </button>
            <span className="text-xs text-neutral-400">
              10万件までダウンロード可能（保持期間: 6週間）
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
