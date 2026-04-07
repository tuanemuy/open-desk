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

type SecuritySettings = {
  samlEnabled: boolean;
  twoFactorEnabled: boolean;
  userPasswordMinLength: number;
  adminPasswordMinLength: number;
  complexity: string;
  allowLoginNamePassword: boolean;
  passwordExpiry: string;
  passwordHistoryCount: number;
  allowPasswordChange: boolean;
  requirePasswordChange: boolean;
  allowPasswordReset: boolean;
  lockoutAttempts: number;
  lockoutDuration: string;
  sessionTimeout: string;
  autoCompleteLoginName: boolean;
  allowBrowserSave: boolean;
  autoLoginEnabled: boolean;
  autoLoginDuration: string;
};

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request, container);

  const settings: SecuritySettings = {
    samlEnabled: false,
    twoFactorEnabled: false,
    userPasswordMinLength: 8,
    adminPasswordMinLength: 8,
    complexity: "alphanumeric",
    allowLoginNamePassword: false,
    passwordExpiry: "unlimited",
    passwordHistoryCount: 0,
    allowPasswordChange: true,
    requirePasswordChange: false,
    allowPasswordReset: true,
    lockoutAttempts: 10,
    lockoutDuration: "3min",
    sessionTimeout: "24h",
    autoCompleteLoginName: false,
    allowBrowserSave: false,
    autoLoginEnabled: false,
    autoLoginDuration: "1week",
  };

  return { settings };
}

const saveSecuritySchema = z.object({
  samlEnabled: z.string().optional(),
  twoFactorEnabled: z.string().optional(),
  userPasswordMinLength: z.string(),
  adminPasswordMinLength: z.string(),
  complexity: z.string(),
  lockoutAttempts: z.string(),
  lockoutDuration: z.string(),
  sessionTimeout: z.string(),
});

export const handlers = {
  saveSettings: defineHandler({
    schema: saveSecuritySchema,
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
  return [
    {
      title: "ログインのセキュリティ設定 - cybozu.com共通管理 - OpenDesk",
    },
  ];
}

import { SELECT_CLASSES } from "@/lib/admin";

export default function LoginSecurityPage({
  loaderData,
}: Route.ComponentProps) {
  const { settings } = loaderData;
  const fetcher = useCompositeAction<typeof handlers>();
  const isPending = fetcher.isPending("saveSettings");

  const [form] = useForm({
    id: "security-settings-form",
    lastResult:
      fetcher.data?.intent === "saveSettings" ? fetcher.data : undefined,
    constraint: getZodConstraint(handlers.saveSettings.schema),
    shouldValidate: "onSubmit",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: handlers.saveSettings.schema });
    },
  });

  return (
    <section>
      <h2 className="mb-lg font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        ログインのセキュリティ設定
      </h2>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card">
        <div className="p-lg">
          <fetcher.Form method="post" {...getFormProps(form)}>
            <input type="hidden" name="intent" value="saveSettings" />

            {/* Authentication Methods */}
            <div className="mb-lg">
              <div className="mb-md border-b border-neutral-200 pb-sm font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
                認証方式
              </div>
              <div className="mb-md flex items-start gap-sm">
                <input
                  type="checkbox"
                  id="samlEnabled"
                  name="samlEnabled"
                  value="true"
                  defaultChecked={settings.samlEnabled}
                  className="mt-[2px] h-[18px] w-[18px] shrink-0 cursor-pointer accent-primary"
                />
                <div>
                  <label
                    htmlFor="samlEnabled"
                    className="cursor-pointer text-base leading-normal text-neutral-800"
                  >
                    SAML認証を有効にする
                  </label>
                  <div className="mt-[2px] text-xs text-neutral-400">
                    SSO（シングルサインオン）用のSAML認証を有効にします
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-sm">
                <input
                  type="checkbox"
                  id="twoFactorEnabled"
                  name="twoFactorEnabled"
                  value="true"
                  defaultChecked={settings.twoFactorEnabled}
                  className="mt-[2px] h-[18px] w-[18px] shrink-0 cursor-pointer accent-primary"
                />
                <div>
                  <label
                    htmlFor="twoFactorEnabled"
                    className="cursor-pointer text-base leading-normal text-neutral-800"
                  >
                    2要素認証の利用をユーザーに許可する
                  </label>
                  <div className="mt-[2px] text-xs text-neutral-400">
                    TOTP方式の2要素認証を有効にします
                  </div>
                </div>
              </div>
            </div>

            {/* Password Policy */}
            <div className="mb-lg">
              <div className="mb-md border-b border-neutral-200 pb-sm font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
                パスワードポリシー
              </div>
              <div className="mb-md text-sm leading-normal text-neutral-500">
                ユーザーおよび管理者のパスワードに対する要件を設定します。
              </div>
              <div className="mb-md flex items-center gap-md">
                <label
                  htmlFor="sec-userPasswordMinLength"
                  className="min-w-[240px] shrink-0 text-sm font-[var(--weight-medium)] text-neutral-600"
                >
                  ユーザーパスワードの最小文字数
                </label>
                <select
                  id="sec-userPasswordMinLength"
                  name="userPasswordMinLength"
                  defaultValue={String(settings.userPasswordMinLength)}
                  className={SELECT_CLASSES}
                >
                  {[3, 4, 5, 6, 7, 8, 9, 10, 12, 15].map((n) => (
                    <option key={n} value={String(n)}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-md flex items-center gap-md">
                <label
                  htmlFor="sec-adminPasswordMinLength"
                  className="min-w-[240px] shrink-0 text-sm font-[var(--weight-medium)] text-neutral-600"
                >
                  管理者パスワードの最小文字数
                </label>
                <select
                  id="sec-adminPasswordMinLength"
                  name="adminPasswordMinLength"
                  defaultValue={String(settings.adminPasswordMinLength)}
                  className={SELECT_CLASSES}
                >
                  {[3, 4, 5, 6, 7, 8, 9, 10, 12, 15].map((n) => (
                    <option key={n} value={String(n)}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-md">
                <label
                  htmlFor="sec-complexity"
                  className="min-w-[240px] shrink-0 text-sm font-[var(--weight-medium)] text-neutral-600"
                >
                  複雑さ
                </label>
                <select
                  id="sec-complexity"
                  name="complexity"
                  defaultValue={settings.complexity}
                  className={SELECT_CLASSES}
                >
                  <option value="none">制限なし</option>
                  <option value="alphanumeric">アルファベットと数字</option>
                  <option value="complex">
                    アルファベット＋数字＋特殊文字
                  </option>
                </select>
              </div>
            </div>

            {/* Account Lockout */}
            <div className="mb-lg">
              <div className="mb-md border-b border-neutral-200 pb-sm font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
                アカウントロックアウト
              </div>
              <div className="mb-md text-sm leading-normal text-neutral-500">
                ログイン失敗時のアカウントロック条件を設定します。
              </div>
              <div className="mb-md flex items-center gap-md">
                <label
                  htmlFor="sec-lockoutAttempts"
                  className="min-w-[240px] shrink-0 text-sm font-[var(--weight-medium)] text-neutral-600"
                >
                  ログイン失敗回数
                </label>
                <select
                  id="sec-lockoutAttempts"
                  name="lockoutAttempts"
                  defaultValue={String(settings.lockoutAttempts)}
                  className={SELECT_CLASSES}
                >
                  <option value="3">3回</option>
                  <option value="5">5回</option>
                  <option value="10">10回</option>
                  <option value="0">ロックアウトしない</option>
                </select>
              </div>
              <div className="flex items-center gap-md">
                <label
                  htmlFor="sec-lockoutDuration"
                  className="min-w-[240px] shrink-0 text-sm font-[var(--weight-medium)] text-neutral-600"
                >
                  解除までの時間
                </label>
                <select
                  id="sec-lockoutDuration"
                  name="lockoutDuration"
                  defaultValue={settings.lockoutDuration}
                  className={SELECT_CLASSES}
                >
                  <option value="3min">3分</option>
                  <option value="15min">15分</option>
                  <option value="30min">30分</option>
                  <option value="60min">60分</option>
                  <option value="never">解除しない</option>
                </select>
              </div>
            </div>

            {/* Session */}
            <div className="mb-lg">
              <div className="mb-md border-b border-neutral-200 pb-sm font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
                セッション
              </div>
              <div className="flex items-center gap-md">
                <label
                  htmlFor="sec-sessionTimeout"
                  className="min-w-[240px] shrink-0 text-sm font-[var(--weight-medium)] text-neutral-600"
                >
                  有効期間
                </label>
                <select
                  id="sec-sessionTimeout"
                  name="sessionTimeout"
                  defaultValue={settings.sessionTimeout}
                  className={SELECT_CLASSES}
                >
                  <option value="15min">15分</option>
                  <option value="30min">30分</option>
                  <option value="1h">1時間</option>
                  <option value="2h">2時間</option>
                  <option value="4h">4時間</option>
                  <option value="8h">8時間</option>
                  <option value="12h">12時間</option>
                  <option value="24h">24時間</option>
                </select>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-lg flex items-center gap-md">
              <button
                type="submit"
                disabled={isPending}
                className="h-[36px] rounded-md border-none bg-primary px-lg font-body text-sm font-[var(--weight-medium)] text-on-primary transition-[background-color] duration-[var(--transition-default)] hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
              >
                {isPending ? "保存中..." : "保存"}
              </button>
            </div>
          </fetcher.Form>
        </div>
      </div>
    </section>
  );
}
