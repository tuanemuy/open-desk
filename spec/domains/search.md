# Search ドメイン設計

## 概要

Search ドメインは、OpenDesk プラットフォームにおける全文検索およびスコープ別検索を提供する Generic ドメインである。レコード・コメント・スレッド・ピープル・メッセージ・添付ファイルを横断的に検索し、コンテキスト（現在の画面）に応じて検索スコープを自動切替する。

**ドメイン種別**: Generic

**責務境界**:
- 全文検索インデックスの構築・更新・削除を管理する
- キーワードとスコープに基づく検索クエリの実行と結果の返却を担う
- 検索結果のスニペット生成（キーワードハイライト付き）を提供する
- 検索対象のデータ管理は各ドメイン（Record, Space, People, Message, File）に委譲する
- アクセス権に基づく検索結果のフィルタリングは AccessControl ドメインと連携する

---

## ユビキタス言語

| 英語名 | 日本語名 | 定義 |
|--------|---------|------|
| SearchQuery | 検索クエリ | 検索条件を表す値オブジェクト。キーワード・スコープ・フィルター条件を持つ |
| SearchResult | 検索結果 | 検索クエリの実行結果。マッチした項目のリストと合計件数を持つ |
| SearchResultItem | 検索結果項目 | 検索結果の1件分のデータ。タイトル・スニペット・ソース種別・所属情報を持つ |
| SearchScope | 検索スコープ | 検索の対象範囲。全体（GLOBAL）、アプリ内（APP）、スペース内（SPACE）の3種類 |
| SearchFilter | 検索フィルター | 検索結果の絞り込み条件。ソース種別・作成日範囲・作成者で絞り込む |
| SourceType | ソース種別 | 検索結果項目の元データの種類。レコード・コメント・スレッド・ピープル・メッセージ・添付ファイルの6種類 |
| Snippet | スニペット | 検索結果に表示されるテキスト抜粋。キーワード部分が `<strong>` タグでハイライトされる。約3行分 |
| SearchIndex | 検索インデックス | 全文検索のためのインデックス。各エンティティの登録・更新時にインデックスが更新される |
| Keyword | キーワード | 検索に使用する文字列。全文検索ではテキスト・PDF 内のテキストも検索対象となる |

---

## 他ドメインとの関係

| 参照先ドメイン | 参照方法 | 用途 |
|--------------|---------|------|
| Record | AppId, RecordId（値オブジェクト） | レコード・コメント検索結果のソース識別 |
| Space | SpaceId, ThreadId（値オブジェクト） | スレッド検索結果のソース識別、スペース内検索のスコープ指定 |
| Identity | UserId（値オブジェクト） | 作成者フィルター、ピープル検索結果のソース識別 |
| App | AppId（値オブジェクト） | アプリ内検索のスコープ指定 |
| File | FileKey（値オブジェクト） | 添付ファイル検索結果のソース識別 |

Search ドメインは他ドメインのエンティティを直接保持しない。検索インデックスの構築時にユースケース層でデータを取得し、SearchIndexProvider に渡す。

---

## 値オブジェクト

### SearchQuery

検索条件を表す値オブジェクト。キーワード・スコープ・フィルター条件を保持する。

```typescript
type SearchQuery = {
  readonly keyword: string;
  readonly scope: SearchScope;
  readonly filters: SearchFilter;
  readonly offset: number;
  readonly limit: number;
};

// バリデーション:
//   - keyword は空文字でないこと
//   - offset >= 0
//   - limit は 1〜100 の範囲内であること
```

### SearchScope

検索の対象範囲を表す値オブジェクト。

```typescript
type SearchScope =
  | { type: "GLOBAL" }                              // OpenDesk 全体を検索
  | { type: "APP"; appId: AppId }                   // 指定アプリ内を検索
  | { type: "SPACE"; spaceId: SpaceId };            // 指定スペース内を検索

// 自動切替ルール:
//   - ポータル画面のコンテキスト → GLOBAL
//   - アプリ画面のコンテキスト → APP（当該アプリの appId を設定）
//   - スペース画面のコンテキスト → SPACE（当該スペースの spaceId を設定）
```

### SearchFilter

検索結果の絞り込み条件。

```typescript
type SearchFilter = {
  readonly sourceTypes: SourceType[];                 // 種別フィルター（空配列は全種別）
  readonly dateRange: DateRange | null;               // 作成日の範囲
  readonly creatorId: UserId | null;                  // 作成者フィルター
};

type DateRange = {
  readonly from: Date | null;                         // 開始日（null の場合は制限なし）
  readonly to: Date | null;                           // 終了日（null の場合は制限なし）
};

// バリデーション:
//   - from と to が両方設定されている場合、from <= to であること
```

### SourceType

検索結果項目の元データの種類。

```typescript
type SourceType =
  | "RECORD"          // レコード本体
  | "COMMENT"         // レコードへのコメント
  | "THREAD"          // スペース・スレッド
  | "PEOPLE"          // ユーザー情報（ピープル）
  | "MESSAGE"         // 個人メッセージ
  | "FILE";           // 添付ファイル
```

### スコープ別の利用可能フィルター種別

```typescript
// 各スコープで利用可能な SourceType のマッピング:
//
// GLOBAL:
//   RECORD, COMMENT, THREAD, PEOPLE, MESSAGE, FILE（全6種類）
//
// APP:
//   RECORD, COMMENT, FILE（3種類）
//
// SPACE:
//   RECORD, COMMENT, THREAD, FILE（4種類）
```

### SearchResult

検索クエリの実行結果。

```typescript
type SearchResult = {
  readonly items: SearchResultItem[];
  readonly totalCount: number;
  readonly offset: number;
  readonly limit: number;
};
```

### SearchResultItem

検索結果の1件分のデータ。

```typescript
type SearchResultItem = {
  readonly title: string;                 // 結果タイトル（例: "顧客管理 REC-123"、スレッドタイトル等）
  readonly snippet: string;               // キーワードが <strong> でハイライトされたテキスト抜粋（約3行分）
  readonly sourceType: SourceType;        // ソース種別
  readonly sourceId: string;              // ソースの ID（RecordId, ThreadId, UserId 等の value）
  readonly locationName: string;          // 所属情報（アプリ名、スペース名等）
  readonly creatorName: string;           // 作成者の表示名
  readonly createdAt: Date;               // 作成日時
};
```

### IndexEntry

検索インデックスに登録するエントリ。各ドメインのエンティティからインデックス用データに変換したもの。

```typescript
type IndexEntry = {
  readonly sourceType: SourceType;
  readonly sourceId: string;
  readonly appId: string | null;          // APP スコープ検索用（レコード・コメント・ファイル用）
  readonly spaceId: string | null;        // SPACE スコープ検索用（スレッド・レコード用）
  readonly title: string;
  readonly body: string;                  // 全文検索対象のテキスト本文
  readonly creatorId: string;
  readonly creatorName: string;
  readonly locationName: string;
  readonly createdAt: Date;
};
```

---

## ポート

### SearchIndexProvider

全文検索インデックスの構築・検索を担う外部検索エンジンとのインターフェース。

```typescript
interface SearchIndexProvider {
  /**
   * キーワードとスコープに基づいて全文検索を実行する。
   * スニペットはキーワード部分が <strong> タグでハイライトされた約3行分のテキスト。
   * PDF ファイルの内容もテキスト抽出されてインデックスに含まれる。
   * @param query 検索クエリ（キーワード・スコープ・フィルター・ページネーション）
   * @returns 検索結果（項目リスト・合計件数・ページネーション情報）
   */
  search(query: SearchQuery): Promise<SearchResult>;

  /**
   * レコードを検索インデックスに登録または更新する。
   * レコードの作成・更新時にユースケース層から呼び出される。
   * @param entry インデックスエントリ
   */
  indexRecord(entry: IndexEntry): Promise<void>;

  /**
   * レコードコメントを検索インデックスに登録する。
   * コメント投稿時にユースケース層から呼び出される。
   * @param entry インデックスエントリ
   */
  indexComment(entry: IndexEntry): Promise<void>;

  /**
   * スレッドの本文を検索インデックスに登録または更新する。
   * スレッドの作成・更新時にユースケース層から呼び出される。
   * @param entry インデックスエントリ
   */
  indexThread(entry: IndexEntry): Promise<void>;

  /**
   * ユーザープロフィール情報を検索インデックスに登録または更新する。
   * プロフィール作成・更新時にユースケース層から呼び出される。
   * @param entry インデックスエントリ
   */
  indexProfile(entry: IndexEntry): Promise<void>;

  /**
   * メッセージを検索インデックスに登録する。
   * メッセージ送信時にユースケース層から呼び出される。
   * @param entry インデックスエントリ
   */
  indexMessage(entry: IndexEntry): Promise<void>;

  /**
   * 添付ファイルを検索インデックスに登録する。
   * PDF ファイルの場合はテキストを抽出してインデックスに含める。
   * PDF ファイルの場合、テキスト抽出は SearchIndexProvider の実装責務とする。ドメイン層はテキスト抽出ロジックを持たない。
   * @param entry インデックスエントリ
   */
  indexFile(entry: IndexEntry): Promise<void>;

  /**
   * 検索インデックスからエントリを削除する。
   * 元データの削除時にユースケース層から呼び出される。
   * @param sourceType ソース種別
   * @param sourceId ソースの ID
   */
  removeFromIndex(sourceType: SourceType, sourceId: string): Promise<void>;

  /**
   * 指定アプリに属するすべてのインデックスエントリを削除する。
   * アプリ削除時にユースケース層から呼び出される。
   * @param appId 削除対象のアプリ ID
   * @returns 削除されたエントリ数
   */
  removeByAppId(appId: string): Promise<number>;

  /**
   * 指定スペースに属するすべてのインデックスエントリを削除する。
   * スペース削除時にユースケース層から呼び出される。
   * @param spaceId 削除対象のスペース ID
   * @returns 削除されたエントリ数
   */
  removeBySpaceId(spaceId: string): Promise<number>;
}
```

---

## エラー型

```typescript
// 検索エラー
type EmptyKeywordError = { kind: "EmptyKeyword" };
type InvalidSearchScopeError = { kind: "InvalidSearchScope"; reason: string };
type SearchExecutionError = { kind: "SearchExecutionError"; reason: string };
type IndexUpdateError = { kind: "IndexUpdateError"; sourceType: SourceType; sourceId: string; reason: string };
type InvalidDateRangeError = { kind: "InvalidDateRange"; from: Date; to: Date };
type UnavailableSourceTypeError = { kind: "UnavailableSourceType"; sourceType: SourceType; scope: string };
```

---

## ユースケース（概要）

### 検索

| # | ユースケース名 | 概要 | 主要アクター |
|---|--------------|------|-------------|
| 1 | 全文検索 | OpenDesk 全体を対象にキーワードで全文検索する。種別・作成日範囲・作成者によるフィルタリングが可能。スコープは GLOBAL | 認証済みユーザー |
| 2 | アプリ内検索 | 指定アプリ内のレコード・コメント・添付ファイルを対象にキーワードで検索する。スコープは APP | 認証済みユーザー |
| 3 | スペース内検索 | 指定スペース内のレコード・コメント・スレッド・添付ファイルを対象にキーワードで検索する。スコープは SPACE | 認証済みユーザー |
