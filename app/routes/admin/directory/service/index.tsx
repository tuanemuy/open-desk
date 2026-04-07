import { container } from "@/core/application/container/server.instance";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

type ServiceUser = {
  userId: string;
  displayName: string;
  loginName: string;
  services: string[];
};

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request, container);

  const userResult = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.userRepository.list({
        offset: 0,
        limit: 50,
        filter: { isActive: true },
      });
    },
  );

  const serviceUsers: ServiceUser[] = userResult.users.map((u) => ({
    userId: u.userId,
    displayName: u.displayName,
    loginName: u.loginName,
    services: ["OpenDesk"],
  }));

  return { serviceUsers, totalCount: userResult.totalCount };
}

export function meta(_args: Route.MetaArgs) {
  return [{ title: "サービスの利用ユーザー - cybozu.com共通管理 - OpenDesk" }];
}

export default function ServiceUsersPage({ loaderData }: Route.ComponentProps) {
  const { serviceUsers, totalCount } = loaderData;

  return (
    <section>
      <h2 className="mb-lg font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        サービスの利用ユーザー
      </h2>
      <p className="mb-lg text-sm text-neutral-500">
        各サービスを利用しているユーザーの一覧です。（{totalCount}件）
      </p>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600">
                  表示名
                </th>
                <th className="bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600">
                  ログイン名
                </th>
                <th className="bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600">
                  利用するサービス
                </th>
              </tr>
            </thead>
            <tbody>
              {serviceUsers.map((user) => (
                <tr
                  key={user.userId}
                  className="border-b border-neutral-200 transition-colors duration-[var(--transition-default)] last:border-b-0 hover:bg-neutral-100"
                >
                  <td className="px-md py-sm text-base font-[var(--weight-medium)] text-neutral-800">
                    {user.displayName}
                  </td>
                  <td className="px-md py-sm text-base text-neutral-600">
                    {user.loginName}
                  </td>
                  <td className="px-md py-sm">
                    <div className="flex flex-wrap gap-xs">
                      {user.services.map((service) => (
                        <span
                          key={service}
                          className="inline-flex items-center rounded-sm bg-info-light px-sm py-[2px] text-xs font-[var(--weight-medium)] text-info"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {serviceUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-md py-xl text-center text-sm text-neutral-500"
                  >
                    利用ユーザーがいません
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
