import { Database, FileText, LayoutGrid, Users } from "lucide-react";
import { Link } from "react-router";
import type { Route } from "./+types/index";

export { loader } from "./loader";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Apps - OpenDesk" }];
}

const appIcons: Record<string, typeof FileText> = {
  "File Management": FileText,
  "Customer List": Users,
  Attendance: LayoutGrid,
  "Project Management": Database,
  Inventory: Database,
};

export default function AppsPage({ loaderData }: Route.ComponentProps) {
  const { apps } = loaderData;

  return (
    <div className="mx-auto max-w-[1400px] px-xl py-lg">
      {/* Breadcrumb */}
      <nav>
        <ol className="mb-md flex list-none items-center gap-xs text-sm text-neutral-500">
          <li>
            <Link
              to="/portal"
              className="text-primary no-underline transition-colors duration-[var(--transition-default)] hover:text-primary-dark hover:underline"
            >
              Portal
            </Link>
          </li>
          <li className="text-xs text-neutral-400">&gt;</li>
          <li>Apps</li>
        </ol>
      </nav>

      {/* Page Title */}
      <div className="mb-lg flex items-center justify-between">
        <h1 className="font-heading text-2xl font-[var(--weight-semibold)] tracking-tight text-neutral-900">
          Apps
        </h1>
      </div>

      {/* App Cards Grid */}
      <div className="grid grid-cols-3 gap-md">
        {apps.map((app) => {
          const IconComponent = appIcons[app.name] ?? Database;
          return (
            <Link
              key={app.id}
              to={`/apps/${app.id}`}
              className="group flex items-start gap-md rounded-lg border border-neutral-200 bg-bg-card p-lg no-underline transition-[border-color,box-shadow] duration-[var(--transition-default)] hover:border-neutral-300 hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-neutral-150 text-neutral-600">
                <IconComponent size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-base font-[var(--weight-semibold)] text-neutral-900 group-hover:text-primary">
                  {app.name}
                </div>
                <div className="mt-xs text-sm text-neutral-500">
                  {app.spaceName}
                </div>
                <div className="mt-sm flex items-center gap-md text-xs text-neutral-400">
                  <span>{app.recordCount} records</span>
                  <span>Updated: {app.updatedAt}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
