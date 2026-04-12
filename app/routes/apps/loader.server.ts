import { container } from "@/core/application/container/server.instance";
import type { SpaceId } from "@/core/domain/space/valueObject";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

type AppListItem = {
  id: string;
  name: string;
  spaceName: string;
  spaceId: string;
  recordCount: number;
  updatedAt: string;
};

export type AppsLoaderData = {
  apps: AppListItem[];
};

export async function loader(args: Route.LoaderArgs): Promise<AppsLoaderData> {
  await requireAuth(args.request, container);

  const apps = await container.unitOfWorkProvider.transaction(async (ctx) => {
    const allApps = await ctx.appRepository.list({}, 0, 1000);

    const spaceIds = [
      ...new Set(
        allApps
          .filter((a) => a.spaceId !== null)
          .map((a) => a.spaceId as string),
      ),
    ];
    const spaces = await Promise.all(
      spaceIds.map((id) => ctx.spaceRepository.findById(id as SpaceId)),
    );
    const spaceNameMap = new Map<string, string>();
    for (const space of spaces) {
      if (space) {
        spaceNameMap.set(space.spaceId as string, space.name as string);
      }
    }

    const appCounts = await Promise.all(
      allApps.map((a) => ctx.recordRepository.count(a.appId).catch(() => 0)),
    );

    const items: AppListItem[] = allApps.map((app, i) => {
      const spaceId = (app.spaceId as string) ?? "";
      return {
        id: app.appId as string,
        name: app.name as string,
        spaceName: spaceNameMap.get(spaceId) ?? "",
        spaceId,
        recordCount: appCounts[i] ?? 0,
        updatedAt: formatDate(app.updatedAt),
      };
    });

    return items;
  });

  return { apps };
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${y}/${m}/${d} ${h}:${min}`;
}
