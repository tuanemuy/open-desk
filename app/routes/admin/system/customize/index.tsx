import { getFormProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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

export function meta(_args: Route.MetaArgs) {
  return [{ title: "JavaScript/CSSでカスタマイズ - OpenDeskシステム管理" }];
}

const schema = z.object({
  scope: z.enum(["all", "admin", "none"]),
});

export const handlers = {
  updateCustomize: defineHandler({
    schema,
    handler: async (_value, args) => {
      await requireAuth(args.request, container);
      return success();
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request, container);
  return { scope: "none" as "all" | "admin" | "none" };
}

const FILE_SECTIONS = [
  { id: "pc-js", label: "PC用のJavaScriptファイル" },
  { id: "sp-js", label: "スマートフォン用のJavaScriptファイル" },
  { id: "pc-css", label: "PC用のCSSファイル" },
  { id: "sp-css", label: "スマートフォン用のCSSファイル" },
];

export default function CustomizePage({ loaderData }: Route.ComponentProps) {
  const { scope: initialScope } = loaderData;
  const [scope, setScope] = useState(initialScope);

  const fetcher = useCompositeAction<typeof handlers>();

  const [form] = useForm({
    id: "customize-form",
    lastResult:
      fetcher.data?.intent === "updateCustomize" ? fetcher.data : undefined,
    constraint: getZodConstraint(schema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
  });

  fetcher.register("updateCustomize", {
    onSuccess: () => toast.success("設定を保存しました"),
    onHandlerError: ({ error }) =>
      toast.error(error?.[""]?.[0] ?? "保存に失敗しました"),
  });

  const isPending = fetcher.isPending("updateCustomize");

  return (
    <section>
      <h2 className="mb-lg border-b border-neutral-200 pb-md font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        JavaScript/CSSでカスタマイズ
      </h2>

      <fetcher.Form method="post" {...getFormProps(form)}>
        <input type="hidden" name="intent" value="updateCustomize" />

        <div className="mb-lg rounded-lg border border-neutral-200 bg-bg-card p-lg">
          <div className="mb-lg">
            <div className="mb-md text-sm font-[var(--weight-medium)] text-neutral-600">
              適用範囲
            </div>
            <div className="flex flex-col gap-sm">
              {[
                { value: "all" as const, label: "すべてのユーザー" },
                {
                  value: "admin" as const,
                  label: "OpenDeskシステム管理者だけ",
                },
                { value: "none" as const, label: "適用しない" },
              ].map((option) => (
                <label key={option.value} className="flex items-center gap-sm">
                  <input
                    type="radio"
                    name="scope"
                    value={option.value}
                    checked={scope === option.value}
                    onChange={() => setScope(option.value)}
                    className="h-4 w-4 cursor-pointer accent-primary"
                  />
                  <span className="cursor-pointer text-base text-neutral-800 select-none">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {FILE_SECTIONS.map((section) => (
            <div key={section.id} className="mb-lg last:mb-0">
              <div className="mb-sm text-sm font-[var(--weight-medium)] text-neutral-600">
                {section.label}
              </div>
              <div className="flex items-center gap-md">
                <button
                  type="button"
                  className="inline-flex h-9 items-center gap-sm rounded-md border border-neutral-200 bg-bg-card px-md font-body text-sm font-[var(--weight-medium)] text-neutral-700 transition-[border-color,background-color] duration-[var(--transition-default)] hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <Upload className="h-3.5 w-3.5" />
                  URL指定またはアップロード
                </button>
                <span className="text-xs text-neutral-400">最大20MB</span>
              </div>
            </div>
          ))}
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
            onClick={() => setScope(initialScope)}
            className="h-9 rounded-md border border-neutral-200 bg-bg-card px-md font-body text-sm font-[var(--weight-medium)] text-neutral-700 transition-[border-color,background-color] duration-[var(--transition-default)] hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            キャンセル
          </button>
        </div>
      </fetcher.Form>
    </section>
  );
}
