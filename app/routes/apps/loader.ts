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

export async function loader(_args: Route.LoaderArgs): Promise<AppsLoaderData> {
  const apps: AppListItem[] = [
    {
      id: "1",
      name: "File Management",
      spaceName: "Development Team",
      spaceId: "1",
      recordCount: 42,
      updatedAt: "2026/04/05 14:30",
    },
    {
      id: "2",
      name: "Customer List",
      spaceName: "Sales",
      spaceId: "2",
      recordCount: 24,
      updatedAt: "2026/04/04 10:15",
    },
    {
      id: "3",
      name: "Attendance",
      spaceName: "General Affairs",
      spaceId: "3",
      recordCount: 156,
      updatedAt: "2026/04/06 09:00",
    },
    {
      id: "4",
      name: "Project Management",
      spaceName: "Development Team",
      spaceId: "1",
      recordCount: 89,
      updatedAt: "2026/04/05 16:45",
    },
    {
      id: "5",
      name: "Inventory",
      spaceName: "Operations",
      spaceId: "4",
      recordCount: 312,
      updatedAt: "2026/04/03 11:20",
    },
  ];

  return { apps };
}
