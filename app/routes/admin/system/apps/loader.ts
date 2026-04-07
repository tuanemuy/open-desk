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

export type LicenseInfo = {
  label: string;
  current: number;
  limit: number | null;
};

export type AppsLoaderData = {
  licenses: LicenseInfo[];
  apps: AppItem[];
};

export async function loader({
  request,
}: Route.LoaderArgs): Promise<AppsLoaderData> {
  await requireAuth(request, container);

  return {
    licenses: [
      { label: "アプリ数", current: 15, limit: 1000 },
      { label: "1日のAPIリクエスト数", current: 245, limit: 10000 },
      { label: "カスタマイズ可能なアプリ数", current: 5, limit: null },
    ],
    apps: [
      {
        id: "1",
        name: "顧客リスト",
        space: "営業部",
        status: "active",
        recordCount: 1248,
        fieldCount: 18,
      },
      {
        id: "2",
        name: "ファイル管理",
        space: "総務部",
        status: "active",
        recordCount: 532,
        fieldCount: 12,
      },
      {
        id: "3",
        name: "勤怠管理",
        space: "人事部",
        status: "active",
        recordCount: 8921,
        fieldCount: 24,
      },
      {
        id: "4",
        name: "経費精算",
        space: "経理部",
        status: "inactive",
        recordCount: 3456,
        fieldCount: 15,
      },
      {
        id: "5",
        name: "案件管理",
        space: "営業部",
        status: "active",
        recordCount: 672,
        fieldCount: 22,
      },
    ],
  };
}
