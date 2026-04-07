import { getFormProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { z } from "zod";
import { container } from "@/core/application/container/server.instance";
import {
  createCompositeAction,
  defineHandler,
  success,
  useCompositeAction,
} from "@/lib/compositeAction";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request, container);
  return {
    timezone: "Asia/Tokyo",
    language: "ja",
  };
}

const saveLocaleSchema = z.object({
  timezone: z.string().min(1),
  language: z.string().min(1),
});

export const handlers = {
  saveLocale: defineHandler({
    schema: saveLocaleSchema,
    handler: async (_value, args) => {
      await requireAuth(args.request, container);
      return success();
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}

export function meta(_args: Route.MetaArgs) {
  return [{ title: "ロケール - cybozu.com共通管理 - OpenDesk" }];
}

const SELECT_CLASSES =
  "h-[34px] min-w-[300px] cursor-pointer appearance-none rounded-sm border border-neutral-300 bg-bg-card bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[right_10px_center] bg-no-repeat px-md pr-xl font-body text-sm text-neutral-800 outline-none transition-[border-color,box-shadow] duration-[var(--transition-default)] hover:border-neutral-400 focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-lighter)]";

export default function LocalizationPage({ loaderData }: Route.ComponentProps) {
  const { timezone, language } = loaderData;
  const fetcher = useCompositeAction<typeof handlers>();
  const isPending = fetcher.isPending("saveLocale");

  const [form] = useForm({
    id: "locale-form",
    lastResult:
      fetcher.data?.intent === "saveLocale" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.saveLocale.schema),
    shouldValidate: "onSubmit",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: handlers.saveLocale.schema });
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
