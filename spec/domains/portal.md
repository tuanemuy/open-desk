# Portal ドメイン設計

## 概要

Portal ドメインは、OpenDesk のホーム画面（ポータル）に表示されるお知らせ掲示板とウィジェット集約を管理する Generic ドメインである。お知らせ掲示板はリッチテキスト（HTML）形式のコンテンツを持ち、システム管理者または cybozu.com 共通管理者のみが編集できる。ウィジェット（通知・スペース・アプリ）は他ドメインからの読み取り専用集約であり、Portal ドメイン固有のエンティティとしては管理しない。

---

## ユビキタス言語

| 英語名 | 日本語名 | 定義 |
|--------|---------|------|
| Portal | ポータル | OpenDesk のホーム画面。お知らせ掲示板とウィジェット群を集約して表示する |
| PortalAnnouncement | お知らせ掲示板 | ポータル画面の左側に表示されるリッチテキストコンテンツ。タイトルと本文を持つ |
| PortalWidget | ポータルウィジェット | ポータル画面の右側に表示される情報パネル。通知・スペース・アプリの3種類がある |
| NotificationWidget | 通知ウィジェット | 未読/既読の通知を表示するウィジェット。フィルタリング機能を持つ |
| SpaceWidget | スペースウィジェット | スペース一覧を表示するウィジェット。表示モード（参加中・お気に入り・最近開いた等）を切り替え可能 |
| AppWidget | アプリウィジェット | アプリ一覧を表示するウィジェット。表示モード（すべて・お気に入り・最近開いた等）を切り替え可能 |
| Announcement Title | 掲示板タイトル | お知らせ掲示板の見出し。デフォルトは「お知らせ」 |
| Announcement Body | 掲示板本文 | お知らせ掲示板のリッチテキスト（HTML）コンテンツ。画像・リンク・アプリ埋め込みを含む |

---

## 他ドメインとの関係

| 参照先ドメイン | 参照方法 | 用途 |
|--------------|---------|------|
| Identity | UserId（値オブジェクト） | お知らせ掲示板の最終更新者の識別 |
| File | FileKey（値オブジェクト） | お知らせ掲示板に添付されたファイルの参照 |
| Notification | （ユースケース層で集約） | 通知ウィジェットのデータ取得 |
| Space | （ユースケース層で集約） | スペースウィジェットのデータ取得 |
| App | （ユースケース層で集約） | アプリウィジェットのデータ取得 |

ウィジェットの表示データは各ドメインのリポジトリからユースケース層で取得・集約する。Portal ドメインがこれらのエンティティを直接保持することはない。

---

## エンティティ

### PortalAnnouncement（お知らせ掲示板）

ポータル画面に表示されるお知らせ掲示板。システム全体で1つのみ存在するシングルトンエンティティ。リッチテキスト（HTML）形式の本文を持ち、システム管理者または cybozu.com 共通管理者のみが編集できる。

#### フィールド

| フィールド名 | 型 | 必須 | 説明 |
|-------------|-----|------|------|
| announcementId | AnnouncementId | 必須 | お知らせ掲示板の一意識別子 |
| title | string | 必須 | 掲示板タイトル（デフォルト: 「お知らせ」） |
| body | RichTextHtml | 必須 | リッチテキスト本文（HTML形式）。画像・リンク・アプリ埋め込みを含む |
| attachmentFileKeys | FileKey[] | 必須 | 添付ファイルのキー一覧（空配列可） |
| lastUpdatedBy | UserId | 必須 | 最終更新者のユーザーID |
| updatedAt | Date | 必須 | 最終更新日時 |
| createdAt | Date | 必須 | 作成日時 |

#### ビヘイビア

```typescript
/**
 * お知らせ掲示板の内容を更新する。
 * タイトルと本文を同時に更新する。
 * @throws EmptyTitleError タイトルが空文字の場合
 * @throws AttachmentTooLargeError 添付ファイルが1GBを超える場合（バリデーションはユースケース層）
 */
update(params: {
  title: string;
  body: RichTextHtml;
  attachmentFileKeys: FileKey[];
  updatedBy: UserId;
}): void
// 前提条件: title が空文字でないこと
// 事後条件: title, body, attachmentFileKeys が更新される
// 事後条件: lastUpdatedBy が updatedBy に更新される
// 事後条件: updatedAt が現在時刻に更新される
// エラー: title が空の場合は EmptyTitleError
```

#### 不変条件

- `title` は空文字であってはならない
- `body` は有効な HTML 文字列であること（サニタイズ済み）
- `lastUpdatedBy` は有効な UserId であること
- `createdAt <= updatedAt` でなければならない
- 添付ファイルは1ファイルあたり最大1GB（ファイルサイズ検証はユースケース層で File ドメインと連携）

#### ライフサイクル

1. **初期化**: システム初期セットアップ時に、デフォルトのお知らせ掲示板が1つ作成される（タイトル: 「お知らせ」、本文: OpenDesk の使い方ガイド）
2. **更新**: システム管理者または cybozu.com 共通管理者がお知らせ掲示板編集ダイアログから内容を更新する
3. **削除**: お知らせ掲示板自体の削除は不可。表示/非表示はポータル設定で制御する

---

## 値オブジェクト

### AnnouncementId

お知らせ掲示板の一意識別子。

```typescript
type AnnouncementId = {
  readonly value: string; // UUID v4 形式
};

// 等価性: value が一致すれば等しい
// バリデーション: 空文字でないこと、有効な UUID 形式であること
```

### RichTextHtml

リッチテキストの HTML コンテンツ。XSS 対策のためサニタイズされた HTML 文字列を保持する。

```typescript
type RichTextHtml = {
  readonly value: string; // サニタイズ済み HTML 文字列
};

// 等価性: value が一致すれば等しい
// バリデーション:
//   - 許可されたタグのみを含むこと（スクリプトタグ等は除去）
//   - 空文字を許容する（本文なしの場合）
// 許可されるHTML要素:
//   - テキスト書式: b, i, u, span（style属性: color, background-color, font-size）
//   - 構造: p, br, ul, ol, li, div
//   - リンク: a（href, target属性）
//   - 画像: img（src, alt, width, height属性）
//   - 埋め込み: アプリ一覧/グラフの埋め込み用カスタム要素
```

### WidgetDisplayMode

ウィジェットの表示モード。ウィジェット種別ごとに選択可能な値が異なる。

```typescript
// スペースウィジェットの表示モード
type SpaceWidgetDisplayMode =
  | "joined"          // 参加中のスペース（デフォルト）
  | "favorite"        // お気に入りのスペース
  | "recent"          // 最近開いたスペース
  | "created"         // 作成したスペース
  | "all"             // すべてのスペース
  | "guest_joined";   // 参加中のゲストスペース

// アプリウィジェットの表示モード
type AppWidgetDisplayMode =
  | "all"             // すべてのアプリ（デフォルト）
  | "favorite"        // お気に入りのアプリ
  | "recent"          // 最近開いたアプリ
  | "created"         // 作成したアプリ
  | "recently_published"; // 最近公開されたアプリ

// 通知ウィジェットのフィルターモード
type NotificationFilterMode =
  | "all"             // すべて（デフォルト）
  | "for_me"          // 自分宛
  | "read_later"      // あとで読む
  | { customFilterId: string }; // カスタム絞り込み
```

---

## ドメインサービス

Portal ドメインにはドメインサービスは不要である。お知らせ掲示板の編集権限チェック（システム管理者 / cybozu.com 共通管理者であること）はユースケース層で AccessControl ドメインと連携して行う。

---

## ポート

### PortalAnnouncementRepository

お知らせ掲示板の永続化を担うリポジトリインターフェース。

```typescript
interface PortalAnnouncementRepository {
  /**
   * 最新のお知らせ掲示板を取得する。
   * システム全体で1つのみ存在するため、常に1件を返す。
   * @returns お知らせ掲示板。初期化されていない場合は null
   */
  findLatest(): Promise<PortalAnnouncement | null>;

  /**
   * ID でお知らせ掲示板を取得する。
   * @param announcementId - お知らせ掲示板の識別子
   * @returns お知らせ掲示板。存在しない場合は null
   */
  findById(announcementId: AnnouncementId): Promise<PortalAnnouncement | null>;

  /**
   * お知らせ掲示板を保存する（新規作成または更新）。
   * @param announcement - 保存するお知らせ掲示板
   */
  save(announcement: PortalAnnouncement): Promise<void>;
}
```

---

## エラー型

```typescript
// お知らせ掲示板のエラー
type EmptyTitleError = { kind: "EmptyTitle" };
type AnnouncementNotFoundError = { kind: "AnnouncementNotFound"; announcementId: AnnouncementId };
type AnnouncementPermissionError = { kind: "AnnouncementPermissionDenied"; userId: UserId };
type AttachmentTooLargeError = { kind: "AttachmentTooLarge"; fileSizeBytes: number; maxSizeBytes: number };
```

---

## ユースケース（概要）

### お知らせ掲示板

| # | ユースケース名 | 概要 | 主要アクター |
|---|--------------|------|-------------|
| 1 | お知らせ掲示板編集 | お知らせ掲示板のタイトルと本文を更新する。システム管理者または cybozu.com 共通管理者のみ実行可能 | システム管理者 / cybozu.com 共通管理者 |
| 2 | ポータル表示取得 | ポータル画面に表示するお知らせ掲示板の内容を取得する | 認証済みユーザー |

### お知らせ掲示板編集

1. 操作者がシステム管理者または cybozu.com 共通管理者であることを検証する
2. PortalAnnouncementRepository.findLatest() で現在のお知らせ掲示板を取得する
3. 存在しない場合はデフォルト値で新規作成する
4. PortalAnnouncement.update() でタイトル・本文・添付ファイルを更新する
5. PortalAnnouncementRepository.save() で永続化する

### ポータル表示取得

1. PortalAnnouncementRepository.findLatest() でお知らせ掲示板を取得する
2. 通知ウィジェットのデータを Notification ドメインのポートから取得する
3. スペースウィジェットのデータを Space ドメインのポートから取得する
4. アプリウィジェットのデータを App ドメインのポートから取得する
5. 集約した結果をポータル表示データとして返す
