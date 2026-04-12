import { getFormProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { toast } from "sonner";
import { useCompositeAction } from "@/lib/compositeAction";
import type { Route } from "./+types/index";
import type { handlers } from "./action.server";
import { updateMailSettingsSchema } from "./schemas";

export { action } from "./action.server";
export { loader } from "./loader.server";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "システムメール - cybozu.com共通管理 - OpenDesk" }];
}

export default function SystemMailPage({ loaderData }: Route.ComponentProps) {
  const { fromAddress, serverType } = loaderData;
  const fetcher = useCompositeAction<typeof handlers>();

  const [form, fields] = useForm({
    id: "mail-settings-form",
    defaultValue: { serverType },
    lastResult:
      fetcher.data?.intent === "updateMailSettings" ? fetcher.data : undefined,
    constraint: getZodConstraint(updateMailSettingsSchema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: updateMailSettingsSchema });
    },
  });

  fetcher.register("updateMailSettings", {
    onSuccess: () => toast.success("メール設定を保存しました"),
    onHandlerError: ({ error }) =>
      toast.error(error?.[""]?.[0] ?? "保存に失敗しました"),
  });

  const isPending = fetcher.isPending("updateMailSettings");

  return (
    <section>
      <h2 className="mb-lg font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        システムメール
      </h2>

      <fetcher.Form method="post" {...getFormProps(form)}>
        <input type="hidden" name="intent" value="updateMailSettings" />
        <input type="hidden" name="fromAddress" value={fromAddress} />
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card p-lg">
          <div className="mb-lg">
            <div className="mb-md border-b border-neutral-200 pb-sm font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
              メール設定
            </div>
            <div className="mb-md flex items-center gap-md">
              <span className="min-w-[200px] shrink-0 text-sm font-[var(--weight-medium)] text-neutral-600">
                システムメールアドレス
              </span>
              <span className="text-sm text-neutral-800">{fromAddress}</span>
            </div>
          </div>

          <div className="mb-lg">
            <div className="mb-md border-b border-neutral-200 pb-sm font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
              メールサーバー
            </div>
            <div className="flex flex-col gap-md">
              <label className="flex cursor-pointer items-center gap-sm">
                <input
                  type="radio"
                  name={fields.serverType.name}
                  value="BUILTIN"
                  defaultChecked={serverType === "BUILTIN"}
                  className="h-[18px] w-[18px] shrink-0 cursor-pointer accent-primary"
                />
                <span className="text-base text-neutral-800">組み込み</span>
              </label>
              <label className="flex cursor-pointer items-center gap-sm">
                <input
                  type="radio"
                  name={fields.serverType.name}
                  value="EXTERNAL"
                  defaultChecked={serverType === "EXTERNAL"}
                  className="h-[18px] w-[18px] shrink-0 cursor-pointer accent-primary"
                />
                <span className="text-base text-neutral-800">外部サーバー</span>
              </label>
            </div>
          </div>

          <div className="mb-lg">
            <div className="mb-md border-b border-neutral-200 pb-sm font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
              テストメールの送信
            </div>
            <div className="flex items-center gap-md">
              <input
                type="email"
                placeholder="テスト送信先メールアドレス"
                className="h-[34px] min-w-[300px] rounded-sm border border-neutral-300 bg-bg-card px-md font-body text-sm text-neutral-800 outline-none transition-[border-color,box-shadow] duration-[var(--transition-default)] placeholder:text-neutral-400 focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-lighter)]"
              />
              <button
                type="button"
                className="h-[36px] rounded-md border border-neutral-200 bg-bg-card px-lg font-body text-sm font-[var(--weight-medium)] text-neutral-700 transition-[border-color,background-color] duration-[var(--transition-default)] hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                テスト送信
              </button>
            </div>
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
