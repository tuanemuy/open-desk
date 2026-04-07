import { container } from "@/core/application/container/server.instance";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request, container);
  return {};
}

export function meta(_args: Route.MetaArgs) {
  return [{ title: "監査ログ設定 - cybozu.com共通管理 - OpenDesk" }];
}

export default function AuditSettingsPage(_props: Route.ComponentProps) {
  return (
    <section>
      <h2 className="mb-lg font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        監査ログ設定
      </h2>
      <p className="mb-lg text-sm text-neutral-500">
        監査ログの記録対象やレベルを設定します。
      </p>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card p-lg">
        <div className="mb-lg">
          <div className="mb-md border-b border-neutral-200 pb-sm font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
            記録レベル
          </div>
          <div className="flex flex-col gap-md">
            <label className="flex cursor-pointer items-center gap-sm">
              <input
                type="radio"
                name="logLevel"
                value="info"
                defaultChecked
                className="h-[18px] w-[18px] shrink-0 cursor-pointer accent-primary"
              />
              <span className="text-base text-neutral-800">
                情報以上（すべてのログを記録）
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-sm">
              <input
                type="radio"
                name="logLevel"
                value="warning"
                className="h-[18px] w-[18px] shrink-0 cursor-pointer accent-primary"
              />
              <span className="text-base text-neutral-800">
                重要以上（重要なイベントのみ記録）
              </span>
            </label>
          </div>
        </div>

        <div className="mb-lg">
          <div className="mb-md border-b border-neutral-200 pb-sm font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
            記録対象
          </div>
          <div className="flex flex-col gap-md">
            <div className="flex items-start gap-sm">
              <input
                type="checkbox"
                id="log-auth"
                defaultChecked
                className="mt-[2px] h-[18px] w-[18px] shrink-0 cursor-pointer accent-primary"
              />
              <label
                htmlFor="log-auth"
                className="cursor-pointer text-base leading-normal text-neutral-800"
              >
                認証（ログイン/ログアウト）
              </label>
            </div>
            <div className="flex items-start gap-sm">
              <input
                type="checkbox"
                id="log-admin"
                defaultChecked
                className="mt-[2px] h-[18px] w-[18px] shrink-0 cursor-pointer accent-primary"
              />
              <label
                htmlFor="log-admin"
                className="cursor-pointer text-base leading-normal text-neutral-800"
              >
                管理操作
              </label>
            </div>
            <div className="flex items-start gap-sm">
              <input
                type="checkbox"
                id="log-data"
                defaultChecked
                className="mt-[2px] h-[18px] w-[18px] shrink-0 cursor-pointer accent-primary"
              />
              <label
                htmlFor="log-data"
                className="cursor-pointer text-base leading-normal text-neutral-800"
              >
                データの作成・更新・削除
              </label>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="h-[36px] rounded-md border-none bg-primary px-lg font-body text-sm font-[var(--weight-medium)] text-on-primary transition-[background-color] duration-[var(--transition-default)] hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          保存
        </button>
      </div>
    </section>
  );
}
