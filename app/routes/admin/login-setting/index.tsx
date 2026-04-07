import { container } from "@/core/application/container/server.instance";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request, container);
  return {};
}

export function meta(_args: Route.MetaArgs) {
  return [{ title: "ログインページ - cybozu.com共通管理 - OpenDesk" }];
}

export default function LoginSettingPage(_props: Route.ComponentProps) {
  return (
    <section>
      <h2 className="mb-lg font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        ログインページ
      </h2>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card p-lg">
        <div className="mb-lg">
          <div className="mb-md border-b border-neutral-200 pb-sm font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
            タイトル
          </div>
          <input
            type="text"
            placeholder="ログインページのタイトル"
            className="h-[34px] w-full max-w-[400px] rounded-sm border border-neutral-300 bg-bg-card px-md font-body text-sm text-neutral-800 outline-none transition-[border-color,box-shadow] duration-[var(--transition-default)] placeholder:text-neutral-400 focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-lighter)]"
          />
        </div>

        <div className="mb-lg">
          <div className="mb-md border-b border-neutral-200 pb-sm font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
            背景画像
          </div>
          <p className="mb-md text-sm text-neutral-500">
            ログインページの背景画像を設定します。（最大5MB）
          </p>
          <input
            type="file"
            accept="image/*"
            className="text-sm text-neutral-600 file:mr-md file:h-[34px] file:cursor-pointer file:rounded-md file:border file:border-neutral-200 file:bg-bg-card file:px-lg file:font-body file:text-sm file:font-[var(--weight-medium)] file:text-neutral-700 file:transition-[border-color,background-color] file:duration-[var(--transition-default)] hover:file:border-neutral-300 hover:file:bg-neutral-50"
          />
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
