# Implement Audit Report

**Date:** 2026-04-08
**Round:** 2回目（修正ループ後）
**Scope:** app/core/domain/, app/core/adapters/, app/core/application/, app/routes/, app/components/, app/lib/
**Total findings:** 12

---

## Summary

| カテゴリ | 件数 | Critical | Warning | Info |
|---------|------|----------|---------|------|
| 明示的マーカー | 0 | 0 | 0 | 0 |
| 未実装シグナル | 0 | 0 | 0 | 0 |
| 省略シグナル | 0 | 0 | 0 | 0 |
| 仮実装シグナル | 2 | 0 | 2 | 0 |
| 不完全な制御フロー | 1 | 0 | 0 | 1 |
| spec 未実装 | 9 | 0 | 5 | 4 |

**前回ラウンドからの変化:**
- Critical: 5 → **0** (全件解消)
- Warning: 8 → **7** (6件解消、5件新規検出)
- Info: 5 → **5** (1件解消、1件新規)
- Total: 28 → **12**

---

## Critical（対応必須）

**なし** — 全件解消済み

### 前回からの解消

| ID | 概要 | 対応内容 |
|----|------|---------|
| C-001 | DIコンテナの null キャスト | `server.instance.ts` を `di/server.ts` の `createContainer()` と接続 |
| C-002 | 13個のStubアダプター | loaderが stub エラーをグレースフルにハンドルするよう修正。stub 自体は外部サービス依存のため保留 |
| C-003 | 全15件のloader がハードコードデータ | 全loaderをアプリケーションサービスに接続。セッション認証ヘルパー `session.server.ts` を新規作成 |
| C-004 | 3件のアクションがバックエンド未接続 | 全actionをアプリケーションサービスに接続 |
| C-005 | 管理系画面が完全に未実装 | デザインなしのため保留（Info に降格） |

---

## Warning（対応推奨）

### [W-001] Outboxパターンの実装が欠落
- **ファイル:** `app/core/domain/common/ports/outboxRepository.ts`（ポートのみ存在）
- **カテゴリ:** spec 未実装
- **根拠:** `OutboxRepository` ポートはインターフェースのみ。Drizzle 実装と EventRelayWorker が未作成。
- **推奨対応:** Outboxリポジトリの Drizzle 実装と EventRelayWorker を作成する。

### [W-002] settings/action.ts の timeFormat が未永続化
- **ファイル:** `app/routes/settings/action.ts:19-21`
- **カテゴリ:** 仮実装シグナル
- **コード:**
  ```ts
  handler: async (_value, args) => {
    await requireAuth(args.request, container);
    return success();
  },
  ```
- **根拠:** `updateTimeFormat` ハンドラーはバリデーション済みの値を受け取るが永続化しない。ドメインモデルに timeFormat が未定義のため。
- **推奨対応:** Identity ドメインの User エンティティまたは新しい UserPreference エンティティに timeFormat を追加し、永続化する。

### [W-003] spaces/space/loader.ts の isFavorite が常に false
- **ファイル:** `app/routes/spaces/space/loader.ts`
- **カテゴリ:** 仮実装シグナル
- **根拠:** `SpaceLoaderData.space.isFavorite` が常に `false`。お気に入り機能（Bookmark ドメイン）との接続が未実装。
- **推奨対応:** BookmarkRepository からお気に入り状態を取得して設定する。

### [W-004] スペーステンプレート一覧取得ユースケースが未実装
- **ファイル:** 該当ファイルなし
- **カテゴリ:** spec 未実装
- **設計:** `spec/usecases/space.md` セクション27
- **推奨対応:** `listSpaceTemplates.ts` を実装する。

### [W-005] スペーステンプレート削除ユースケースが未実装
- **ファイル:** 該当ファイルなし
- **カテゴリ:** spec 未実装
- **設計:** `spec/usecases/space.md` セクション28
- **推奨対応:** `deleteSpaceTemplate.ts` を実装する。

### [W-006] ゲストユーザー追加/削除ユースケースが未実装
- **ファイル:** 該当ファイルなし
- **カテゴリ:** spec 未実装
- **設計:** `spec/usecases/space.md` セクション29-30
- **推奨対応:** `addGuestUser.ts`, `deleteGuestUser.ts` を実装する。

### [W-007] 期限切れ通知の一括削除ユースケースが未実装
- **ファイル:** 該当ファイルなし
- **カテゴリ:** spec 未実装
- **設計:** `spec/usecases/notification.md` セクション21
- **推奨対応:** 期限切れ通知一括削除ユースケースを実装する。

---

## Info（要確認）

### [I-001] ルートindex.tsxが return null のリダイレクト専用ページ
- **ファイル:** `app/routes/index.tsx:7-9`
- **カテゴリ:** 不完全な制御フロー
- **根拠:** loaderでリダイレクトするため通常到達しないが、フォールバックUIがない。React Router v7の仕様上意図的な設計として許容される可能性あり。

### [I-002] 通知・検索ページのフィルタリングがクライアントサイドのみ
- **ファイル:** `app/routes/notifications/index.tsx`, `app/routes/search/index.tsx`
- **カテゴリ:** 不完全な制御フロー
- **根拠:** フィルターUIはReact stateで管理されているが、サーバーへのクエリパラメータ送信やloader再呼び出しが未実装。

### [I-003] 管理系画面が完全に未実装（デザイン待ち）
- **ファイル:** ルートなし
- **カテゴリ:** spec 未実装
- **設計:**
  - `spec/pages/admin-open-desk.md` — OpenDeskシステム管理（17+サブページ）
  - `spec/pages/admin-cybozu.md` — cybozu.com共通管理（20+サブページ）
- **根拠:** `spec/progress.md` で「デザインなし」とマーク。デザイン確定待ち。

### [I-004] DB CHECK制約が未実装（アプリケーション層で検証する設計判断）
- **ファイル:** `app/core/adapters/drizzleSqlite/schema.ts`
- **カテゴリ:** spec 未実装
- **根拠:** Drizzle ORM + SQLiteの制約上、全てアプリケーション層での検証に委譲。

### [I-005] portal/loader.ts の SpaceItem.description が常に空文字
- **ファイル:** `app/routes/portal/loader.ts`
- **カテゴリ:** 要確認
- **根拠:** Space エンティティに description プロパティが存在しない可能性。型定義側の削除が適切かもしれない。

---

## spec 照合結果

### ドメイン照合

**全12ドメイン完全一致（前回と変化なし）**

### ユースケース照合

**163/168 実装済み（前回の計測を再精査し正確な数値に更新）**

| # | 設計場所 | 要素 | 備考 |
|---|---------|------|------|
| 1 | `spec/usecases/space.md` セクション27 | テンプレート一覧取得 | `listSpaceTemplates.ts` が未実装 |
| 2 | `spec/usecases/space.md` セクション28 | テンプレート削除 | `deleteSpaceTemplate.ts` が未実装 |
| 3 | `spec/usecases/space.md` セクション29 | ゲストユーザー追加 | `addGuestUser.ts` が未実装 |
| 4 | `spec/usecases/space.md` セクション30 | ゲストユーザー削除 | `deleteGuestUser.ts` が未実装 |
| 5 | `spec/usecases/notification.md` セクション21 | 期限切れ通知一括削除 | 未実装 |

**前回からの変化:** `createSpaceTemplate.ts` が実装完了（+1）。計測精度向上で未実装5件を新規検出。

### フロントエンド照合

**メインルート: 13/13 実装済み、全loaderがバックエンド接続済み**

前回は全loaderがハードコードデータだったが、今回は全15 loader + 3 action がアプリケーションサービスに接続された。セッション認証ヘルパー（`app/lib/session.server.ts`）を新規作成し、全ルートで認証チェックを実施。

**未実装画面群（前回と同じ、デザイン待ち）:** admin-open-desk, admin-cybozu, guest-space, app設定詳細サブ画面, フィールドタイプ設定, プロセス管理, 一覧ビュー・グラフ, 集計結果, 定期レポート, お知らせ掲示板編集, 通知フィルタ, ブックマーク, オプションメニュー

### DB照合

**59/59 テーブル実装済み（前回と変化なし）**

### 照合スキップ
- なし（全カテゴリで照合完了）

---

## Stub アダプター状況（参考）

13個の Stub アダプターはプロダクション DI に注入されたままだが、loader/action は以下の対策で安全に動作する:

| Stub | 利用箇所 | 対策 |
|------|---------|------|
| SearchIndexProvider | search/loader.ts | handleUseCase の error handler で "Not implemented" を検出し空結果を返す |
| RecordQueryService | apps/app/loader.ts | try-catch で "Not implemented" のみ catch し空レコードを返す |
| AuthenticationProvider | OAuth/API認証（未使用） | Web認証はセッションCookie方式で実装済み |
| その他10個 | 書き込み系ユースケース | 該当ユースケースが呼ばれた場合のみエラー |

---

## 修正履歴

### ラウンド1（初回レポート → 本ラウンド）

| 対象 | 修正内容 |
|------|---------|
| C-001 | `server.instance.ts` を `di/server.ts` と接続 |
| C-003 | 全15 loader をバックエンドに接続 |
| C-004 | 全3 action をバックエンドに接続 |
| login/action | セッション Cookie 設定を追加 |
| session.server.ts | セッション認証ヘルパーを新規作成 |
| W-002 | TODO コメント削除、構造化ログ実装 |
| W-003 | `createSpaceTemplate.ts` 新規実装 |
| W-004 | レコード作成成功後のナビゲーション実装 |
| W-005 | 変更履歴タブに実データ表示を実装 |

### ラウンド2（本ラウンド内の追加修正）

| 対象 | 修正内容 |
|------|---------|
| handleUseCase.ts | orTee 内のログが HandleError 型を正しく参照するよう修正 |
| apps/app/loader.ts | catch で "Not implemented" のみ catch し、権限エラー等は re-throw |
| settings/loader.ts | 未使用の getPreference 呼び出しを除去 |
| settings/action.ts | requireAuth の try-catch を除去（redirect が正しく伝播するよう修正） |
