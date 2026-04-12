import { getFormProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useCompositeAction } from "@/lib/compositeAction";
import type { Route } from "./+types/index";
import type { handlers } from "./action.server";

export { action } from "./action.server";
export { loader } from "./loader.server";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "ヘッダーの色 - OpenDeskシステム管理" }];
}

const PRESET_COLORS = [
  "#ffcc00",
  "#4a90d9",
  "#5b6ae0",
  "#16a34a",
  "#dc2626",
  "#d97706",
  "#1f2937",
  "#7c3aed",
  "#db2777",
  "#0891b2",
  "#f8f9fa",
];

const colorSchema = z.object({
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "有効なHEXカラーコードを入力してください"),
});

export default function HeaderColorPage({ loaderData }: Route.ComponentProps) {
  const { currentColor } = loaderData;
  const [color, setColor] = useState(currentColor);

  const fetcher = useCompositeAction<typeof handlers>();

  const [form] = useForm({
    id: "header-color-form",
    lastResult:
      fetcher.data?.intent === "updateHeaderColor" ? fetcher.data : undefined,
    constraint: getZodConstraint(colorSchema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: colorSchema });
    },
  });

  fetcher.register("updateHeaderColor", {
    onSuccess: () => toast.success("ヘッダーの色を更新しました"),
    onHandlerError: ({ error }) =>
      toast.error(error?.[""]?.[0] ?? "更新に失敗しました"),
  });

  const isPending = fetcher.isPending("updateHeaderColor");

  const handleColorInput = (value: string) => {
    setColor(value);
  };

  const handlePresetClick = (presetColor: string) => {
    setColor(presetColor);
  };

  return (
    <section>
      <h2 className="mb-lg border-b border-neutral-200 pb-md font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        ヘッダーの色
      </h2>

      <fetcher.Form method="post" {...getFormProps(form)}>
        <input type="hidden" name="intent" value="updateHeaderColor" />
        <input type="hidden" name="color" value={color} />

        <div className="mb-lg">
          {/* Color input row */}
          <div className="mb-lg flex items-center gap-md">
            <span className="shrink-0 text-sm font-[var(--weight-medium)] text-neutral-600">
              HEXコード
            </span>
            <div
              className="h-9 w-9 shrink-0 rounded-sm border border-neutral-200"
              style={{ background: color }}
            />
            <input
              type="text"
              value={color}
              onChange={(e) => handleColorInput(e.target.value)}
              className="h-9 w-[140px] rounded-sm border border-neutral-300 bg-bg-card px-md font-body text-base text-neutral-800 outline-none transition-[border-color,box-shadow] duration-[var(--transition-default)] focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-lighter)]"
            />
          </div>

          {/* Preset colors */}
          <div className="mb-sm text-sm font-[var(--weight-medium)] text-neutral-600">
            プリセットカラー
          </div>
          <div className="mb-lg flex flex-wrap gap-md">
            {PRESET_COLORS.map((presetColor) => (
              <button
                key={presetColor}
                type="button"
                onClick={() => handlePresetClick(presetColor)}
                className={`h-8 w-8 shrink-0 cursor-pointer rounded-full border-2 transition-[transform,box-shadow] duration-[var(--transition-default)] hover:scale-110 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  color === presetColor
                    ? "border-primary shadow-[0_0_0_2px_var(--color-primary-lighter)]"
                    : "border-transparent"
                }`}
                style={{ background: presetColor }}
                title={presetColor}
              />
            ))}
          </div>

          {/* Header preview */}
          <div className="rounded-lg border border-neutral-200 bg-bg-card p-lg">
            <div className="mb-md text-sm font-[var(--weight-medium)] text-neutral-600">
              プレビュー
            </div>
            <div
              className="flex h-14 items-center gap-xl rounded-md px-xl"
              style={{ background: color }}
            >
              <span className="font-heading text-lg font-[var(--weight-semibold)] text-on-primary opacity-95">
                OpenDesk
              </span>
              <div className="flex gap-md">
                <span className="text-sm text-on-primary opacity-80">
                  ポータル
                </span>
                <span className="text-sm text-on-primary opacity-80">通知</span>
                <span className="text-sm text-on-primary opacity-80">
                  ブックマーク
                </span>
              </div>
              <div className="ml-auto h-7 w-7 rounded-full bg-on-primary opacity-30" />
            </div>
          </div>
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
            onClick={() => setColor(currentColor)}
            className="h-9 rounded-md border border-neutral-200 bg-bg-card px-md font-body text-sm font-[var(--weight-medium)] text-neutral-700 transition-[border-color,background-color] duration-[var(--transition-default)] hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            キャンセル
          </button>
        </div>
      </fetcher.Form>
    </section>
  );
}
