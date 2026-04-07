import { FileDown, FileUp, Plus, Trash2 } from "lucide-react";
import { container } from "@/core/application/container/server.instance";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "アプリテンプレート - OpenDeskシステム管理" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request, container);
  return {
    templates: [] as {
      id: string;
      name: string;
      description: string;
      createdAt: string;
    }[],
  };
}

export default function TemplatesPage({ loaderData }: Route.ComponentProps) {
  const { templates } = loaderData;

  return (
    <section>
      <h2 className="mb-lg border-b border-neutral-200 pb-md font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        アプリテンプレート
      </h2>

      <div className="mb-lg flex items-center gap-md">
        <button
          type="button"
          className="inline-flex h-9 items-center gap-sm rounded-md border-none bg-primary px-md font-body text-sm font-[var(--weight-medium)] text-on-primary transition-colors duration-[var(--transition-default)] hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Plus className="h-3.5 w-3.5" />
          作成
        </button>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-sm rounded-md border border-neutral-200 bg-bg-card px-md font-body text-sm font-[var(--weight-medium)] text-neutral-700 transition-[border-color,background-color] duration-[var(--transition-default)] hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <FileUp className="h-3.5 w-3.5" />
          読み込む
        </button>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-sm rounded-md border border-neutral-200 bg-bg-card px-md font-body text-sm font-[var(--weight-medium)] text-neutral-700 transition-[border-color,background-color] duration-[var(--transition-default)] hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <FileDown className="h-3.5 w-3.5" />
          書き出す
        </button>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-sm rounded-md border border-neutral-200 bg-bg-card px-md font-body text-sm font-[var(--weight-medium)] text-neutral-700 transition-[border-color,background-color] duration-[var(--transition-default)] hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Trash2 className="h-3.5 w-3.5" />
          削除
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-bg-card p-2xl text-center text-sm text-neutral-500">
          アプリテンプレートはありません。
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card">
          <table className="w-full border-collapse text-base">
            <thead>
              <tr>
                <th className="border-b border-neutral-200 bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
                  ID
                </th>
                <th className="border-b border-neutral-200 bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
                  テンプレート名
                </th>
                <th className="border-b border-neutral-200 bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
                  作成日時
                </th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr
                  key={t.id}
                  className="transition-colors duration-[var(--transition-default)] last:*:border-b-0 hover:bg-neutral-100"
                >
                  <td className="border-b border-neutral-200 px-md py-sm text-neutral-800">
                    {t.id}
                  </td>
                  <td className="border-b border-neutral-200 px-md py-sm text-neutral-800">
                    {t.name}
                  </td>
                  <td className="border-b border-neutral-200 px-md py-sm text-neutral-800">
                    {t.createdAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
