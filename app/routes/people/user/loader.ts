import type { Route } from "./+types/index";

type Post = {
  id: string;
  authorName: string;
  authorInitial: string;
  colorIndex: 1 | 2 | 3;
  time: string;
  body: string;
};

type UserProfile = {
  id: string;
  name: string;
  initial: string;
  email: string;
  isSelf: boolean;
};

export type UserLoaderData = {
  user: UserProfile;
  posts: Post[];
};

export async function loader({
  params,
}: Route.LoaderArgs): Promise<UserLoaderData> {
  const _userId = params.userId;

  const user: UserProfile = {
    id: _userId,
    name: "大田部 晃",
    initial: "大",
    email: "otabe.akira@example.com",
    isSelf: true,
  };

  const posts: Post[] = [
    {
      id: "1",
      authorName: "大田部 晃",
      authorInitial: "大",
      colorIndex: 1,
      time: "2026年4月6日 18:30",
      body: "v2.5のリリース準備が順調に進んでいます。今週中にフィーチャーフリーズを実施し、来週からQAテストに入ります。チームの皆さん、引き続きよろしくお願いします。",
    },
    {
      id: "2",
      authorName: "大田部 晃",
      authorInitial: "大",
      colorIndex: 1,
      time: "2026年4月3日 09:15",
      body: "新しいダッシュボード機能のプロトタイプが完成しました。フィードバックをお待ちしています。デモは明日のミーティングで行います。",
    },
    {
      id: "3",
      authorName: "大田部 晃",
      authorInitial: "大",
      colorIndex: 1,
      time: "2026年3月28日 14:45",
      body: "チーム合宿の日程が決まりました。5月15日〜16日で箱根にて開催予定です。詳細は追ってスペースのスレッドで共有します。参加表明は来週金曜までにお願いします。",
    },
  ];

  return { user, posts };
}
