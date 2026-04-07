import type { Route } from "./+types/index";

export type ResultType =
  | "record"
  | "comment"
  | "thread"
  | "people"
  | "message"
  | "file";

export type SearchResult = {
  id: string;
  type: ResultType;
  title: string;
  snippetParts: SnippetPart[];
  location: string;
  author: string | null;
  createdAt: string;
};

export type SnippetPart = {
  text: string;
  highlighted: boolean;
};

export type SearchLoaderData = {
  keyword: string;
  results: SearchResult[];
  totalCount: number;
};

export async function loader({
  request,
}: Route.LoaderArgs): Promise<SearchLoaderData> {
  const url = new URL(request.url);
  const keyword = url.searchParams.get("keyword") ?? "";

  const results: SearchResult[] = [
    {
      id: "1",
      type: "record",
      title: "顧客リスト レコード#3",
      snippetParts: [
        { text: "株式会社", highlighted: false },
        { text: "テスト", highlighted: true },
        {
          text: "エンジニアリング - 東京都渋谷区に本社を置く、ソフトウェア開発企業です。主に業務システムの設計・開発を手掛けています。",
          highlighted: false,
        },
      ],
      location: "営業支援スペース / 顧客リスト",
      author: "山田 花子",
      createdAt: "2026-04-05 14:30",
    },
    {
      id: "2",
      type: "record",
      title: "案件管理 レコード#15",
      snippetParts: [
        { text: "テスト", highlighted: true },
        {
          text: "環境構築プロジェクト - クライアント向け受入",
          highlighted: false,
        },
        { text: "テスト", highlighted: true },
        {
          text: "の環境を整備するプロジェクトです。4月末までに完了予定。",
          highlighted: false,
        },
      ],
      location: "開発部スペース / 案件管理",
      author: "佐藤 一郎",
      createdAt: "2026-04-04 10:15",
    },
    {
      id: "3",
      type: "comment",
      title: "案件管理 レコード#15 コメント",
      snippetParts: [
        { text: "単体", highlighted: false },
        { text: "テスト", highlighted: true },
        {
          text: "の結果を確認しました。3件の不具合が見つかりましたので、修正をお願いいたします。詳細はチケットに記載しています。",
          highlighted: false,
        },
      ],
      location: "開発部スペース / 案件管理",
      author: "鈴木 次郎",
      createdAt: "2026-04-04 16:42",
    },
    {
      id: "4",
      type: "thread",
      title: "結合テスト計画について",
      snippetParts: [
        { text: "次期リリースに向けた結合", highlighted: false },
        { text: "テスト", highlighted: true },
        { text: "の計画を共有します。", highlighted: false },
        { text: "テスト", highlighted: true },
        {
          text: "期間は4月15日〜4月25日を予定しています。各チームのリソース確認をお願いします。",
          highlighted: false,
        },
      ],
      location: "開発部スペース",
      author: "佐藤 一郎",
      createdAt: "2026-04-03 09:00",
    },
    {
      id: "5",
      type: "people",
      title: "テスト 太郎",
      snippetParts: [
        { text: "品質管理部 / QAエンジニア - 自動", highlighted: false },
        { text: "テスト", highlighted: true },
        {
          text: "の推進と品質基準の策定を担当しています。",
          highlighted: false,
        },
      ],
      location: "ピープル",
      author: null,
      createdAt: "2026-01-10 08:00",
    },
    {
      id: "6",
      type: "message",
      title: "山田 花子 からのメッセージ",
      snippetParts: [
        { text: "テスト", highlighted: true },
        {
          text: "データの準備について確認です。顧客リストの",
          highlighted: false,
        },
        { text: "テスト", highlighted: true },
        {
          text: "用サンプルは先日お送りしたファイルで問題ないでしょうか?",
          highlighted: false,
        },
      ],
      location: "メッセージ",
      author: "山田 花子",
      createdAt: "2026-04-02 11:20",
    },
    {
      id: "7",
      type: "file",
      title: "テスト仕様書_v2.xlsx",
      snippetParts: [
        { text: "結合", highlighted: false },
        { text: "テスト", highlighted: true },
        { text: "仕様書 第2版 - ", highlighted: false },
        { text: "テスト", highlighted: true },
        {
          text: "ケース一覧、期待結果、実施手順を記載した仕様書です。前回レビューの指摘を反映済み。",
          highlighted: false,
        },
      ],
      location: "開発部スペース / 案件管理 レコード#15",
      author: "鈴木 次郎",
      createdAt: "2026-04-03 15:00",
    },
    {
      id: "8",
      type: "record",
      title: "タスク管理 レコード#42",
      snippetParts: [
        { text: "受入", highlighted: false },
        { text: "テスト", highlighted: true },
        { text: "実施 - クライアントによる受入", highlighted: false },
        { text: "テスト", highlighted: true },
        { text: "を実施する。", highlighted: false },
        { text: "テスト", highlighted: true },
        {
          text: "シナリオに沿って全機能を検証し、結果を報告書にまとめる。",
          highlighted: false,
        },
      ],
      location: "開発部スペース / タスク管理",
      author: "田中 太郎",
      createdAt: "2026-04-01 13:45",
    },
  ];

  return {
    keyword: keyword || "テスト",
    results,
    totalCount: results.length,
  };
}
