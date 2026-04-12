import { Plus } from "lucide-react";
import { useState } from "react";
import { useCompositeAction } from "@/lib/compositeAction";
import type { Route } from "./+types/index";

import type { handlers } from "./action.server";

export { action } from "./action.server";
export { loader } from "./loader.server";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "APIトークン - cybozu.com共通管理 - OpenDesk" }];
}

const AVAILABLE_SCOPES = ["read", "write", "admin"] as const;

export default function ApiTokenPage({ loaderData }: Route.ComponentProps) {
  const { tokens } = loaderData;
  const [showForm, setShowForm] = useState(false);
  const fetcher = useCompositeAction<typeof handlers>();

  fetcher.register("issueToken", {
    onSuccess: () => {
      setShowForm(false);
    },
    onError: () => {
      // エラーはフォーム内に表示されるため追加処理なし
    },
  });

  fetcher.register("revokeToken", {
    onError: () => {
      // エラーは画面上部などに表示する場合はここに追加
    },
  });

  const isIssuePending = fetcher.isPending("issueToken");

  return (
    <section>
      <h2 className="mb-lg font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        APIトークン
      </h2>

      <div className="mb-lg">
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex h-[36px] items-center gap-sm rounded-md border-none bg-primary px-lg font-body text-sm font-[var(--weight-medium)] text-on-primary transition-[background-color] duration-[var(--transition-default)] hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Plus className="h-[14px] w-[14px]" />
          APIトークンを生成
        </button>
      </div>

      {showForm && (
        <fetcher.Form
          method="post"
          className="mb-lg rounded-lg border border-neutral-200 bg-bg-card p-lg"
          onSubmit={(e) => {
            const form = e.currentTarget;
            const checkboxes = form.querySelectorAll<HTMLInputElement>(
              'input[type="checkbox"][data-scope]',
            );
            const selected = Array.from(checkboxes)
              .filter((cb) => cb.checked)
              .map((cb) => cb.value)
              .join(",");
            const scopesInput = form.querySelector<HTMLInputElement>(
              'input[name="scopes"]',
            );
            if (scopesInput) {
              scopesInput.value = selected;
            }
          }}
        >
          <input type="hidden" name="intent" value="issueToken" />
          <input type="hidden" name="scopes" value="" />
          <h3 className="mb-md font-heading text-base font-[var(--weight-semibold)] text-neutral-900">
            APIトークンを生成
          </h3>
          <div className="mb-md flex flex-col gap-sm">
            <label
              htmlFor="summary"
              className="text-sm font-[var(--weight-medium)] text-neutral-700"
            >
              概要
              <span className="ml-xs text-error text-xs">*</span>
            </label>
            <input
              id="summary"
              type="text"
              name="summary"
              placeholder="例: CI/CD用トークン"
              required
              className="rounded-md border border-neutral-300 px-md py-sm text-sm text-neutral-800 placeholder:text-neutral-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            />
          </div>
          <div className="mb-md flex flex-col gap-sm">
            <span className="text-sm font-[var(--weight-medium)] text-neutral-700">
              スコープ
              <span className="ml-xs text-error text-xs">*</span>
            </span>
            <div className="flex flex-wrap gap-md">
              {AVAILABLE_SCOPES.map((scope) => (
                <label
                  key={scope}
                  className="inline-flex cursor-pointer items-center gap-xs text-sm text-neutral-700"
                >
                  <input
                    type="checkbox"
                    data-scope="true"
                    value={scope}
                    className="h-[14px] w-[14px] accent-primary"
                  />
                  {scope}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-sm">
            <button
              type="submit"
              disabled={isIssuePending}
              className="inline-flex h-[36px] items-center gap-sm rounded-md border-none bg-primary px-lg font-body text-sm font-[var(--weight-medium)] text-on-primary transition-[background-color] duration-[var(--transition-default)] hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isIssuePending ? "生成中..." : "生成"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="inline-flex h-[36px] items-center gap-sm rounded-md border border-neutral-300 bg-transparent px-lg font-body text-sm font-[var(--weight-medium)] text-neutral-700 transition-[background-color] duration-[var(--transition-default)] hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
            >
              キャンセル
            </button>
          </div>
        </fetcher.Form>
      )}

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600">
                  ID
                </th>
                <th className="bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600">
                  概要
                </th>
                <th className="bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600">
                  スコープ
                </th>
                <th className="bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600">
                  作成日
                </th>
                <th className="bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600">
                  有効期限
                </th>
                <th className="bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600">
                  状態
                </th>
                <th className="bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((token) => (
                <tr
                  key={token.id}
                  className="border-b border-neutral-200 transition-colors duration-[var(--transition-default)] last:border-b-0 hover:bg-neutral-100"
                >
                  <td className="px-md py-sm text-sm text-neutral-600">
                    {token.id}
                  </td>
                  <td className="px-md py-sm text-base text-neutral-800">
                    {token.summary}
                  </td>
                  <td className="px-md py-sm">
                    <div className="flex flex-wrap gap-xs">
                      {token.scopes.map((scope) => (
                        <span
                          key={scope}
                          className="inline-flex rounded-sm bg-info-light px-sm py-[2px] text-xs font-[var(--weight-medium)] text-info"
                        >
                          {scope}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-md py-sm text-sm text-neutral-600">
                    {token.createdAt}
                  </td>
                  <td className="px-md py-sm text-sm text-neutral-600">
                    {token.expiresAt ?? "-"}
                  </td>
                  <td className="px-md py-sm text-sm">
                    {token.isRevoked ? (
                      <span className="text-error">無効</span>
                    ) : (
                      <span className="text-success">有効</span>
                    )}
                  </td>
                  <td className="px-md py-sm">
                    {!token.isRevoked && (
                      <fetcher.Form method="post">
                        <input
                          type="hidden"
                          name="intent"
                          value="revokeToken"
                        />
                        <input type="hidden" name="tokenId" value={token.id} />
                        <button
                          type="submit"
                          disabled={fetcher.isPending("revokeToken")}
                          className="bg-transparent text-sm font-[var(--weight-medium)] text-error transition-colors duration-[var(--transition-default)] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          無効化
                        </button>
                      </fetcher.Form>
                    )}
                  </td>
                </tr>
              ))}
              {tokens.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-md py-xl text-center text-sm text-neutral-500"
                  >
                    APIトークンがありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
