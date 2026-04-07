import type { Route } from "./+types/index";

type MessageEntry = {
  id: string;
  senderName: string;
  senderInitial: string;
  isSelf: boolean;
  time: string;
  body: string[];
};

type Recipient = {
  id: string;
  name: string;
  initial: string;
};

export type MessageThreadLoaderData = {
  recipient: Recipient;
  messages: MessageEntry[];
};

export async function loader({
  params,
}: Route.LoaderArgs): Promise<MessageThreadLoaderData> {
  const _threadId = params.threadId;

  const recipient: Recipient = {
    id: "2",
    name: "田中太郎",
    initial: "田",
  };

  const messages: MessageEntry[] = [
    {
      id: "1",
      senderName: "自分",
      senderInitial: "大",
      isSelf: true,
      time: "2026年4月5日 09:30",
      body: [
        "田中さん、おはようございます。先日のミーティングで話した件ですが、クライアント向けの提案書のドラフトができました。確認していただけますか?",
      ],
    },
    {
      id: "2",
      senderName: "田中太郎",
      senderInitial: "田",
      isSelf: false,
      time: "2026年4月5日 10:15",
      body: [
        "おはようございます。もちろんです、確認しますね。ファイル管理アプリにアップロードしていただければ、今日中にフィードバックをお返しします。",
      ],
    },
    {
      id: "3",
      senderName: "自分",
      senderInitial: "大",
      isSelf: true,
      time: "2026年4月5日 10:22",
      body: [
        "ありがとうございます。先ほどアップロードしました。「提案書_v1_20260405.pdf」というファイル名です。特に第3章のコスト試算の部分を重点的に見ていただけると助かります。",
      ],
    },
    {
      id: "4",
      senderName: "田中太郎",
      senderInitial: "田",
      isSelf: false,
      time: "2026年4月5日 14:45",
      body: [
        "確認しました。全体的に良くまとまっていると思います。いくつか気になった点をコメントに残しておきました。",
        "コスト試算について、運用コストの見積もりがやや低めに見えるので、再度確認した方がいいかもしれません。来週のクライアントミーティングまでに修正版を仕上げましょう。",
      ],
    },
    {
      id: "5",
      senderName: "自分",
      senderInitial: "大",
      isSelf: true,
      time: "2026年4月5日 15:10",
      body: [
        "詳細なフィードバックありがとうございます。運用コストの部分は確かにもう少し精査が必要ですね。明日までに修正版を作成します。木曜日に最終レビューの時間をいただけますか?",
      ],
    },
  ];

  return { recipient, messages };
}
