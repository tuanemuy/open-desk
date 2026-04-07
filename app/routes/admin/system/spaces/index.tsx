import { LicenseCard } from "@/components/admin/LicenseCard";
import type { SpaceUsageDto } from "@/core/application/space/dto";
import { formatDate } from "@/lib/admin";
import type { Route } from "./+types/index";

export { loader } from "./loader";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "スペース管理 - OpenDeskシステム管理" }];
}

function SpaceTable({ spaces }: { spaces: readonly SpaceUsageDto[] }) {
  return (
    <div className="mb-lg overflow-hidden rounded-lg border border-neutral-200 bg-bg-card">
      <table className="w-full border-collapse text-base">
        <thead>
          <tr>
            <th className="border-b border-neutral-200 bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
              ID
            </th>
            <th className="border-b border-neutral-200 bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
              スペース名
            </th>
            <th className="border-b border-neutral-200 bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
              種別
            </th>
            <th className="border-b border-neutral-200 bg-bg-section px-md py-sm text-right text-sm font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
              管理者数
            </th>
            <th className="border-b border-neutral-200 bg-bg-section px-md py-sm text-right text-sm font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
              メンバー数
            </th>
            <th className="border-b border-neutral-200 bg-bg-section px-md py-sm text-left text-sm font-[var(--weight-medium)] text-neutral-600 whitespace-nowrap">
              作成日時
            </th>
          </tr>
        </thead>
        <tbody>
          {spaces.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="px-md py-2xl text-center text-sm text-neutral-500"
              >
                スペースはありません。
              </td>
            </tr>
          ) : (
            spaces.map((space) => (
              <tr
                key={space.spaceId}
                className="transition-colors duration-[var(--transition-default)] last:*:border-b-0 hover:bg-neutral-100"
              >
                <td className="border-b border-neutral-200 px-md py-sm text-neutral-800">
                  {space.spaceId}
                </td>
                <td className="border-b border-neutral-200 px-md py-sm text-neutral-800">
                  {space.name}
                </td>
                <td className="border-b border-neutral-200 px-md py-sm text-neutral-800">
                  {space.isGuest ? "ゲスト" : "通常"}
                </td>
                <td className="border-b border-neutral-200 px-md py-sm text-right text-neutral-800">
                  {space.adminCount}
                </td>
                <td className="border-b border-neutral-200 px-md py-sm text-right text-neutral-800">
                  {space.memberCount}
                </td>
                <td className="border-b border-neutral-200 px-md py-sm text-neutral-800">
                  {formatDate(space.createdAt)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function SpacesPage({ loaderData }: Route.ComponentProps) {
  const { licenses, spaces } = loaderData;

  return (
    <section>
      <h2 className="mb-lg border-b border-neutral-200 pb-md font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        スペース管理
      </h2>

      <h3 className="mb-md font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
        ライセンスの使用状況
      </h3>
      <div className="mb-lg grid grid-cols-2 gap-md">
        {licenses.map((license) => (
          <LicenseCard key={license.label} license={license} />
        ))}
      </div>

      <h3 className="mb-md font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
        スペースの一覧
      </h3>
      <SpaceTable spaces={spaces} />
    </section>
  );
}
