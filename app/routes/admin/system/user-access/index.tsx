import { Download } from "lucide-react";
import { container } from "@/core/application/container/server.instance";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "ユーザーのアクセス状況 - OpenDeskシステム管理" }];
}

type UserAccess = {
  id: string;
  name: string;
  organization: string;
  lastAccessDate: string;
  accessDays30: number;
};

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request, container);
  return { users: [] as UserAccess[] };
}

export default function UserAccessPage({ loaderData }: Route.ComponentProps) {
  const { users } = loaderData;

  return (
    <section>
      <h2 className="mb-lg border-b border-neutral-200 pb-md font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        ユーザーのアクセス状況
      </h2>

      {users.length === 0 ? (
        <div className="mb-lg rounded-lg border border-neutral-200 bg-bg-card p-2xl text-center text-sm text-neutral-500">
          アクセス状況のデータはありません。
        </div>
      ) : (
        <div className="mb-lg overflow-hidden rounded-lg border border-neutral-200 bg-bg-card">
          <table className="w-full border-collapse text-base">
            <thead>
              <tr>
                <th className="border-b border-neutral-200 bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
                  ユーザー
                </th>
                <th className="border-b border-neutral-200 bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
                  組織
                </th>
                <th className="border-b border-neutral-200 bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
                  最終アクセス日
                </th>
                <th className="border-b border-neutral-200 bg-bg-section px-md py-sm text-right text-sm font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
                  過去30日間のアクセス日数
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="transition-colors duration-[var(--transition-default)] last:*:border-b-0 hover:bg-neutral-100"
                >
                  <td className="border-b border-neutral-200 px-md py-sm text-neutral-800">
                    {user.name}
                  </td>
                  <td className="border-b border-neutral-200 px-md py-sm text-neutral-800">
                    {user.organization}
                  </td>
                  <td className="border-b border-neutral-200 px-md py-sm text-neutral-800">
                    {user.lastAccessDate}
                  </td>
                  <td className="border-b border-neutral-200 px-md py-sm text-right text-neutral-800">
                    {user.accessDays30}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center gap-md">
        <button
          type="button"
          className="inline-flex h-9 items-center gap-sm rounded-md border border-neutral-200 bg-bg-card px-md font-body text-sm font-[var(--weight-medium)] text-neutral-700 transition-[border-color,background-color] duration-[var(--transition-default)] hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Download className="h-3.5 w-3.5" />
          CSV形式でダウンロードする
        </button>
      </div>
    </section>
  );
}
