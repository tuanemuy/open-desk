import { Download } from "lucide-react";
import { Link } from "react-router";
import type { Route } from "./+types/index";
import type { AppItem, LicenseInfo } from "./loader";

export { loader } from "./loader";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "アプリ管理 - OpenDeskシステム管理" }];
}

function progressLevel(current: number, limit: number): string {
  const ratio = current / limit;
  if (ratio >= 0.8) return "bg-error";
  if (ratio >= 0.5) return "bg-warning";
  return "bg-success";
}

function LicenseCard({ license }: { license: LicenseInfo }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-bg-card p-lg">
      <div className="mb-sm text-sm font-[var(--weight-medium)] text-neutral-600">
        {license.label}
      </div>
      <div className="mb-md flex items-baseline gap-sm">
        <span className="font-heading text-3xl font-[var(--weight-semibold)] leading-tight text-neutral-900">
          {license.current.toLocaleString()}
        </span>
        {license.limit !== null && (
          <span className="text-base text-neutral-500">
            / {license.limit.toLocaleString()}
          </span>
        )}
      </div>
      {license.limit !== null ? (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
          <div
            className={`h-full rounded-full transition-[width] duration-[var(--transition-slow)] ${progressLevel(license.current, license.limit)}`}
            style={{
              width: `${Math.min((license.current / license.limit) * 100, 100)}%`,
            }}
          />
        </div>
      ) : (
        <div className="invisible h-1.5" />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: "active" | "inactive" }) {
  return (
    <span
      className={`inline-flex items-center gap-xs rounded-full px-sm py-0.5 text-xs font-[var(--weight-medium)] ${
        status === "active"
          ? "bg-success-light text-success"
          : "bg-neutral-150 text-neutral-500"
      }`}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
      {status === "active" ? "運用中" : "停止中"}
    </span>
  );
}

function AppTable({ apps }: { apps: AppItem[] }) {
  return (
    <div className="mb-lg overflow-hidden rounded-lg border border-neutral-200 bg-bg-card">
      <table className="w-full border-collapse text-base">
        <thead>
          <tr>
            <th className="border-b border-neutral-200 bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
              ID
            </th>
            <th className="border-b border-neutral-200 bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
              アプリ名
            </th>
            <th className="border-b border-neutral-200 bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
              所属スペース
            </th>
            <th className="border-b border-neutral-200 bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
              ステータス
            </th>
            <th className="border-b border-neutral-200 bg-bg-section px-md py-sm text-right text-sm font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
              レコード数
            </th>
            <th className="border-b border-neutral-200 bg-bg-section px-md py-sm text-right text-sm font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
              フィールド数
            </th>
          </tr>
        </thead>
        <tbody>
          {apps.map((app) => (
            <tr
              key={app.id}
              className="transition-colors duration-[var(--transition-default)] last:*:border-b-0 hover:bg-neutral-100"
            >
              <td className="border-b border-neutral-200 px-md py-sm text-neutral-800">
                {app.id}
              </td>
              <td className="border-b border-neutral-200 px-md py-sm">
                <Link
                  to={`/apps/${app.id}`}
                  className="text-primary no-underline transition-colors duration-[var(--transition-default)] hover:text-primary-dark hover:underline"
                >
                  {app.name}
                </Link>
              </td>
              <td className="border-b border-neutral-200 px-md py-sm text-neutral-800">
                {app.space}
              </td>
              <td className="border-b border-neutral-200 px-md py-sm">
                <StatusBadge status={app.status} />
              </td>
              <td className="border-b border-neutral-200 px-md py-sm text-right text-neutral-800">
                {app.recordCount.toLocaleString()}
              </td>
              <td className="border-b border-neutral-200 px-md py-sm text-right text-neutral-800">
                {app.fieldCount.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AppsPage({ loaderData }: Route.ComponentProps) {
  const { licenses, apps } = loaderData;

  return (
    <section>
      <h2 className="mb-lg border-b border-neutral-200 pb-md font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        アプリ管理
      </h2>

      <h3 className="mb-md font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
        ライセンスの使用状況
      </h3>
      <div className="mb-lg grid grid-cols-3 gap-md">
        {licenses.map((license) => (
          <LicenseCard key={license.label} license={license} />
        ))}
      </div>

      <h3 className="mb-md font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
        アプリの一覧
      </h3>
      <AppTable apps={apps} />

      <div className="mt-lg flex items-center gap-md">
        <button
          type="button"
          className="inline-flex h-9 items-center gap-sm rounded-md border border-neutral-200 bg-bg-card px-md font-body text-sm font-[var(--weight-medium)] text-neutral-700 transition-[border-color,background-color] duration-[var(--transition-default)] hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Download className="h-3.5 w-3.5" />
          CSV形式でダウンロードする
        </button>
      </div>
    </section>
  );
}
