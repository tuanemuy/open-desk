import { Plus } from "lucide-react";
import { container } from "@/core/application/container/server.instance";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

type ApiTokenItem = {
  id: string;
  summary: string;
  scopes: string[];
  createdBy: string;
  createdAt: string;
  expiresAt: string;
};

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request, container);

  const tokens: ApiTokenItem[] = [];

  return { tokens };
}

export function meta(_args: Route.MetaArgs) {
  return [{ title: "APIトークン - cybozu.com共通管理 - OpenDesk" }];
}

export default function ApiTokenPage({ loaderData }: Route.ComponentProps) {
  const { tokens } = loaderData;

  return (
    <section>
      <h2 className="mb-lg font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        APIトークン
      </h2>

      <div className="mb-lg">
        <button
          type="button"
          className="inline-flex h-[36px] items-center gap-sm rounded-md border-none bg-primary px-lg font-body text-sm font-[var(--weight-medium)] text-on-primary transition-[background-color] duration-[var(--transition-default)] hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Plus className="h-[14px] w-[14px]" />
          APIトークンを生成
        </button>
      </div>

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
                  作成者
                </th>
                <th className="bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600">
                  作成日
                </th>
                <th className="bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600">
                  有効期限
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
                    {token.createdBy}
                  </td>
                  <td className="px-md py-sm text-sm text-neutral-600">
                    {token.createdAt}
                  </td>
                  <td className="px-md py-sm text-sm text-neutral-600">
                    {token.expiresAt}
                  </td>
                  <td className="px-md py-sm">
                    <button
                      type="button"
                      className="bg-transparent text-sm font-[var(--weight-medium)] text-error transition-colors duration-[var(--transition-default)] hover:underline"
                    >
                      無効化
                    </button>
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
