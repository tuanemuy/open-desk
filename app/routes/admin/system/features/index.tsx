import { getFormProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { useState } from "react";
import { toast } from "sonner";
import { useCompositeAction } from "@/lib/compositeAction";
import type { Route } from "./+types/index";
import type { handlers } from "./action.server";
import type { FeatureSettings } from "./loader.server";
import { updateFeaturesSchema } from "./schemas";

export { action } from "./action.server";
export { loader } from "./loader.server";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "利用する機能の選択 - OpenDeskシステム管理" }];
}

export default function FeaturesPage({ loaderData }: Route.ComponentProps) {
  const { features: initial } = loaderData;
  const [features, setFeatures] = useState<FeatureSettings>(initial);

  const fetcher = useCompositeAction<typeof handlers>();

  const [form] = useForm({
    id: "features-form",
    lastResult:
      fetcher.data?.intent === "updateFeatures" ? fetcher.data : undefined,
    constraint: getZodConstraint(updateFeaturesSchema),
    shouldValidate: "onSubmit",
    shouldRevalidate: "onBlur",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: updateFeaturesSchema });
    },
  });

  fetcher.register("updateFeatures", {
    onSuccess: () => toast.success("設定を保存しました"),
    onHandlerError: ({ error }) =>
      toast.error(error?.[""]?.[0] ?? "保存に失敗しました"),
  });

  const isPending = fetcher.isPending("updateFeatures");

  const toggle = (key: keyof FeatureSettings) => {
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <section>
      <h2 className="mb-lg border-b border-neutral-200 pb-md font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        利用する機能の選択
      </h2>

      <fetcher.Form method="post" {...getFormProps(form)}>
        <input type="hidden" name="intent" value="updateFeatures" />

        <div className="mb-lg rounded-lg border border-neutral-200 bg-bg-card p-lg">
          {/* Email Notifications */}
          <div className="mb-lg">
            <div className="mb-md border-b border-neutral-200 pb-sm text-base font-[var(--weight-semibold)] text-neutral-700">
              メール通知
            </div>

            <div className="flex items-center gap-md py-sm">
              <input
                type="checkbox"
                id="feat-email"
                name="emailEnabled"
                checked={features.emailEnabled}
                onChange={() => toggle("emailEnabled")}
                className="h-4 w-4 shrink-0 cursor-pointer accent-primary"
              />
              <label
                htmlFor="feat-email"
                className="cursor-pointer text-base text-neutral-800 select-none"
              >
                通知のメール送信機能を利用する
              </label>
            </div>

            <div className="pl-[calc(var(--space-md)+16px+var(--space-md))]">
              <div className="mb-sm text-sm font-[var(--weight-medium)] text-neutral-600">
                受信設定の既定値
              </div>
              <div className="mb-sm flex flex-col gap-sm">
                <label className="flex items-center gap-sm">
                  <input
                    type="radio"
                    name="emailDefaultReceive"
                    value="self"
                    checked={features.emailDefaultReceive === "self"}
                    onChange={() =>
                      setFeatures((p) => ({
                        ...p,
                        emailDefaultReceive: "self",
                      }))
                    }
                    className="h-4 w-4 cursor-pointer accent-primary"
                  />
                  <span className="cursor-pointer text-sm text-neutral-600 select-none">
                    受信する（自分宛のみ）
                  </span>
                </label>
                <label className="flex items-center gap-sm">
                  <input
                    type="radio"
                    name="emailDefaultReceive"
                    value="none"
                    checked={features.emailDefaultReceive === "none"}
                    onChange={() =>
                      setFeatures((p) => ({
                        ...p,
                        emailDefaultReceive: "none",
                      }))
                    }
                    className="h-4 w-4 cursor-pointer accent-primary"
                  />
                  <span className="cursor-pointer text-sm text-neutral-600 select-none">
                    受信しない
                  </span>
                </label>
              </div>
            </div>

            <div className="pl-[calc(var(--space-md)+16px+var(--space-md))]">
              <div className="mb-sm text-sm font-[var(--weight-medium)] text-neutral-600">
                メール通知の形式
              </div>
              <div className="mb-sm flex flex-col gap-sm">
                <label className="flex items-center gap-sm">
                  <input
                    type="radio"
                    name="emailFormat"
                    value="html"
                    checked={features.emailFormat === "html"}
                    onChange={() =>
                      setFeatures((p) => ({ ...p, emailFormat: "html" }))
                    }
                    className="h-4 w-4 cursor-pointer accent-primary"
                  />
                  <span className="cursor-pointer text-sm text-neutral-600 select-none">
                    HTML形式
                  </span>
                </label>
                <label className="flex items-center gap-sm">
                  <input
                    type="radio"
                    name="emailFormat"
                    value="text"
                    checked={features.emailFormat === "text"}
                    onChange={() =>
                      setFeatures((p) => ({ ...p, emailFormat: "text" }))
                    }
                    className="h-4 w-4 cursor-pointer accent-primary"
                  />
                  <span className="cursor-pointer text-sm text-neutral-600 select-none">
                    テキスト形式
                  </span>
                </label>
              </div>
            </div>

            <div className="pl-[calc(var(--space-md)+16px+var(--space-md))]">
              <div className="mt-xs flex items-center gap-md py-xs">
                <input
                  type="checkbox"
                  id="feat-email-personal"
                  name="emailPersonalChange"
                  checked={features.emailPersonalChange}
                  onChange={() => toggle("emailPersonalChange")}
                  className="h-4 w-4 shrink-0 cursor-pointer accent-primary"
                />
                <label
                  htmlFor="feat-email-personal"
                  className="cursor-pointer text-sm text-neutral-600 select-none"
                >
                  個人設定による変更を許可する
                </label>
              </div>
            </div>

            <div className="pl-[calc(var(--space-md)+16px+var(--space-md))]">
              <div className="mt-xs flex items-center gap-md py-xs">
                <input
                  type="checkbox"
                  id="feat-email-api"
                  name="emailApiNotify"
                  checked={features.emailApiNotify}
                  onChange={() => toggle("emailApiNotify")}
                  className="h-4 w-4 shrink-0 cursor-pointer accent-primary"
                />
                <label
                  htmlFor="feat-email-api"
                  className="cursor-pointer text-sm text-neutral-600 select-none"
                >
                  REST APIの通知をメールで送信
                </label>
              </div>
            </div>
          </div>

          {/* Space */}
          <div className="mb-lg">
            <div className="mb-md border-b border-neutral-200 pb-sm text-base font-[var(--weight-semibold)] text-neutral-700">
              スペース
            </div>

            <div className="flex items-center gap-md py-sm">
              <input
                type="checkbox"
                id="feat-space"
                name="spaceEnabled"
                checked={features.spaceEnabled}
                onChange={() => toggle("spaceEnabled")}
                className="h-4 w-4 shrink-0 cursor-pointer accent-primary"
              />
              <label
                htmlFor="feat-space"
                className="cursor-pointer text-base text-neutral-800 select-none"
              >
                スペース機能を利用する
              </label>
            </div>

            <div className="pl-[calc(var(--space-md)+16px+var(--space-md))]">
              <div className="mt-xs flex items-center gap-md py-xs">
                <input
                  type="checkbox"
                  id="feat-space-standalone"
                  name="spaceStandaloneApp"
                  checked={features.spaceStandaloneApp}
                  onChange={() => toggle("spaceStandaloneApp")}
                  className="h-4 w-4 shrink-0 cursor-pointer accent-primary"
                />
                <label
                  htmlFor="feat-space-standalone"
                  className="cursor-pointer text-sm text-neutral-600 select-none"
                >
                  スペースに所属しないアプリの作成を許可する
                </label>
              </div>
            </div>

            <div className="mt-xs flex items-center gap-md py-sm">
              <input
                type="checkbox"
                id="feat-guest-space"
                name="guestSpaceEnabled"
                checked={features.guestSpaceEnabled}
                onChange={() => toggle("guestSpaceEnabled")}
                className="h-4 w-4 shrink-0 cursor-pointer accent-primary"
              />
              <label
                htmlFor="feat-guest-space"
                className="cursor-pointer text-base text-neutral-800 select-none"
              >
                ゲストスペース機能を利用する
              </label>
            </div>
          </div>

          {/* Communication */}
          <div className="mb-lg">
            <div className="mb-md border-b border-neutral-200 pb-sm text-base font-[var(--weight-semibold)] text-neutral-700">
              コミュニケーション
            </div>

            <div className="flex items-center gap-md py-sm">
              <input
                type="checkbox"
                id="feat-people"
                name="peopleMessageEnabled"
                checked={features.peopleMessageEnabled}
                onChange={() => toggle("peopleMessageEnabled")}
                className="h-4 w-4 shrink-0 cursor-pointer accent-primary"
              />
              <label
                htmlFor="feat-people"
                className="cursor-pointer text-base text-neutral-800 select-none"
              >
                ピープル機能とメッセージ機能を利用する
              </label>
            </div>
          </div>

          {/* Dashboard */}
          <div>
            <div className="mb-md border-b border-neutral-200 pb-sm text-base font-[var(--weight-semibold)] text-neutral-700">
              ダッシュボード
            </div>

            <div className="flex items-center gap-md py-sm">
              <input
                type="checkbox"
                id="feat-dashboard"
                name="dashboardEnabled"
                checked={features.dashboardEnabled}
                onChange={() => toggle("dashboardEnabled")}
                className="h-4 w-4 shrink-0 cursor-pointer accent-primary"
              />
              <label
                htmlFor="feat-dashboard"
                className="cursor-pointer text-base text-neutral-800 select-none"
              >
                利用状況ダッシュボード機能を利用する
              </label>
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
            onClick={() => setFeatures(initial)}
            className="h-9 rounded-md border border-neutral-200 bg-bg-card px-md font-body text-sm font-[var(--weight-medium)] text-neutral-700 transition-[border-color,background-color] duration-[var(--transition-default)] hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            キャンセル
          </button>
        </div>
      </fetcher.Form>
    </section>
  );
}
