import type { Route } from "./+types/index";

export type NotificationItem = {
  id: string;
  appName: string;
  title: string;
  description: string;
  timeAgo: string;
  userName: string;
  unread: boolean;
};

export type NotificationsLoaderData = {
  notifications: NotificationItem[];
};

export async function loader(
  _args: Route.LoaderArgs,
): Promise<NotificationsLoaderData> {
  const notifications: NotificationItem[] = [
    {
      id: "1",
      appName: "顧客リスト",
      title: "鈴木 花子さんがレコード「株式会社アルファ」にコメントしました",
      description:
        "「次回の商談日程は4/15に変更でお願いします。担当の佐藤さんにも共有お願いします。」",
      timeAgo: "5分前",
      userName: "鈴木 花子",
      unread: true,
    },
    {
      id: "2",
      appName: "プロジェクト管理",
      title:
        "佐藤 一郎さんがタスク「API設計書の作成」のステータスを「完了」に変更しました",
      description: "開発チーム > プロジェクト管理 > ステータス変更",
      timeAgo: "15分前",
      userName: "佐藤 一郎",
      unread: true,
    },
    {
      id: "3",
      appName: "ファイル管理",
      title: "田中 美咲さんが「2026年度予算書.xlsx」をアップロードしました",
      description: "営業部 > ファイル管理 > ファイルアップロード",
      timeAgo: "30分前",
      userName: "田中 美咲",
      unread: true,
    },
    {
      id: "4",
      appName: "勤怠管理",
      title: "高橋 健太さんがあなたの4月分勤怠を承認しました",
      description: "総務・人事 > 勤怠管理 > 承認完了",
      timeAgo: "1時間前",
      userName: "高橋 健太",
      unread: true,
    },
    {
      id: "5",
      appName: "顧客リスト",
      title: "山本 裕子さんがレコード「株式会社ベータ商事」を更新しました",
      description: "「契約ステータス」を「交渉中」から「契約済」に変更",
      timeAgo: "2時間前",
      userName: "山本 裕子",
      unread: true,
    },
    {
      id: "6",
      appName: "プロジェクト管理",
      title:
        "中村 大輔さんがあなたをタスク「フロントエンド改修」の担当者に追加しました",
      description: "開発チーム > プロジェクト管理 > 担当者変更",
      timeAgo: "3時間前",
      userName: "中村 大輔",
      unread: true,
    },
    {
      id: "7",
      appName: "ファイル管理",
      title: "鈴木 花子さんが「Q1レポート_最終版.pdf」にコメントしました",
      description: "「レビュー完了です。3ページ目の数値を確認お願いします。」",
      timeAgo: "4時間前",
      userName: "鈴木 花子",
      unread: true,
    },
    {
      id: "8",
      appName: "問い合わせ管理",
      title: "新しい問い合わせ「アカウント設定について」が登録されました",
      description: "営業部 > 問い合わせ管理 > 新規登録",
      timeAgo: "5時間前",
      userName: "伊藤 真理",
      unread: true,
    },
    {
      id: "9",
      appName: "勤怠管理",
      title: "月次勤怠締めのリマインダー: 4月分の勤怠入力期限は4/10です",
      description: "総務・人事 > 勤怠管理 > リマインダー",
      timeAgo: "昨日",
      userName: "システム通知",
      unread: true,
    },
    {
      id: "10",
      appName: "プロジェクト管理",
      title:
        "佐藤 一郎さんがスレッド「リリーススケジュールの調整」であなたをメンションしました",
      description: "「@山田 太郎 デプロイ日程の確認をお願いできますか?」",
      timeAgo: "昨日",
      userName: "佐藤 一郎",
      unread: true,
    },
  ];

  return { notifications };
}
