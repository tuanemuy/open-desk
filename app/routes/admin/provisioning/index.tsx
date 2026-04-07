import { container } from "@/core/application/container/server.instance";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request, container);
  return {};
}

export function meta(_args: Route.MetaArgs) {
  return [{ title: "プロビジョニング - cybozu.com共通管理 - OpenDesk" }];
}

export default function ProvisioningPage(_props: Route.ComponentProps) {
  return (
    <section>
      <h2 className="mb-lg font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        プロビジョニング
      </h2>
      <p className="mb-lg text-sm text-neutral-500">
        外部のIDプロバイダーからユーザーや組織の情報を自動同期するためのSCIM設定を管理します。
      </p>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card p-lg">
        <div className="mb-lg">
          <div className="mb-md border-b border-neutral-200 pb-sm font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
            SCIM設定
          </div>
          <div className="mb-md flex items-start gap-sm">
            <input
              type="checkbox"
              id="scim-enabled"
              className="mt-[2px] h-[18px] w-[18px] shrink-0 cursor-pointer accent-primary"
            />
            <div>
              <label
                htmlFor="scim-enabled"
                className="cursor-pointer text-base leading-normal text-neutral-800"
              >
                SCIMプロビジョニングを有効にする
              </label>
              <div className="mt-[2px] text-xs text-neutral-400">
                外部のIDプロバイダーからユーザーや組織情報を自動的に同期します
              </div>
            </div>
          </div>
        </div>

        <div className="mb-lg">
          <div className="mb-md border-b border-neutral-200 pb-sm font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
            エンドポイント情報
          </div>
          <div className="flex flex-col gap-md">
            <div className="flex items-center gap-md">
              <span className="min-w-[160px] shrink-0 text-sm font-[var(--weight-medium)] text-neutral-600">
                SCIM URL
              </span>
              <span className="text-sm text-neutral-800">
                https://example.cybozu.com/scim/v2
              </span>
            </div>
            <div className="flex items-center gap-md">
              <span className="min-w-[160px] shrink-0 text-sm font-[var(--weight-medium)] text-neutral-600">
                認証トークン
              </span>
              <span className="text-sm text-neutral-400">未発行</span>
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
