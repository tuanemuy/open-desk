import { container } from "@/core/application/container/server.instance";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

type AdminUser = {
  userId: string;
  displayName: string;
  loginName: string;
  receiveEmail: boolean;
};

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request, container);

  const userResult = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.userRepository.list({
        offset: 0,
        limit: 10,
        filter: { isActive: true },
      });
    },
  );

  const admins: AdminUser[] = userResult.users.slice(0, 1).map((u) => ({
    userId: u.userId,
    displayName: u.displayName,
    loginName: u.loginName,
    receiveEmail: true,
  }));

  return { admins };
}

export function meta(_args: Route.MetaArgs) {
  return [{ title: "管理者の設定 - cybozu.com共通管理 - OpenDesk" }];
}

export default function AdministratorsPage({
  loaderData,
}: Route.ComponentProps) {
  const { admins } = loaderData;

  return (
    <section>
      <h2 className="mb-lg font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        管理者の設定
      </h2>
      <p className="mb-lg text-sm text-neutral-500">
        cybozu.com共通管理者を設定します。管理者はすべてのシステム管理権限を持ちます。
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
                  メール通知
                </th>
                <th className="bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr
                  key={admin.userId}
                  className="border-b border-neutral-200 transition-colors duration-[var(--transition-default)] last:border-b-0 hover:bg-neutral-100"
                >
                  <td className="px-md py-sm text-base font-[var(--weight-medium)] text-neutral-800">
                    {admin.displayName}
                  </td>
                  <td className="px-md py-sm text-base text-neutral-600">
                    {admin.loginName}
                  </td>
                  <td className="px-md py-sm">
                    <input
                      type="checkbox"
                      defaultChecked={admin.receiveEmail}
                      className="h-[18px] w-[18px] cursor-pointer accent-primary"
                    />
                  </td>
                  <td className="px-md py-sm">
                    <button
                      type="button"
                      className="bg-transparent text-sm font-[var(--weight-medium)] text-error transition-colors duration-[var(--transition-default)] hover:underline"
                    >
                      解除
                    </button>
                  </td>
                </tr>
              ))}
              {admins.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-md py-xl text-center text-sm text-neutral-500"
                  >
                    管理者が設定されていません
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
