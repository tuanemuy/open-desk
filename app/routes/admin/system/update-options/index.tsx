import { getFormProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useCompositeAction } from "@/lib/compositeAction";
import type { Route } from "./+types/index";

export { action } from "./action.server";
export { loader } from "./loader.server";

import type { handlers } from "./action.server";

type FeatureOption = {
  id: string;
  label: string;
  enabled: boolean;
  expiry: string | null;
};

export function meta(_args: Route.MetaArgs) {
  return [{ title: "アップデートオプション - OpenDeskシステム管理" }];
}

const schema = z.object({
  channel: z.enum(["latest", "monthly"]),
});

export default function UpdateOptionsPage({
  loaderData,
}: Route.ComponentProps) {
  const {
    channel: initialChannel,
    monthlyFeatures,
    latestFeatures,
    previewFeatures,
    experimentalFeatures,
    apiLab,
  } = loaderData;
  const [channel, setChannel] = useState(initialChannel);

  const fetcher = useCompositeAction<typeof handlers>();

  const [form] = useForm({
    id: "update-options-form",
    lastResult:
      fetcher.data?.intent === "updateOptions" ? fetcher.data : undefined,
    constraint: getZodConstraint(schema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
  });

  fetcher.register("updateOptions", {
    onSuccess: () => toast.success("設定を保存しました"),
    onHandlerError: ({ error }) =>
      toast.error(error?.[""]?.[0] ?? "保存に失敗しました"),
  });

  const isPending = fetcher.isPending("updateOptions");

  const renderFeatureList = (title: string, features: FeatureOption[]) => {
    if (features.length === 0) return null;
    return (
      <div className="mb-lg">
        <h3 className="mb-md font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
          {title}
        </h3>
        <div className="rounded-lg border border-neutral-200 bg-bg-card p-lg">
          {features.map((feature) => (
            <div key={feature.id} className="flex items-center gap-md py-sm">
              <input
                type="checkbox"
                id={`feature-${feature.id}`}
                defaultChecked={feature.enabled}
                className="h-4 w-4 shrink-0 cursor-pointer accent-primary"
              />
              <label
                htmlFor={`feature-${feature.id}`}
                className="cursor-pointer text-base text-neutral-800 select-none"
              >
                {feature.label}
              </label>
              {feature.expiry && (
                <span className="text-xs text-neutral-400">
                  ({feature.expiry}まで)
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <section>
      <h2 className="mb-lg border-b border-neutral-200 pb-md font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        アップデートオプション
      </h2>

      <fetcher.Form method="post" {...getFormProps(form)}>
        <input type="hidden" name="intent" value="updateOptions" />

        <div className="mb-lg">
          <h3 className="mb-md font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
            アップデートチャネルの選択
          </h3>
          <div className="rounded-lg border border-neutral-200 bg-bg-card p-lg">
            <div className="flex flex-col gap-sm">
              <label className="flex items-center gap-sm">
                <input
                  type="radio"
                  name="channel"
                  value="latest"
                  checked={channel === "latest"}
                  onChange={() => setChannel("latest")}
                  className="h-4 w-4 cursor-pointer accent-primary"
                />
                <span className="cursor-pointer text-base text-neutral-800 select-none">
                  最新チャネル（デフォルト）
                </span>
              </label>
              <label className="flex items-center gap-sm">
                <input
                  type="radio"
                  name="channel"
                  value="monthly"
                  checked={channel === "monthly"}
                  onChange={() => setChannel("monthly")}
                  className="h-4 w-4 cursor-pointer accent-primary"
                />
                <span className="cursor-pointer text-base text-neutral-800 select-none">
                  月例チャネル
                </span>
              </label>
            </div>
          </div>
        </div>

        {renderFeatureList("新機能の無効化", monthlyFeatures)}
        {renderFeatureList(
          "新機能の無効化（最新チャネル限定）",
          latestFeatures,
        )}
        {renderFeatureList("リリース予定の新機能の先行利用", previewFeatures)}
        {renderFeatureList("検討中の新機能", experimentalFeatures)}
        {renderFeatureList("API ラボ", apiLab)}

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
            onClick={() => setChannel(initialChannel)}
            className="h-9 rounded-md border border-neutral-200 bg-bg-card px-md font-body text-sm font-[var(--weight-medium)] text-neutral-700 transition-[border-color,background-color] duration-[var(--transition-default)] hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            キャンセル
          </button>
        </div>
      </fetcher.Form>
    </section>
  );
}
