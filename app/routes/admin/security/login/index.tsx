import { getFormProps, useForm } from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod/v4";
import { SELECT_CLASSES } from "@/lib/admin";
import { useCompositeAction } from "@/lib/compositeAction";
import type { Route } from "./+types/index";
import type { handlers } from "./action.server";
import { saveSecuritySchema } from "./schemas";

export { action } from "./action.server";
export { loader } from "./loader.server";

export function meta(_args: Route.MetaArgs) {
  return [
    {
      title: "ログインのセキュリティ設定 - cybozu.com共通管理 - OpenDesk",
    },
  ];
}

function formatLockoutDuration(minutes: number | null): string {
  switch (minutes) {
    case 3:
      return "3min";
    case 15:
      return "15min";
    case 30:
      return "30min";
    case 60:
      return "60min";
    case null:
      return "never";
    default:
      return "3min";
  }
}

function formatSessionTimeout(minutes: number): string {
  switch (minutes) {
    case 15:
      return "15min";
    case 30:
      return "30min";
    case 60:
      return "1h";
    case 120:
      return "2h";
    case 240:
      return "4h";
    case 480:
      return "8h";
    case 720:
      return "12h";
    case 1440:
      return "24h";
    default:
      return "24h";
  }
}

function formatComplexity(
  complexity: "NONE" | "ALPHANUMERIC" | "ALPHANUMERIC_SPECIAL",
): string {
  switch (complexity) {
    case "NONE":
      return "NONE";
    case "ALPHANUMERIC":
      return "ALPHANUMERIC";
    case "ALPHANUMERIC_SPECIAL":
      return "ALPHANUMERIC_SPECIAL";
    default:
      return "ALPHANUMERIC";
  }
}

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
    constraint: getZodConstraint(saveSecuritySchema),
    shouldValidate: "onSubmit",
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: saveSecuritySchema });
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
                  defaultChecked={settings.samlAuth.enabled}
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
                  defaultChecked={settings.twoFactorAuth.enabled}
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
                  defaultValue={String(settings.passwordPolicy.userMinLength)}
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
                  defaultValue={String(settings.passwordPolicy.adminMinLength)}
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
                  defaultValue={formatComplexity(
                    settings.passwordPolicy.complexity,
                  )}
                  className={SELECT_CLASSES}
                >
                  <option value="NONE">制限なし</option>
                  <option value="ALPHANUMERIC">アルファベットと数字</option>
                  <option value="ALPHANUMERIC_SPECIAL">
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
                  defaultValue={String(
                    settings.lockoutPolicy.maxFailedAttempts ?? 0,
                  )}
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
                  defaultValue={formatLockoutDuration(
                    settings.lockoutPolicy.lockoutDurationMinutes,
                  )}
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
                  defaultValue={formatSessionTimeout(
                    settings.sessionPolicy.sessionLifetimeMinutes,
                  )}
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
