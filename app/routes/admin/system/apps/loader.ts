import { container } from "@/core/application/container/server.instance";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

export type AppItem = {
  id: string;
  name: string;
  space: string;
  status: "active" | "inactive";
  recordCount: number;
  fieldCount: number;
};

import type { LicenseInfo } from "@/components/admin/LicenseCard";

export type { LicenseInfo };

export type AppsLoaderData = {
  licenses: LicenseInfo[];
  apps: AppItem[];
};

export async function loader({
  request,
}: Route.LoaderArgs): Promise<AppsLoaderData> {
  await requireAuth(request, container);

  const result = await container.unitOfWorkProvider.transaction(async (ctx) => {
    const apps = await ctx.appRepository.list({}, 0, 100);
    const totalCount = await ctx.appRepository.countAll();

    const appItems: AppItem[] = await Promise.all(
      apps.map(async (app) => {
        const fieldCount = await ctx.fieldRepository.countByAppId(app.appId);
        const recordCount = await ctx.recordRepository.count(app.appId);

        let spaceName = "-";
        if (app.spaceId) {
          const space = await ctx.spaceRepository.findById(app.spaceId);
          if (space) {
            spaceName = space.name;
          }
        }

        return {
          id: app.appId,
          name: app.name,
          space: spaceName,
          status: app.status === "DELETED" ? "inactive" : ("active" as const),
          recordCount,
          fieldCount,
        };
      }),
    );

    return { appItems, totalCount };
  });

  return {
    licenses: [
      { label: "アプリ数", current: result.totalCount, limit: 1000 },
      { label: "1日のAPIリクエスト数", current: 0, limit: 10000 },
      { label: "カスタマイズ可能なアプリ数", current: 0, limit: null },
    ],
    apps: result.appItems,
  };
}
