import { getFormProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { SELECT_CLASSES } from "@/lib/admin";
import { useCompositeAction } from "@/lib/compositeAction";
import type { Route } from "./+types/index";
import { saveLocaleSchema } from "./schemas";

export { action } from "./action.server";
export { loader } from "./loader.server";

import type { handlers } from "./action.server";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "ロケール - cybozu.com共通管理 - OpenDesk" }];
}

export default function LocalizationPage({ loaderData }: Route.ComponentProps) {
  const { timezone, language } = loaderData;
  const fetcher = useCompositeAction<typeof handlers>();
  const isPending = fetcher.isPending("saveLocale");

  const [form] = useForm({
    id: "locale-form",
    lastResult:
      fetcher.data?.intent === "saveLocale" ? fetcher.data : undefined,
    constraint: getZodConstraint(saveLocaleSchema),
    shouldValidate: "onSubmit",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: saveLocaleSchema });
    },
  });

  return (
    <section>
      <h2 className="mb-lg font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        ロケール
      </h2>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card p-lg">
        <fetcher.Form method="post" {...getFormProps(form)}>
          <input type="hidden" name="intent" value="saveLocale" />

          <div className="mb-md flex items-center gap-md">
            <label
              htmlFor="locale-timezone"
              className="min-w-[200px] shrink-0 text-sm font-[var(--weight-medium)] text-neutral-600"
            >
              タイムゾーン
            </label>
            <select
              id="locale-timezone"
              name="timezone"
              defaultValue={timezone}
              className={SELECT_CLASSES}
            >
              <option value="Pacific/Midway">(UTC-11:00) ミッドウェー島</option>
              <option value="Pacific/Honolulu">(UTC-10:00) ハワイ</option>
              <option value="America/Anchorage">(UTC-09:00) アラスカ</option>
              <option value="America/Los_Angeles">
                (UTC-08:00) 太平洋標準時
              </option>
              <option value="America/Denver">(UTC-07:00) 山岳部標準時</option>
              <option value="America/Chicago">(UTC-06:00) 中部標準時</option>
              <option value="America/New_York">(UTC-05:00) 東部標準時</option>
              <option value="Europe/London">(UTC+00:00) ロンドン</option>
              <option value="Europe/Paris">(UTC+01:00) パリ</option>
              <option value="Asia/Shanghai">(UTC+08:00) 北京</option>
              <option value="Asia/Tokyo">(UTC+09:00) 大阪、札幌、東京</option>
              <option value="Australia/Sydney">(UTC+10:00) シドニー</option>
              <option value="Pacific/Auckland">(UTC+12:00) オークランド</option>
            </select>
          </div>

          <div className="mb-lg flex items-center gap-md">
            <label
              htmlFor="locale-language"
              className="min-w-[200px] shrink-0 text-sm font-[var(--weight-medium)] text-neutral-600"
            >
              言語
            </label>
            <select
              id="locale-language"
              name="language"
              defaultValue={language}
              className={SELECT_CLASSES}
            >
              <option value="ja">日本語</option>
              <option value="en">English (US)</option>
              <option value="zh-CN">中文 (简体)</option>
              <option value="zh-TW">中文 (繁體)</option>
              <option value="es">Espanol</option>
              <option value="pt-BR">Portugues (Brasil)</option>
              <option value="th">Thai</option>
            </select>
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
