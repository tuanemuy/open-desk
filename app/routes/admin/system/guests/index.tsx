import type { LicenseInfo } from "@/components/admin/LicenseCard";
import { LicenseCard } from "@/components/admin/LicenseCard";
import { container } from "@/core/application/container/server.instance";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "ゲストユーザー管理 - OpenDeskシステム管理" }];
}

type GuestUser = {
  id: string;
  company: string;
  name: string;
  email: string;
  status: "active" | "inactive";
  lastLogin: string;
  spaces: string[];
  licenseType: string;
  trialExpiry: string | null;
};

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request, container);

  return {
    licenses: [
      { label: "試用期間中のゲストユーザー数", current: 0, limit: null },
      { label: "有料ゲストユーザー数", current: 0, limit: null },
      { label: "有料ゲストユーザー数の契約数", current: 0, limit: null },
    ] as LicenseInfo[],
    guests: [] as GuestUser[],
  };
}

export default function GuestsPage({ loaderData }: Route.ComponentProps) {
  const { licenses, guests } = loaderData;

  return (
    <section>
      <h2 className="mb-lg border-b border-neutral-200 pb-md font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        ゲストユーザー管理
      </h2>

      <h3 className="mb-md font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
        ライセンスの使用状況
      </h3>
      <div className="mb-lg grid grid-cols-3 gap-md">
        {licenses.map((license) => (
          <LicenseCard key={license.label} license={license} />
        ))}
      </div>

      <h3 className="mb-md font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
        ゲストユーザーの一覧
      </h3>
      {guests.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-bg-card p-2xl text-center text-sm text-neutral-500">
          ゲストユーザーはいません。
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card">
          <table className="w-full border-collapse text-base">
            <thead>
              <tr>
                <th className="border-b border-neutral-200 bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
                  会社
                </th>
                <th className="border-b border-neutral-200 bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
                  名前
                </th>
                <th className="border-b border-neutral-200 bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
                  メールアドレス
                </th>
                <th className="border-b border-neutral-200 bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
                  ステータス
                </th>
                <th className="border-b border-neutral-200 bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
                  最終ログイン日時
                </th>
              </tr>
            </thead>
            <tbody>
              {guests.map((guest) => (
                <tr
                  key={guest.id}
                  className="transition-colors duration-[var(--transition-default)] last:*:border-b-0 hover:bg-neutral-100"
                >
                  <td className="border-b border-neutral-200 px-md py-sm text-neutral-800">
                    {guest.company}
                  </td>
                  <td className="border-b border-neutral-200 px-md py-sm text-neutral-800">
                    {guest.name}
                  </td>
                  <td className="border-b border-neutral-200 px-md py-sm text-neutral-800">
                    {guest.email}
                  </td>
                  <td className="border-b border-neutral-200 px-md py-sm">
                    <span
                      className={`inline-flex items-center gap-xs rounded-full px-sm py-0.5 text-xs font-[var(--weight-medium)] ${
                        guest.status === "active"
                          ? "bg-success-light text-success"
                          : "bg-neutral-150 text-neutral-500"
                      }`}
                    >
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
                      {guest.status === "active" ? "有効" : "無効"}
                    </span>
                  </td>
                  <td className="border-b border-neutral-200 px-md py-sm text-neutral-800">
                    {guest.lastLogin}
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
