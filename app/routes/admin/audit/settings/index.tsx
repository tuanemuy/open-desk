import { data } from "react-router";
import { z } from "zod";
import { getAuditLogSettings } from "@/core/application/audit/getAuditLogSettings";
import { updateAuditLogSettings } from "@/core/application/audit/updateAuditLogSettings";
import { container } from "@/core/application/container/server.instance";
import {
  createCompositeAction,
  defineHandler,
  error,
  success,
  useCompositeAction,
} from "@/lib/compositeAction";
import { handleUseCase } from "@/lib/handleUseCase";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request, container);

  const result = await handleUseCase(() =>
    getAuditLogSettings({
      container,
      headers: request.headers,
      input: undefined,
    }),
  ).match(
    (result) => result,
    (e) => {
      throw data({ message: e.message }, { status: e.status });
    },
  );

  return { setting: result.setting };
}

const updateSettingsSchema = z.object({
  logLevel: z.enum(["info", "warning"]),
  logAuth: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  logAdmin: z
    .string()
    .optional()
    .transform((v) => v === "on"),
  logData: z
    .string()
    .optional()
    .transform((v) => v === "on"),
});

const handlers = {
  updateSettings: defineHandler({
    schema: updateSettingsSchema,
    handler: async (value, args) => {
      await requireAuth(args.request, container);

      return handleUseCase(() =>
        updateAuditLogSettings({
          container,
          headers: args.request.headers,
          input: {
            settings: {
              logLevel: value.logLevel,
              logAuth: value.logAuth,
              logAdmin: value.logAdmin,
              logData: value.logData,
            },
          },
        }),
      ).match(
        (result) => success({ setting: result.setting }),
        (e) => error({ "": [e.message] }),
      );
    },
  }),
};

export async function action(args: Route.ActionArgs) {
  return createCompositeAction(args, handlers);
}

export function meta(_args: Route.MetaArgs) {
  return [{ title: "監査ログ設定 - cybozu.com共通管理 - OpenDesk" }];
}

export default function AuditSettingsPage({
  loaderData,
}: Route.ComponentProps) {
  const { setting } = loaderData;
  const settings = setting.settings as {
    logLevel?: string;
    logAuth?: boolean;
    logAdmin?: boolean;
    logData?: boolean;
  };
  const fetcher = useCompositeAction<typeof handlers>();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("intent", "updateSettings");
    fetcher.submit(formData, { method: "post" });
  };

  return (
    <section>
      <h2 className="mb-lg font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        監査ログ設定
      </h2>
      <p className="mb-lg text-sm text-neutral-500">
        監査ログの記録対象やレベルを設定します。
      </p>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card p-lg">
        <form onSubmit={handleSubmit}>
          <div className="mb-lg">
            <div className="mb-md border-b border-neutral-200 pb-sm font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
              記録レベル
            </div>
            <div className="flex flex-col gap-md">
              <label className="flex cursor-pointer items-center gap-sm">
                <input
                  type="radio"
                  name="logLevel"
                  value="info"
                  defaultChecked={settings.logLevel !== "warning"}
                  className="h-[18px] w-[18px] shrink-0 cursor-pointer accent-primary"
                />
                <span className="text-base text-neutral-800">
                  情報以上（すべてのログを記録）
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-sm">
                <input
                  type="radio"
                  name="logLevel"
                  value="warning"
                  defaultChecked={settings.logLevel === "warning"}
                  className="h-[18px] w-[18px] shrink-0 cursor-pointer accent-primary"
                />
                <span className="text-base text-neutral-800">
                  重要以上（重要なイベントのみ記録）
                </span>
              </label>
            </div>
          </div>

          <div className="mb-lg">
            <div className="mb-md border-b border-neutral-200 pb-sm font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
              記録対象
            </div>
            <div className="flex flex-col gap-md">
              <div className="flex items-start gap-sm">
                <input
                  type="checkbox"
                  id="log-auth"
                  name="logAuth"
                  value="on"
                  defaultChecked={settings.logAuth !== false}
                  className="mt-[2px] h-[18px] w-[18px] shrink-0 cursor-pointer accent-primary"
                />
                <label
                  htmlFor="log-auth"
                  className="cursor-pointer text-base leading-normal text-neutral-800"
                >
                  認証（ログイン/ログアウト）
                </label>
              </div>
              <div className="flex items-start gap-sm">
                <input
                  type="checkbox"
                  id="log-admin"
                  name="logAdmin"
                  value="on"
                  defaultChecked={settings.logAdmin !== false}
                  className="mt-[2px] h-[18px] w-[18px] shrink-0 cursor-pointer accent-primary"
                />
                <label
                  htmlFor="log-admin"
                  className="cursor-pointer text-base leading-normal text-neutral-800"
                >
                  管理操作
                </label>
              </div>
              <div className="flex items-start gap-sm">
                <input
                  type="checkbox"
                  id="log-data"
                  name="logData"
                  value="on"
                  defaultChecked={settings.logData !== false}
                  className="mt-[2px] h-[18px] w-[18px] shrink-0 cursor-pointer accent-primary"
                />
                <label
                  htmlFor="log-data"
                  className="cursor-pointer text-base leading-normal text-neutral-800"
                >
                  データの作成・更新・削除
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={fetcher.isPending("updateSettings")}
            className="h-[36px] rounded-md border-none bg-primary px-lg font-body text-sm font-[var(--weight-medium)] text-on-primary transition-[background-color] duration-[var(--transition-default)] hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
          >
            {fetcher.isPending("updateSettings") ? "保存中..." : "保存"}
          </button>
        </form>
      </div>
    </section>
  );
}
