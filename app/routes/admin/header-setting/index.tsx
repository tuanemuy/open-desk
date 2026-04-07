import { getFormProps, useForm } from "@conform-to/react";
import { toast } from "sonner";
import { container } from "@/core/application/container/server.instance";
import { useCompositeAction } from "@/lib/compositeAction";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";
import type { handlers } from "./action";

export { action } from "./action";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request, container);
  return {};
}

export function meta(_args: Route.MetaArgs) {
  return [{ title: "ロゴ - cybozu.com共通管理 - OpenDesk" }];
}

export default function HeaderSettingPage(_props: Route.ComponentProps) {
  const fetcher = useCompositeAction<typeof handlers>();

  const [form] = useForm({
    id: "header-setting-form",
    lastResult:
      fetcher.data?.intent === "updateHeaderSetting" ? fetcher.data : undefined,
    shouldValidate: "onSubmit",
  });

  fetcher.register("updateHeaderSetting", {
    onSuccess: () => toast.success("ロゴ設定を保存しました"),
    onHandlerError: ({ error }) =>
      toast.error(error?.[""]?.[0] ?? "保存に失敗しました"),
  });

  const isPending = fetcher.isPending("updateHeaderSetting");

  return (
    <section>
      <h2 className="mb-lg font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        ロゴ
      </h2>

      <fetcher.Form
        method="post"
        encType="multipart/form-data"
        {...getFormProps(form)}
      >
        <input type="hidden" name="intent" value="updateHeaderSetting" />
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card p-lg">
          <div className="mb-lg">
            <div className="mb-md border-b border-neutral-200 pb-sm font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
              画像ファイル
            </div>
            <p className="mb-md text-sm text-neutral-500">
              画面左上に表示されるロゴ画像を設定します。（最大800KB）
            </p>
            <input
              type="file"
              name="logoImage"
              accept="image/*"
              className="text-sm text-neutral-600 file:mr-md file:h-[34px] file:cursor-pointer file:rounded-md file:border file:border-neutral-200 file:bg-bg-card file:px-lg file:font-body file:text-sm file:font-[var(--weight-medium)] file:text-neutral-700 file:transition-[border-color,background-color] file:duration-[var(--transition-default)] hover:file:border-neutral-300 hover:file:bg-neutral-50"
            />
          </div>

          <div className="mb-lg">
            <div className="mb-md border-b border-neutral-200 pb-sm font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
              URL
            </div>
            <p className="mb-md text-sm text-neutral-500">
              ロゴをクリックした際のリンク先URLを設定します。
            </p>
            <input
              type="url"
              name="logoUrl"
              placeholder="https://example.com"
              className="h-[34px] w-full max-w-[400px] rounded-sm border border-neutral-300 bg-bg-card px-md font-body text-sm text-neutral-800 outline-none transition-[border-color,box-shadow] duration-[var(--transition-default)] placeholder:text-neutral-400 focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-lighter)]"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="h-[36px] rounded-md border-none bg-primary px-lg font-body text-sm font-[var(--weight-medium)] text-on-primary transition-[background-color] duration-[var(--transition-default)] hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
          >
            {isPending ? "保存中..." : "保存"}
          </button>
        </div>
      </fetcher.Form>
    </section>
  );
}
