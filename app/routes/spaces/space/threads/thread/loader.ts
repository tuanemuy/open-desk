import type { Route } from "./+types/index";

type SidebarThread = {
  id: string;
  title: string;
  commentCount: number;
};

type SidebarApp = {
  id: string;
  name: string;
  kind: "file" | "customer";
};

type SidebarMember = {
  id: string;
  name: string;
  initial: string;
  colorIndex: 1 | 2 | 3 | 4;
};

type Comment = {
  id: string;
  author: string;
  initial: string;
  colorIndex: 1 | 2 | 3 | 4;
  time: string;
  body: string[];
};

export type ThreadLoaderData = {
  space: {
    id: string;
    name: string;
  };
  thread: {
    id: string;
    title: string;
    author: string;
    createdAt: string;
    body: string[];
    listItems: string[];
  };
  sidebarThreads: SidebarThread[];
  sidebarApps: SidebarApp[];
  sidebarMembers: SidebarMember[];
  comments: Comment[];
};

export async function loader({
  params,
}: Route.LoaderArgs): Promise<ThreadLoaderData> {
  const _spaceId = params.spaceId;
  const _threadId = params.threadId;

  const space = {
    id: _spaceId,
    name: "製品開発チーム",
  };

  const thread = {
    id: _threadId,
    title: "v2.5 リリース計画について",
    author: "大田部 晃",
    createdAt: "2026年4月5日 10:30",
    body: [
      "v2.5 リリースに向けた計画を共有します。以下のスケジュールで進めていきたいと考えています。",
      "各チームは4月11日までに担当機能の開発を完了させてください。テスト項目のレビューは来週の水曜ミーティングで行います。",
    ],
    listItems: [
      "4月11日: フィーチャーフリーズ",
      "4月14日 - 4月18日: QAテスト期間",
      "4月21日: リリース候補版の確定",
      "4月25日: 本番リリース",
    ],
  };

  const sidebarThreads: SidebarThread[] = [
    { id: "1", title: "v2.5 リリース計画について", commentCount: 3 },
    { id: "2", title: "デザインシステムの刷新", commentCount: 8 },
    { id: "3", title: "新人オンボーディング資料", commentCount: 2 },
    { id: "4", title: "Q3 目標と KPI 設定", commentCount: 5 },
    { id: "5", title: "開発環境の改善提案", commentCount: 1 },
  ];

  const sidebarApps: SidebarApp[] = [
    { id: "1", name: "ファイル管理", kind: "file" },
    { id: "2", name: "顧客リスト", kind: "customer" },
  ];

  const sidebarMembers: SidebarMember[] = [
    { id: "1", name: "大田部 晃", initial: "大", colorIndex: 1 },
    { id: "2", name: "田中 太郎", initial: "田", colorIndex: 2 },
    { id: "3", name: "佐藤 花子", initial: "佐", colorIndex: 3 },
    { id: "4", name: "鈴木 一郎", initial: "鈴", colorIndex: 4 },
  ];

  const comments: Comment[] = [
    {
      id: "1",
      author: "田中 太郎",
      initial: "田",
      colorIndex: 2,
      time: "2026年4月5日 11:15",
      body: [
        "スケジュール確認しました。フロントエンドチームは予定通り進められそうです。テスト項目のドラフトは今週中に共有します。",
      ],
    },
    {
      id: "2",
      author: "佐藤 花子",
      initial: "佐",
      colorIndex: 3,
      time: "2026年4月5日 13:42",
      body: [
        "デザインチームからの確認です。新しいダッシュボード画面のデザインは完了済みですが、モバイル対応の調整がもう少しかかりそうです。4月9日までには仕上げます。",
      ],
    },
    {
      id: "3",
      author: "鈴木 一郎",
      initial: "鈴",
      colorIndex: 4,
      time: "2026年4月5日 14:20",
      body: [
        "バックエンドのAPI変更について、互換性の確認が必要な箇所があります。明日のスタンドアップで詳細を共有させてください。",
      ],
    },
    {
      id: "4",
      author: "大田部 晃",
      initial: "大",
      colorIndex: 1,
      time: "2026年4月5日 15:05",
      body: [
        "皆さん、ご確認ありがとうございます。佐藤さん、モバイル対応は4月9日で問題ありません。鈴木さん、明日のスタンドアップで共有お願いします。",
      ],
    },
  ];

  return {
    space,
    thread,
    sidebarThreads,
    sidebarApps,
    sidebarMembers,
    comments,
  };
}
