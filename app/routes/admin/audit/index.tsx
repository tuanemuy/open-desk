import { Download } from "lucide-react";
import { container } from "@/core/application/container/server.instance";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

type AuditLogEntry = {
  id: string;
  level: "info" | "warning" | "error";
  datetime: string;
  sourceIp: string;
  userName: string;
  service: string;
  module: string;
  action: string;
  result: "SUCCESS" | "FAILURE";
};

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request, container);

  const logs: AuditLogEntry[] = [
    {
      id: "1",
      level: "info",
      datetime: "2026-04-08 14:32:01",
      sourceIp: "192.168.1.10",
      userName: "山田 太郎",
      service: "OpenDesk",
      module: "Authentication",
      action: "login",
      result: "SUCCESS",
    },
    {
      id: "2",
      level: "warning",
      datetime: "2026-04-08 13:15:42",
      sourceIp: "10.0.0.55",
      userName: "佐藤 花子",
      service: "サービス共通",
      module: "App management",
      action: "App create",
      result: "SUCCESS",
    },
    {
      id: "3",
      level: "info",
      datetime: "2026-04-08 10:05:18",
      sourceIp: "172.16.0.22",
      userName: "鈴木 一郎",
      service: "OpenDesk",
      module: "Authentication",
      action: "login",
      result: "FAILURE",
    },
  ];

  return { logs };
}

export function meta(_args: Route.MetaArgs) {
  return [
    {
      title: "監査ログの閲覧とダウンロード - cybozu.com共通管理 - OpenDesk",
    },
  ];
}

const LEVEL_BADGE_CLASSES = {
  info: "bg-info-light text-info",
  warning: "bg-warning-light text-warning",
  error: "bg-error-light text-error",
} as const;

const LEVEL_LABELS = {
  info: "情報",
  warning: "重要",
  error: "エラー",
} as const;

const RESULT_BADGE_CLASSES = {
  SUCCESS: "bg-success-light text-success",
  FAILURE: "bg-error-light text-error",
} as const;

const FILTER_INPUT_CLASSES =
  "h-[34px] rounded-sm border border-neutral-300 bg-bg-card px-md font-body text-sm text-neutral-800 outline-none transition-[border-color,box-shadow] duration-[var(--transition-default)] placeholder:text-neutral-400 focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-lighter)]";

const SELECT_CLASSES =
  "h-[34px] min-w-[140px] cursor-pointer appearance-none rounded-sm border border-neutral-300 bg-bg-card bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[right_10px_center] bg-no-repeat px-md pr-xl font-body text-sm text-neutral-800 outline-none transition-[border-color,box-shadow] duration-[var(--transition-default)] hover:border-neutral-400 focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-lighter)]";

export default function AuditLogPage({ loaderData }: Route.ComponentProps) {
  const { logs } = loaderData;

  return (
    <section>
      <h2 className="mb-lg font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        監査ログの閲覧とダウンロード
      </h2>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card">
        <div className="p-lg">
          {/* Filter Bar */}
          <div className="mb-lg flex flex-wrap items-end gap-md">
            <div className="flex flex-col gap-xs">
              <span className="text-xs font-[var(--weight-medium)] text-neutral-600">
                日時範囲
              </span>
              <div className="flex items-center gap-xs">
                <input
                  type="datetime-local"
                  defaultValue="2026-04-01T00:00"
                  className={FILTER_INPUT_CLASSES}
                />
                <span className="text-sm text-neutral-400">~</span>
                <input
                  type="datetime-local"
                  defaultValue="2026-04-08T23:59"
                  className={FILTER_INPUT_CLASSES}
                />
              </div>
            </div>
            <div className="flex flex-col gap-xs">
              <span className="text-xs font-[var(--weight-medium)] text-neutral-600">
                レベル
              </span>
              <select defaultValue="info" className={SELECT_CLASSES}>
                <option value="info">情報以上</option>
                <option value="warning">重要以上</option>
              </select>
            </div>
            <div className="flex flex-col gap-xs">
              <span className="text-xs font-[var(--weight-medium)] text-neutral-600">
                ユーザー
              </span>
              <input
                type="text"
                placeholder="ユーザーを検索"
                className={FILTER_INPUT_CLASSES}
                style={{ width: 160 }}
              />
            </div>
            <div className="flex flex-col gap-xs">
              <span className="text-xs font-[var(--weight-medium)] text-neutral-600">
                サービス
              </span>
              <select defaultValue="all" className={SELECT_CLASSES}>
                <option value="all">すべて</option>
                <option value="common">サービス共通</option>
                <option value="opendesk">OpenDesk</option>
                <option value="garoon">Garoon</option>
              </select>
            </div>
          </div>

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
                    key={log.id}
                    className="border-b border-neutral-200 transition-colors duration-[var(--transition-default)] last:border-b-0 hover:bg-neutral-100"
                  >
                    <td className="px-md py-sm whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-xs rounded-sm px-sm py-[2px] text-xs font-[var(--weight-medium)] ${LEVEL_BADGE_CLASSES[log.level]}`}
                      >
                        {LEVEL_LABELS[log.level]}
                      </span>
                    </td>
                    <td className="px-md py-sm whitespace-nowrap">
                      {log.datetime}
                    </td>
                    <td className="px-md py-sm whitespace-nowrap">
                      {log.sourceIp}
                    </td>
                    <td className="px-md py-sm whitespace-nowrap">
                      {log.userName}
                    </td>
                    <td className="px-md py-sm whitespace-nowrap">
                      {log.service}
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
              className="inline-flex h-[36px] items-center gap-sm rounded-md border border-neutral-200 bg-bg-card px-lg font-body text-sm font-[var(--weight-medium)] text-neutral-700 transition-[border-color,background-color] duration-[var(--transition-default)] hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Download className="h-[14px] w-[14px]" />
              ダウンロード
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
