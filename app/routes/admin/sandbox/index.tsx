import { container } from "@/core/application/container/server.instance";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request, container);

  const organizations = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      return ctx.organizationRepository.findRoot();
    },
  );

  return {
    organizations: organizations.map((o) => ({
      organizationId: o.organizationId,
      name: o.name,
      code: o.code,
    })),
  };
}

export function meta(_args: Route.MetaArgs) {
  return [{ title: "組織の事前設定 - cybozu.com共通管理 - OpenDesk" }];
}

export default function SandboxPage({ loaderData }: Route.ComponentProps) {
  const { organizations } = loaderData;

  return (
    <section>
      <h2 className="mb-lg font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        組織の事前設定
      </h2>
      <p className="mb-lg text-sm text-neutral-500">
        組織変更を事前に準備し、指定した日時に反映できます。現在の組織構成をコピーして編集します。
      </p>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-bg-card p-lg">
        <div className="mb-md border-b border-neutral-200 pb-sm font-heading text-lg font-[var(--weight-semibold)] text-neutral-700">
          現在の組織一覧
        </div>
        {organizations.length > 0 ? (
          <div className="flex flex-col">
            {organizations.map((org) => (
              <div
                key={org.organizationId}
                className="border-b border-neutral-200 px-sm py-sm last:border-b-0"
              >
                <span className="text-base font-[var(--weight-medium)] text-neutral-800">
                  {org.name}
                </span>
                <span className="ml-sm text-sm text-neutral-500">
                  ({org.code})
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-lg text-center text-sm text-neutral-500">
            組織が登録されていません
          </p>
        )}

        <div className="mt-lg">
          <button
            type="button"
            className="h-[36px] rounded-md border-none bg-primary px-lg font-body text-sm font-[var(--weight-medium)] text-on-primary transition-[background-color] duration-[var(--transition-default)] hover:bg-primary-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            事前設定を開始
          </button>
        </div>
      </div>
    </section>
  );
}
