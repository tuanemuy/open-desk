import type { Route } from "./+types/index";

type ThreadItem = {
  id: string;
  title: string;
  lastUpdated: string;
};

type AppItem = {
  id: string;
  name: string;
  kind: "file" | "customer" | "task";
};

type MemberItem = {
  id: string;
  name: string;
  initial: string;
  colorIndex: 1 | 2 | 3 | 4;
};

type LinkItem = {
  id: string;
  label: string;
  url: string;
};

export type SpaceLoaderData = {
  space: {
    id: string;
    name: string;
    isPublic: boolean;
    isFavorite: boolean;
    announcementHtml: string;
  };
  threads: ThreadItem[];
  apps: AppItem[];
  members: MemberItem[];
  links: LinkItem[];
};

export async function loader({
  params,
}: Route.LoaderArgs): Promise<SpaceLoaderData> {
  const _spaceId = params.spaceId;

  const space = {
    id: _spaceId,
    name: "製品開発チーム",
    isPublic: true,
    isFavorite: false,
    announcementHtml: "",
  };

  const threads: ThreadItem[] = [
    { id: "1", title: "v2.5 リリース計画について", lastUpdated: "2時間前" },
    { id: "2", title: "デザインシステムの刷新", lastUpdated: "昨日" },
    { id: "3", title: "新人オンボーディング資料", lastUpdated: "3日前" },
  ];

  const apps: AppItem[] = [
    { id: "1", name: "ファイル管理", kind: "file" },
    { id: "2", name: "顧客リスト", kind: "customer" },
    { id: "3", name: "タスク管理", kind: "task" },
  ];

  const members: MemberItem[] = [
    { id: "1", name: "大田部 晃", initial: "大", colorIndex: 1 },
    { id: "2", name: "田中 太郎", initial: "田", colorIndex: 2 },
    { id: "3", name: "佐藤 花子", initial: "佐", colorIndex: 3 },
    { id: "4", name: "鈴木 一郎", initial: "鈴", colorIndex: 4 },
  ];

  const links: LinkItem[] = [
    { id: "1", label: "製品ロードマップ (Notion)", url: "#" },
    { id: "2", label: "GitHub リポジトリ", url: "#" },
  ];

  return { space, threads, apps, members, links };
}
