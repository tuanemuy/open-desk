import { getFormProps, getInputProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { toast } from "sonner";
import { z } from "zod";
import { useCompositeAction } from "@/lib/compositeAction";
import type { Route } from "./+types/index";

export { action } from "./action.server";
export { loader } from "./loader.server";

import type { handlers } from "./action.server";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "アプリ／スペースの復旧 - OpenDeskシステム管理" }];
}

const restoreAppSchema = z.object({
  appId: z.string().min(1, "アプリIDを入力してください"),
});

const restoreSpaceSchema = z.object({
  spaceId: z.string().min(1, "スペースIDを入力してください"),
});

export default function RestorePage(_props: Route.ComponentProps) {
  const fetcher = useCompositeAction<typeof handlers>();

  const [appForm, appFields] = useForm({
    id: "restore-app-form",
    lastResult:
      fetcher.data?.intent === "restoreApp" ? fetcher.data : undefined,
    constraint: getZodConstraint(restoreAppSchema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: restoreAppSchema });
    },
  });

  const [spaceForm, spaceFields] = useForm({
    id: "restore-space-form",
    lastResult:
      fetcher.data?.intent === "restoreSpace" ? fetcher.data : undefined,
    constraint: getZodConstraint(restoreSpaceSchema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: restoreSpaceSchema });
    },
  });

  fetcher.register("restoreApp", {
    onSuccess: ({ data }) =>
      toast.success(`アプリ ${data.appId} を復旧しました`),
    onHandlerError: ({ error }) =>
      toast.error(error?.appId?.[0] ?? "復旧に失敗しました"),
  });

  fetcher.register("restoreSpace", {
    onSuccess: () => toast.success("スペースを復旧しました"),
    onHandlerError: ({ error }) =>
      toast.error(error?.spaceId?.[0] ?? "復旧に失敗しました"),
  });

  return (
    <section>
      <h2 className="mb-lg border-b border-neutral-200 pb-md font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        アプリ／スペースの復旧
      </h2>
      <p className="mb-lg text-sm text-neutral-500">
        削除後14日以上経過したものは復旧できません。
      </p>

      {/* Restore App */}
      <div className="mb-lg rounded-lg border border-neutral-200 bg-bg-card p-lg">
        <h3 className="mb-md font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
          アプリの復旧
        </h3>
        <fetcher.Form method="post" {...getFormProps(appForm)}>
          <input type="hidden" name="intent" value="restoreApp" />
          <div className="mb-md flex items-end gap-md">
            <div className="flex-1">
              <label
                htmlFor={appFields.appId.id}
                className="mb-xs block text-sm font-[var(--weight-medium)] text-neutral-600"
              >
                アプリID
              </label>
              <input
                {...getInputProps(appFields.appId, { type: "text" })}
                placeholder="例: 123"
                className="h-9 w-full rounded-sm border border-neutral-300 bg-bg-card px-md font-body text-base text-neutral-800 outline-none transition-[border-color,box-shadow] duration-[var(--transition-default)] placeholder:text-neutral-400 focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-lighter)]"
              />
              {appFields.appId.errors && (
                <p className="mt-xs text-sm text-error">
                  {appFields.appId.errors}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={fetcher.isPending("restoreApp")}
              className="h-9 rounded-md border-none bg-primary px-md font-body text-sm font-[var(--weight-medium)] text-on-primary transition-colors duration-[var(--transition-default)] hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
            >
              {fetcher.isPending("restoreApp") ? "復旧中..." : "復旧"}
            </button>
          </div>
        </fetcher.Form>
      </div>

      {/* Restore Space */}
      <div className="rounded-lg border border-neutral-200 bg-bg-card p-lg">
        <h3 className="mb-md font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
          スペースの復旧
        </h3>
        <fetcher.Form method="post" {...getFormProps(spaceForm)}>
          <input type="hidden" name="intent" value="restoreSpace" />
          <div className="mb-md flex items-end gap-md">
            <div className="flex-1">
              <label
                htmlFor={spaceFields.spaceId.id}
                className="mb-xs block text-sm font-[var(--weight-medium)] text-neutral-600"
              >
                スペースID
              </label>
              <input
                {...getInputProps(spaceFields.spaceId, { type: "text" })}
                placeholder="例: 456"
                className="h-9 w-full rounded-sm border border-neutral-300 bg-bg-card px-md font-body text-base text-neutral-800 outline-none transition-[border-color,box-shadow] duration-[var(--transition-default)] placeholder:text-neutral-400 focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-lighter)]"
              />
              {spaceFields.spaceId.errors && (
                <p className="mt-xs text-sm text-error">
                  {spaceFields.spaceId.errors}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={fetcher.isPending("restoreSpace")}
              className="h-9 rounded-md border-none bg-primary px-md font-body text-sm font-[var(--weight-medium)] text-on-primary transition-colors duration-[var(--transition-default)] hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
            >
              {fetcher.isPending("restoreSpace") ? "復旧中..." : "復旧"}
            </button>
          </div>
        </fetcher.Form>
      </div>
    </section>
  );
}
