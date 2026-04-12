import { FileUp } from "lucide-react";
import type { Route } from "./+types/index";

export { action } from "./action.server";
export { loader } from "./loader.server";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "プラグイン - OpenDeskシステム管理" }];
}

const PREINSTALLED_PLUGINS = [
  "サイボウズ Office スケジュール連携",
  "メール作成",
  "メール履歴表示",
  "メールスレッド表示",
  "Garoonスケジュール連携",
  "メールワイズ連携",
];

export default function PluginsPage({ loaderData }: Route.ComponentProps) {
  const { plugins } = loaderData;

  return (
    <section>
      <h2 className="mb-lg border-b border-neutral-200 pb-md font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        プラグイン
      </h2>

      <div className="mb-lg flex items-center gap-md">
        <button
          type="button"
          className="inline-flex h-9 items-center gap-sm rounded-md border border-neutral-200 bg-bg-card px-md font-body text-sm font-[var(--weight-medium)] text-neutral-700 transition-[border-color,background-color] duration-[var(--transition-default)] hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <FileUp className="h-3.5 w-3.5" />
          読み込む
        </button>
      </div>

      <h3 className="mb-md font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
        プラグインの一覧
      </h3>
      {plugins.length === 0 ? (
        <div className="mb-lg rounded-lg border border-neutral-200 bg-bg-card p-2xl text-center text-sm text-neutral-500">
          追加されたプラグインはありません。
        </div>
      ) : (
        <div className="mb-lg overflow-hidden rounded-lg border border-neutral-200 bg-bg-card">
          <table className="w-full border-collapse text-base">
            <thead>
              <tr>
                <th className="border-b border-neutral-200 bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
                  プラグイン名
                </th>
                <th className="border-b border-neutral-200 bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
                  説明
                </th>
                <th className="border-b border-neutral-200 bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
                  ステータス
                </th>
                <th className="border-b border-neutral-200 bg-bg-section px-md py-sm text-right text-sm font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
                  追加しているアプリ
                </th>
              </tr>
            </thead>
            <tbody>
              {plugins.map((plugin) => (
                <tr
                  key={plugin.pluginId}
                  className="transition-colors duration-[var(--transition-default)] last:*:border-b-0 hover:bg-neutral-100"
                >
                  <td className="border-b border-neutral-200 px-md py-sm text-neutral-800">
                    {plugin.name}
                  </td>
                  <td className="border-b border-neutral-200 px-md py-sm text-neutral-800">
                    {plugin.description}
                  </td>
                  <td className="border-b border-neutral-200 px-md py-sm">
                    <span
                      className={`inline-flex items-center gap-xs rounded-full px-sm py-0.5 text-xs font-[var(--weight-medium)] ${
                        plugin.isActive
                          ? "bg-success-light text-success"
                          : "bg-neutral-150 text-neutral-500"
                      }`}
                    >
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
                      {plugin.isActive ? "有効" : "無効"}
                    </span>
                  </td>
                  <td className="border-b border-neutral-200 px-md py-sm text-right text-neutral-800">
                    {plugin.installedAppIds.length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3 className="mb-md font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
        プリインストール済みプラグイン
      </h3>
      <div className="rounded-lg border border-neutral-200 bg-bg-card p-lg">
        <ul className="list-none">
          {PREINSTALLED_PLUGINS.map((name) => (
            <li
              key={name}
              className="border-b border-neutral-100 py-sm text-base text-neutral-800 last:border-b-0"
            >
              {name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
