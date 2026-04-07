import { container } from "@/core/application/container/server.instance";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request, container);
  return {};
}

export function meta(_args: Route.MetaArgs) {
  return [{ title: "アクセス制限 - cybozu.com共通管理 - OpenDesk" }];
}

export default function NetworkSecurityPage(_props: Route.ComponentProps) {
  return (
    <section>
      <h2 className="mb-lg font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        アクセス制限
      </h2>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card p-lg">
        {/* IP Address Restriction */}
        <div className="mb-lg">
          <div className="mb-md border-b border-neutral-200 pb-sm font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
            IPアドレス制限
          </div>
          <div className="mb-md text-sm leading-normal text-neutral-500">
            接続元のIPアドレスによりアクセスを制限します。許可するIPアドレスまたはCIDRを1行に1つずつ入力してください。
          </div>
          <div className="mb-md flex items-start gap-sm">
            <input
              type="checkbox"
              id="ip-restriction"
              className="mt-[2px] h-[18px] w-[18px] shrink-0 cursor-pointer accent-primary"
            />
            <label
              htmlFor="ip-restriction"
              className="cursor-pointer text-base leading-normal text-neutral-800"
            >
              IPアドレス制限を有効にする
            </label>
          </div>
          <textarea
            rows={5}
            placeholder="例: 192.168.1.0/24"
            className="w-full rounded-sm border border-neutral-300 bg-bg-card p-md font-body text-sm text-neutral-800 outline-none transition-[border-color,box-shadow] duration-[var(--transition-default)] placeholder:text-neutral-400 focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-lighter)]"
          />
        </div>

        {/* Basic Authentication */}
        <div className="mb-lg">
          <div className="mb-md border-b border-neutral-200 pb-sm font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
            Basic認証
          </div>
          <div className="mb-md text-sm leading-normal text-neutral-500">
            制限されたIPアドレスからのアクセスに対してBasic認証を要求します。
          </div>
          <div className="flex items-start gap-sm">
            <input
              type="checkbox"
              id="basic-auth"
              className="mt-[2px] h-[18px] w-[18px] shrink-0 cursor-pointer accent-primary"
            />
            <label
              htmlFor="basic-auth"
              className="cursor-pointer text-base leading-normal text-neutral-800"
            >
              Basic認証を有効にする
            </label>
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
