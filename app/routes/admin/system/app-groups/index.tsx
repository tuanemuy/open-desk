import { container } from "@/core/application/container/server.instance";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "アプリグループ - OpenDeskシステム管理" }];
}

type AppGroup = {
  id: string;
  name: string;
  accessControl: string;
  appCount: number;
};

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request, container);
  return {
    defaultGroup: "Public",
    groups: [
      {
        id: "1",
        name: "Public",
        accessControl: "すべてのユーザー",
        appCount: 15,
      },
    ] as AppGroup[],
  };
}

export default function AppGroupsPage({ loaderData }: Route.ComponentProps) {
  const { defaultGroup, groups } = loaderData;

  return (
    <section>
      <h2 className="mb-lg border-b border-neutral-200 pb-md font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        アプリグループ
      </h2>
      <p className="mb-md text-sm text-neutral-500">
        複数アプリに一括でアクセス権を設定できます。
      </p>

      <div className="mb-lg">
        <label
          htmlFor="default-app-group"
          className="mb-xs block text-sm font-[var(--weight-medium)] text-neutral-600"
        >
          デフォルトのアプリグループ
        </label>
        <select
          id="default-app-group"
          defaultValue={defaultGroup}
          className="h-9 w-[200px] cursor-pointer rounded-sm border border-neutral-300 bg-bg-card px-md font-body text-base text-neutral-800 outline-none transition-[border-color,box-shadow] duration-[var(--transition-default)] focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-lighter)]"
        >
          {groups.map((g) => (
            <option key={g.id} value={g.name}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      <h3 className="mb-md font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
        アプリグループの一覧
      </h3>
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card">
        <table className="w-full border-collapse text-base">
          <thead>
            <tr>
              <th className="border-b border-neutral-200 bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
                ID
              </th>
              <th className="border-b border-neutral-200 bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
                アプリグループ名
              </th>
              <th className="border-b border-neutral-200 bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
                アクセス権
              </th>
              <th className="border-b border-neutral-200 bg-bg-section px-md py-sm text-right text-sm font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
                所属するアプリ
              </th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <tr
                key={group.id}
                className="transition-colors duration-[var(--transition-default)] last:*:border-b-0 hover:bg-neutral-100"
              >
                <td className="border-b border-neutral-200 px-md py-sm text-neutral-800">
                  {group.id}
                </td>
                <td className="border-b border-neutral-200 px-md py-sm text-neutral-800">
                  {group.name}
                </td>
                <td className="border-b border-neutral-200 px-md py-sm text-neutral-800">
                  {group.accessControl}
                </td>
                <td className="border-b border-neutral-200 px-md py-sm text-right text-neutral-800">
                  {group.appCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
