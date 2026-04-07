import { container } from "@/core/application/container/server.instance";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request, container);
  return {};
}

export function meta(_args: Route.MetaArgs) {
  return [{ title: "組織間のアクセス権 - cybozu.com共通管理 - OpenDesk" }];
}

export default function OrgAccessControlPage(_props: Route.ComponentProps) {
  return (
    <section>
      <h2 className="mb-lg font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        組織間のアクセス権
      </h2>
      <p className="mb-lg text-sm text-neutral-500">
        組織間でのデータアクセス権限を設定します。
      </p>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card p-lg">
        <div className="mb-md flex items-start gap-sm">
          <input
            type="checkbox"
            id="org-access"
            className="mt-[2px] h-[18px] w-[18px] shrink-0 cursor-pointer accent-primary"
          />
          <div>
            <label
              htmlFor="org-access"
              className="cursor-pointer text-base leading-normal text-neutral-800"
            >
              組織間のアクセスを制限する
            </label>
            <div className="mt-[2px] text-xs text-neutral-400">
              有効にすると、ユーザーは自分が所属する組織のデータのみアクセスできます
            </div>
          </div>
        </div>

        <div className="mt-lg">
          <button
            type="button"
            className="h-[36px] rounded-md border-none bg-primary px-lg font-body text-sm font-[var(--weight-medium)] text-on-primary transition-[background-color] duration-[var(--transition-default)] hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            保存
          </button>
        </div>
      </div>
    </section>
  );
}
