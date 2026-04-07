import { container } from "@/core/application/container/server.instance";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request, container);
  return { titles: [] as { id: string; name: string }[] };
}

export function meta(_args: Route.MetaArgs) {
  return [{ title: "役職 - cybozu.com共通管理 - OpenDesk" }];
}

export default function TitlePage({ loaderData }: Route.ComponentProps) {
  const { titles } = loaderData;

  return (
    <section>
      <h2 className="mb-lg font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        役職
      </h2>
      <p className="mb-lg text-sm text-neutral-500">
        組織で使用する役職を管理します。
      </p>
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600">
                  役職名
                </th>
                <th className="bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {titles.map((title) => (
                <tr
                  key={title.id}
                  className="border-b border-neutral-200 transition-colors duration-[var(--transition-default)] last:border-b-0 hover:bg-neutral-100"
                >
                  <td className="px-md py-sm text-base text-neutral-800">
                    {title.name}
                  </td>
                  <td className="px-md py-sm">
                    <button
                      type="button"
                      className="bg-transparent text-sm font-[var(--weight-medium)] text-error transition-colors duration-[var(--transition-default)] hover:underline"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
              {titles.length === 0 && (
                <tr>
                  <td
                    colSpan={2}
                    className="px-md py-xl text-center text-sm text-neutral-500"
                  >
                    役職が登録されていません
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
