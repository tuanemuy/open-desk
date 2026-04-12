import { toast } from "sonner";
import { useCompositeAction } from "@/lib/compositeAction";
import type { Route } from "./+types/index";

import type { handlers } from "./action.server";

export { action } from "./action.server";
export type { ProvisioningLoaderData } from "./loader.server";
export { loader } from "./loader.server";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "プロビジョニング - cybozu.com共通管理 - OpenDesk" }];
}

export default function ProvisioningPage({ loaderData }: Route.ComponentProps) {
  const { config } = loaderData;
  const fetcher = useCompositeAction<typeof handlers>();

  fetcher.register("updateProvisioning", {
    onSuccess: () => toast.success("プロビジョニング設定を保存しました"),
    onHandlerError: ({ error }) =>
      toast.error(error?.[""]?.[0] ?? "保存に失敗しました"),
  });

  const isPending = fetcher.isPending("updateProvisioning");

  return (
    <section>
      <h2 className="mb-lg font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        プロビジョニング
      </h2>
      <p className="mb-lg text-sm text-neutral-500">
        外部のIDプロバイダーからユーザーや組織の情報を自動同期するためのSCIM設定を管理します。
      </p>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card p-lg">
        <fetcher.Form method="post">
          <input type="hidden" name="intent" value="updateProvisioning" />

          <div className="mb-lg">
            <div className="mb-md border-b border-neutral-200 pb-sm font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
              SCIM設定
            </div>
            <div className="mb-md flex items-start gap-sm">
              <input
                type="checkbox"
                id="scim-enabled"
                name="isEnabled"
                defaultChecked={config.isEnabled}
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
                {config.hasToken ? (
                  <span className="text-sm text-neutral-800">
                    発行済み
                    {config.tokenIssuedAt
                      ? `（${config.tokenIssuedAt.toLocaleDateString("ja-JP")}）`
                      : ""}
                  </span>
                ) : (
                  <span className="text-sm text-neutral-400">未発行</span>
                )}
              </div>
            </div>
          </div>

          <div className="mb-lg">
            <div className="mb-md border-b border-neutral-200 pb-sm font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
              トークン管理
            </div>
            <div className="flex items-start gap-sm">
              <input
                type="checkbox"
                id="regenerate-token"
                name="regenerateToken"
                className="mt-[2px] h-[18px] w-[18px] shrink-0 cursor-pointer accent-primary"
              />
              <div>
                <label
                  htmlFor="regenerate-token"
                  className="cursor-pointer text-base leading-normal text-neutral-800"
                >
                  認証トークンを再発行する
                </label>
                <div className="mt-[2px] text-xs text-neutral-400">
                  チェックすると保存時に新しいトークンが生成されます
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="h-[36px] rounded-md border-none bg-primary px-lg font-body text-sm font-[var(--weight-medium)] text-on-primary transition-[background-color] duration-[var(--transition-default)] hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
          >
            {isPending ? "保存中..." : "保存"}
          </button>
        </fetcher.Form>
      </div>
    </section>
  );
}
