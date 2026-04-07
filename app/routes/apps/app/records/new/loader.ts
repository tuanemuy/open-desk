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
}: Route.LoaderArgs): Promise<NewRecordLoaderData> {
  const appId = params.appId;

  const app: AppInfo = {
    id: appId,
    name: "Customer List",
    spaceName: "Your Team Communication Space",
    spaceId: "1",
  };

  const rankOptions: RankOption[] = [
    { value: "", label: "-----" },
    { value: "A", label: "A" },
    { value: "B", label: "B" },
    { value: "C", label: "C" },
  ];

  return { app, rankOptions };
}
