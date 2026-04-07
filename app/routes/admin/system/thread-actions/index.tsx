import { container } from "@/core/application/container/server.instance";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "スレッドのアクション - OpenDeskシステム管理" }];
}

type ThreadAction = {
  id: string;
  name: string;
  destinationApp: string;
  updatedBy: string;
  updatedAt: string;
};

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request, container);
  return { actions: [] as ThreadAction[] };
}

export default function ThreadActionsPage({
  loaderData,
}: Route.ComponentProps) {
  const { actions } = loaderData;

  return (
    <section>
      <h2 className="mb-lg border-b border-neutral-200 pb-md font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        スレッドのアクション
      </h2>
      <p className="mb-md text-sm text-neutral-500">
        スレッドコメントの内容を指定アプリのレコードに転記する機能を管理します。
      </p>

      {actions.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-bg-card p-2xl text-center text-sm text-neutral-500">
          アクションはありません。
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card">
          <table className="w-full border-collapse text-base">
            <thead>
              <tr>
                <th className="border-b border-neutral-200 bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
                  アクション名
                </th>
                <th className="border-b border-neutral-200 bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
                  コピー先のアプリ
                </th>
                <th className="border-b border-neutral-200 bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
                  最終更新者
                </th>
                <th className="border-b border-neutral-200 bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
                  最終更新日時
                </th>
              </tr>
            </thead>
            <tbody>
              {actions.map((action) => (
                <tr
                  key={action.id}
                  className="transition-colors duration-[var(--transition-default)] last:*:border-b-0 hover:bg-neutral-100"
                >
                  <td className="border-b border-neutral-200 px-md py-sm text-neutral-800">
                    {action.name}
                  </td>
                  <td className="border-b border-neutral-200 px-md py-sm text-neutral-800">
                    {action.destinationApp}
                  </td>
                  <td className="border-b border-neutral-200 px-md py-sm text-neutral-800">
                    {action.updatedBy}
                  </td>
                  <td className="border-b border-neutral-200 px-md py-sm text-neutral-800">
                    {action.updatedAt}
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
