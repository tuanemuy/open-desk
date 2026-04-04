# Bookmark ドメイン設計

## 概要

Bookmark ドメインは、OpenDesk プラットフォームにおけるページのブックマーク（URL 保存）を管理する Generic ドメインである。ユーザーが任意のページを保存し、ヘッダーのブックマークパネルから素早くアクセスできる機能を提供する。3つのカテゴリ（アプリ・検索結果・その他）に自動分類される。

**ドメイン種別**: Generic

**責務境界**:
- ブックマークの作成・編集・削除・一覧取得を管理する
- URL パターンに基づくカテゴリの自動判定を担う
- ブックマークの表示順管理（追加順）を担う
- 「お気に入り」機能とは独立した別機能である（お気に入りはアプリ・スペースの一覧表示順に影響する機能）

---

## ユビキタス言語

| 英語名 | 日本語名 | 定義 |
|--------|---------|------|
| Bookmark | ブックマーク | ユーザーが保存した URL とその名前。カテゴリに自動分類される |
| BookmarkCategory | ブックマークカテゴリ | ブックマークの分類。アプリ（APP）・検索結果（SEARCH）・その他（OTHER）の3種類 |
| BookmarkName | ブックマーク名 | ブックマークの表示名。追加時にページタイトルから自動入力され、ユーザーが編集可能 |
| BookmarkUrl | ブックマーク URL | ブックマーク対象のページ URL。追加時に現在のページ URL から自動入力され、ユーザーが編集可能 |
| AppGrouping | アプリグルーピング | APP カテゴリのブックマークをアプリ単位でグループ化して表示する機能。アコーディオン形式で展開・折畳みが可能 |

---

## 他ドメインとの関係

| 参照先ドメイン | 参照方法 | 用途 |
|--------------|---------|------|
| Identity | UserId（値オブジェクト） | ブックマーク所有者の識別 |
| App | AppId（値オブジェクト） | APP カテゴリのブックマークのアプリグルーピング |

Bookmark ドメインは他ドメインのエンティティを直接保持しない。AppId は APP カテゴリのブックマークをアプリ単位でグルーピングするために値オブジェクトとして参照するのみ。

---

## エンティティ

### Bookmark（ブックマーク）

ユーザーが保存した URL ブックマーク。カテゴリは URL パターンに基づいて自動判定される。

#### フィールド

| フィールド名 | 型 | 必須 | 説明 |
|-------------|-----|------|------|
| bookmarkId | BookmarkId | 必須 | ブックマークの一意識別子 |
| userId | UserId | 必須 | ブックマークを所有するユーザーの ID |
| name | string | 必須 | ブックマークの表示名。ページタイトルから自動入力、編集可能 |
| url | string | 必須 | ブックマーク対象の URL |
| category | BookmarkCategory | 必須 | URL パターンに基づいて自動判定されるカテゴリ |
| appId | AppId | 任意 | APP カテゴリの場合のアプリ ID（グルーピング用）。APP 以外のカテゴリでは null |
| createdAt | Date | 必須 | 作成日時 |

#### ビヘイビア

```typescript
/**
 * ブックマーク名を変更する。
 * @param name 新しいブックマーク名
 * @throws EmptyBookmarkNameError name が空文字の場合
 */
updateName(name: string): void
// 前提条件: name が空文字でないこと
// 事後条件: name が更新される

/**
 * ブックマーク URL を変更する。
 * URL 変更に伴い、カテゴリと appId も再判定される。
 * @param url 新しい URL
 * @throws EmptyBookmarkUrlError url が空文字の場合
 */
updateUrl(url: string): void
// 前提条件: url が空文字でないこと
// 事後条件: url が更新され、category と appId が再判定される

/**
 * 指定ユーザーがこのブックマークの所有者かどうかを判定する。
 * 編集・削除権限の確認に使用する。
 */
isOwnedBy(userId: UserId): boolean
```

#### 不変条件

- `name` は空文字であってはならない
- `url` は空文字であってはならない
- `category` が `APP` の場合、`appId` は必須（非 null）
- `category` が `SEARCH` または `OTHER` の場合、`appId` は null
- `bookmarkId` は作成後に変更不可
- `userId` は作成後に変更不可
- `createdAt` は作成後に変更不可

#### ライフサイクル

1. **作成**: ブックマークパネルから「このページをブックマークする」をクリックし、名前と URL を確認して保存する。カテゴリは URL から自動判定される
2. **編集**: ブックマーク名や URL を変更する。URL 変更時はカテゴリが再判定される
3. **削除**: ブックマーク項目の「削除する」ボタンからインラインポップオーバーで確認後に削除する。確認テキスト: 「削除します。よろしいですか?」

---

## 値オブジェクト

### BookmarkId

ブックマークの一意識別子。

```typescript
type BookmarkId = {
  readonly value: string; // UUID v4 形式
};

// 等価性: value が一致すれば等しい
// バリデーション: 空文字でないこと、有効な UUID 形式であること
```

### BookmarkCategory

ブックマークのカテゴリを表す列挙型。

```typescript
type BookmarkCategory =
  | "APP"       // アプリの URL（/k/{id}/ 形式にマッチ）
  | "SEARCH"    // 検索結果の URL（/k/search?... 形式にマッチ）
  | "OTHER";    // 上記以外の URL（ポータル、スペース等）
```

### カテゴリ自動判定ルール

```typescript
// URL パターンに基づくカテゴリ自動判定ルール:
//
// 1. APP: URL パスが /k/{数値}/ にマッチする場合
//    - 例: /k/4/, /k/4/show#record=1
//    - appId として URL 内のアプリ ID を抽出・設定する
//
// 2. SEARCH: URL パスが /k/search にマッチする場合
//    - 例: /k/search?keyword=テスト
//    - appId は null
//
// 3. OTHER: 上記いずれにもマッチしない場合
//    - 例: /k/ (ポータル), /k/space/1 (スペース)
//    - appId は null
```

---

## ドメインサービス

### BookmarkCategorizationService

URL パターンに基づくカテゴリ判定ロジックを提供するドメインサービス。Bookmark エンティティの作成時および URL 変更時に使用する。

#### メソッド

```typescript
/**
 * URL からブックマークカテゴリを判定する。
 * @param url ブックマーク対象の URL
 * @returns カテゴリと appId（APP カテゴリの場合のみ非 null）
 */
categorize(url: string): { category: BookmarkCategory; appId: AppId | null }
// 処理:
//   1. URL パスが /k/{数値}/ にマッチする場合、category = APP、appId = マッチした数値
//   2. URL パスが /k/search にマッチする場合、category = SEARCH、appId = null
//   3. 上記以外の場合、category = OTHER、appId = null
```

---

## ポート

### BookmarkRepository

ブックマークの永続化を担うリポジトリインターフェース。

```typescript
interface BookmarkRepository {
  /**
   * ブックマーク ID でブックマークを取得する。
   * @param bookmarkId ブックマークの一意識別子
   * @returns ブックマーク。存在しない場合は null
   */
  findById(bookmarkId: BookmarkId): Promise<Bookmark | null>;

  /**
   * 指定ユーザーの全ブックマークを取得する（作成日時の昇順）。
   * @param userId ユーザーの ID
   * @returns ブックマークの配列（作成日時の昇順 = 追加順）
   */
  findByUserId(userId: UserId): Promise<Bookmark[]>;

  /**
   * 指定ユーザーのブックマークをカテゴリで絞り込んで取得する（作成日時の昇順）。
   * @param userId ユーザーの ID
   * @param category フィルタリングするカテゴリ
   * @returns 指定カテゴリのブックマークの配列（作成日時の昇順）
   */
  findByCategory(
    userId: UserId,
    category: BookmarkCategory
  ): Promise<Bookmark[]>;

  /**
   * 指定ユーザーのブックマークを3カテゴリに分類してまとめて取得する。
   * ブックマークパネルの初期表示用。
   * @param userId ユーザーの ID
   * @returns カテゴリ別のブックマーク（各配列は作成日時の昇順）
   */
  findAllGroupedByCategory(userId: UserId): Promise<{
    app: Bookmark[];
    search: Bookmark[];
    other: Bookmark[];
  }>;

  /**
   * ブックマークを保存する（新規作成・更新の両方に対応）。
   * @param bookmark 保存対象のブックマーク
   */
  save(bookmark: Bookmark): Promise<void>;

  /**
   * ブックマークを削除する。
   * @param bookmarkId 削除対象のブックマーク ID
   * @throws BookmarkNotFoundError ブックマークが存在しない場合
   */
  delete(bookmarkId: BookmarkId): Promise<void>;
}
```

---

## エラー型

```typescript
// ブックマーク操作エラー
type BookmarkNotFoundError = { kind: "BookmarkNotFound"; bookmarkId: BookmarkId };
type EmptyBookmarkNameError = { kind: "EmptyBookmarkName" };
type EmptyBookmarkUrlError = { kind: "EmptyBookmarkUrl" };
type BookmarkNotOwnedError = { kind: "BookmarkNotOwned"; bookmarkId: BookmarkId; userId: UserId };
```

---

## ユースケース（概要）

### ブックマーク管理

| # | ユースケース名 | 概要 | 主要アクター |
|---|--------------|------|-------------|
| 1 | ブックマーク作成 | 現在のページ URL と名前（ページタイトルから自動入力）を指定してブックマークを作成する。カテゴリは URL パターンから自動判定される。成功時にトースト通知「ブックマークに保存されました。」を表示する | 認証済みユーザー |
| 2 | ブックマーク編集（名前/URL） | 既存ブックマークの名前や URL を変更する。URL 変更時はカテゴリが再判定される。所有者のみ編集可能 | 認証済みユーザー |
| 3 | ブックマーク削除 | インラインポップオーバーで「削除します。よろしいですか?」を確認した後、ブックマークを削除する。所有者のみ削除可能 | 認証済みユーザー |
| 4 | ブックマーク一覧取得（カテゴリ別） | ユーザーのブックマークを3カテゴリ（アプリ・検索結果・その他）に分類して取得する。APP カテゴリはアプリ単位でグルーピングされ、アコーディオン形式で表示される。全カテゴリが空の場合は「ブックマークはありません。」を表示する | 認証済みユーザー |
