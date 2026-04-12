import { getFormProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useCompositeAction } from "@/lib/compositeAction";
import type { Route } from "./+types/index";
import type { handlers } from "./action.server";
import { saveMiscSchema } from "./schemas";

export { action } from "./action.server";
export { loader } from "./loader.server";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "その他の設定 - cybozu.com共通管理 - OpenDesk" }];
}

export default function MiscSettingsPage({ loaderData }: Route.ComponentProps) {
  const { settings } = loaderData;
  const fetcher = useCompositeAction<typeof handlers>();
  const isPending = fetcher.isPending("saveMisc");

  const [form] = useForm({
    id: "misc-settings-form",
    lastResult: fetcher.data?.intent === "saveMisc" ? fetcher.data : undefined,
    constraint: getZodConstraint(saveMiscSchema),
    shouldValidate: "onSubmit",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: saveMiscSchema });
    },
  });

  return (
    <section>
      <h2 className="mb-lg font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        その他の設定
      </h2>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card p-lg">
        <fetcher.Form method="post" {...getFormProps(form)}>
          <input type="hidden" name="intent" value="saveMisc" />

          <div className="mb-md flex items-start gap-sm">
            <input
              type="checkbox"
              id="iframeEnabled"
              name="iframeEnabled"
              value="true"
              defaultChecked={settings.iframeEnabled}
              className="mt-[2px] h-[18px] w-[18px] shrink-0 cursor-pointer accent-primary"
            />
            <div>
              <label
                htmlFor="iframeEnabled"
                className="cursor-pointer text-base leading-normal text-neutral-800"
              >
                外部サイトへの埋め込み（iframe）を許可する
              </label>
              <div className="mt-[2px] text-xs text-neutral-400">
                cybozu.comのコンテンツを外部サイトに埋め込むことを許可します（クリックジャッキング/CSRFリスクあり）
              </div>
            </div>
          </div>

          <div className="mb-md flex items-start gap-sm">
            <input
              type="checkbox"
              id="referrerPolicyEnabled"
              name="referrerPolicyEnabled"
              value="true"
              defaultChecked={settings.referrerPolicyEnabled}
              className="mt-[2px] h-[18px] w-[18px] shrink-0 cursor-pointer accent-primary"
            />
            <div>
              <label
                htmlFor="referrerPolicyEnabled"
                className="cursor-pointer text-base leading-normal text-neutral-800"
              >
                Referrer-Policyヘッダーを付与する
              </label>
              <div className="mt-[2px] text-xs text-neutral-400">
                same-originポリシーを適用し、外部サイトへのリファラー送信を防ぎます
              </div>
            </div>
          </div>

          <div className="mb-lg flex items-start gap-sm">
            <input
              type="checkbox"
              id="webhookEnabled"
              name="webhookEnabled"
              value="true"
              defaultChecked={settings.webhookEnabled}
              className="mt-[2px] h-[18px] w-[18px] shrink-0 cursor-pointer accent-primary"
            />
            <div>
              <label
                htmlFor="webhookEnabled"
                className="cursor-pointer text-base leading-normal text-neutral-800"
              >
                Webhookの送信を許可する
              </label>
              <div className="mt-[2px] text-xs text-neutral-400">
                アプリのイベント発生時にWebhookを送信します
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
