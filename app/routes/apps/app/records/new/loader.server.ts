import { data } from "react-router";
import { container } from "@/core/application/container/server.instance";
import { AppId } from "@/core/domain/app/valueObject";
import type { SpaceId } from "@/core/domain/space/valueObject";
import { requireAuth } from "@/lib/session.server";
import type { Route } from "./+types/index";

type AppInfo = {
  id: string;
  name: string;
  spaceName: string;
  spaceId: string;
};

type RankOption = {
  value: string;
  label: string;
};

export type NewRecordLoaderData = {
  app: AppInfo;
  rankOptions: RankOption[];
};

export async function loader({
  params,
  request,
}: Route.LoaderArgs): Promise<NewRecordLoaderData> {
  await requireAuth(request, container);

  const appId = params.appId;

  const { appEntity, fields } = await container.unitOfWorkProvider.transaction(
    async (ctx) => {
      const found = await ctx.appRepository.findById(AppId.create(appId));
      const fieldList = await ctx.fieldRepository.findByAppId(
        AppId.create(appId),
      );
      return { appEntity: found, fields: fieldList };
    },
  );

  if (!appEntity) {
    throw data({ message: "App not found" }, { status: 404 });
  }

  let spaceName = "";
  if (appEntity.spaceId) {
    const space = await container.unitOfWorkProvider.transaction(async (ctx) =>
      ctx.spaceRepository.findById(appEntity.spaceId as unknown as SpaceId),
    );
    if (space) {
      spaceName = space.name as string;
    }
  }

  const app: AppInfo = {
    id: appEntity.appId as string,
    name: appEntity.name as string,
    spaceName,
    spaceId: (appEntity.spaceId as string) ?? "",
  };

  const rankOptions: RankOption[] = [{ value: "", label: "-----" }];
  for (const field of fields) {
    if (field.properties.type === "DROP_DOWN" && field.fieldCode === "rank") {
      for (const opt of field.properties.options) {
        rankOptions.push({ value: opt.label, label: opt.label });
      }
    }
  }

  return { app, rankOptions };
}
