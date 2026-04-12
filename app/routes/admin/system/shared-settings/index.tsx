import { getFormProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useState } from "react";
import { toast } from "sonner";
import { useCompositeAction } from "@/lib/compositeAction";
import type { Route } from "./+types/index";

import type { handlers } from "./action.server";
import { sharedSettingsSchema } from "./schemas";

export { action } from "./action.server";
export { loader } from "./loader.server";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "アプリの共通設定 - OpenDeskシステム管理" }];
}

export default function SharedSettingsPage({
  loaderData,
}: Route.ComponentProps) {
  const { prohibitEveryoneAdmin: initial } = loaderData;
  const [prohibitEveryoneAdmin, setProhibitEveryoneAdmin] = useState(initial);

  const fetcher = useCompositeAction<typeof handlers>();

  const [form] = useForm({
    id: "shared-settings-form",
    lastResult:
      fetcher.data?.intent === "updateSharedSettings"
        ? fetcher.data
        : undefined,
    constraint: getZodConstraint(sharedSettingsSchema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: sharedSettingsSchema });
    },
  });

  fetcher.register("updateSharedSettings", {
    onSuccess: () => toast.success("設定を保存しました"),
    onHandlerError: ({ error }) =>
      toast.error(error?.[""]?.[0] ?? "保存に失敗しました"),
  });

  const isPending = fetcher.isPending("updateSharedSettings");

  return (
    <section>
      <h2 className="mb-lg border-b border-neutral-200 pb-md font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        アプリの共通設定
      </h2>

      <fetcher.Form method="post" {...getFormProps(form)}>
        <input type="hidden" name="intent" value="updateSharedSettings" />

        <div className="mb-lg rounded-lg border border-neutral-200 bg-bg-card p-lg">
          <div className="flex items-center gap-md py-sm">
            <input
              type="checkbox"
              id="prohibit-everyone-admin"
              name="prohibitEveryoneAdmin"
              checked={prohibitEveryoneAdmin}
              onChange={() => setProhibitEveryoneAdmin(!prohibitEveryoneAdmin)}
              className="h-4 w-4 shrink-0 cursor-pointer accent-primary"
            />
            <label
              htmlFor="prohibit-everyone-admin"
              className="cursor-pointer text-base text-neutral-800 select-none"
            >
              Everyoneグループへのアプリ管理権限の付与を禁止する
            </label>
          </div>
          <p className="pl-[calc(var(--space-md)+16px)] text-sm text-neutral-500">
            アプリのアクセス権で Everyone
            グループに管理権限を付与することを禁止します。
          </p>
        </div>

        <div className="flex items-center gap-md">
          <button
            type="submit"
            disabled={isPending}
            className="h-9 rounded-md border-none bg-primary px-md font-body text-sm font-[var(--weight-medium)] text-on-primary transition-colors duration-[var(--transition-default)] hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
          >
            {isPending ? "保存中..." : "保存"}
          </button>
          <button
            type="button"
            onClick={() => setProhibitEveryoneAdmin(initial)}
            className="h-9 rounded-md border border-neutral-200 bg-bg-card px-md font-body text-sm font-[var(--weight-medium)] text-neutral-700 transition-[border-color,background-color] duration-[var(--transition-default)] hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            キャンセル
          </button>
        </div>
      </fetcher.Form>
    </section>
  );
}
