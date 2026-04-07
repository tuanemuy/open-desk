import { Link } from "react-router";
import { container } from "@/core/application/container/server.instance";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

type ServiceInfo = {
  id: string;
  name: string;
  description: string;
  settingsUrl: string;
};

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request, container);

  const services: ServiceInfo[] = [
    {
      id: "opendesk",
      name: "OpenDesk",
      description:
        "ビジネスアプリ作成プラットフォーム。アプリ管理、スペース管理、権限管理などの詳細設定を行います。",
      settingsUrl: "/admin/system/apps",
    },
  ];

  return { services };
}

export function meta(_args: Route.MetaArgs) {
  return [{ title: "各サービスの設定 - cybozu.com共通管理 - OpenDesk" }];
}

export default function ServiceManagementPage({
  loaderData,
}: Route.ComponentProps) {
  const { services } = loaderData;

  return (
    <section>
      <h2 className="mb-lg font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
        各サービスの設定
      </h2>
      <p className="mb-lg text-sm text-neutral-500">
        利用中のサービスごとの個別設定を行います。
      </p>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-md">
        {services.map((service) => (
          <div
            key={service.id}
            className="rounded-lg border border-neutral-200 bg-bg-card p-lg transition-[border-color,box-shadow] duration-[var(--transition-default)] hover:border-primary-light hover:shadow-md"
          >
            <div className="mb-xs text-base font-[var(--weight-medium)] text-neutral-800">
              {service.name}
            </div>
            <div className="mb-md text-sm leading-normal text-neutral-500">
              {service.description}
            </div>
            <Link
              to={service.settingsUrl}
              className="text-sm font-[var(--weight-medium)] text-primary no-underline transition-colors duration-[var(--transition-default)] hover:text-primary-dark hover:underline"
            >
              設定を開く
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
