import { Link } from "react-router";
import type { Route } from "./+types/index";

export { loader } from "./loader.server";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "ピープル - OpenDesk" }];
}

const avatarColors = [
  "bg-primary",
  "bg-accent",
  "bg-success",
  "bg-warning",
] as const;

export default function PeoplePage({ loaderData }: Route.ComponentProps) {
  const { users } = loaderData;

  return (
    <div className="mx-auto max-w-[1400px] px-xl">
      <div className="border-b border-neutral-200 py-lg">
        <h2 className="font-heading text-2xl font-[var(--weight-semibold)] leading-tight tracking-tight text-neutral-900">
          ピープル
        </h2>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-md py-lg pb-2xl">
        {users.map((user, index) => (
          <Link
            key={user.id}
            to={`/people/${user.id}`}
            className="flex items-center gap-md rounded-lg border border-neutral-200 bg-bg-card p-lg no-underline transition-shadow duration-[var(--transition-default)] hover:shadow-md"
          >
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-[var(--weight-semibold)] text-on-primary ${avatarColors[index % avatarColors.length]}`}
            >
              {user.initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-[var(--weight-medium)] text-neutral-800">
                {user.name}
              </div>
              <div className="truncate text-xs text-neutral-500">
                {user.email}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
