# Implement Audit Report — Final

**Date:** 2026-04-08
**Round:** 3回目（最終）
**Scope:** app/core/domain/, app/core/adapters/, app/core/application/, app/routes/, app/components/, app/lib/
**Total findings:** 5（Info のみ）

---

## Summary

| カテゴリ | 件数 | Critical | Warning | Info |
|---------|------|----------|---------|------|
| 明示的マーカー | 0 | 0 | 0 | 0 |
| 未実装シグナル | 0 | 0 | 0 | 0 |
| 省略シグナル | 0 | 0 | 0 | 0 |
| 仮実装シグナル | 0 | 0 | 0 | 0 |
| 不完全な制御フロー | 1 | 0 | 0 | 1 |
| spec 未実装 | 4 | 0 | 0 | 4 |

**Info 内訳:**

| 分類 | 件数 | 意味 |
|------|------|------|
| Info (actionable) | 3 | いずれ実装が必要。デザイン確定やフェーズ進行に伴い対応する |
| Info (accepted) | 2 | 意図的な設計判断。現時点で対応不要 |

**ラウンド推移:**

| ラウンド | Critical | Warning | Info | Total |
|---------|----------|---------|------|-------|
| 初回（4/7） | 5 | 8 | 5 | 28 |
| R2（4/8） | 0 | 7 | 5 | 12 |
| **R3 最終** | **0** | **0** | **5** | **5** |

---

## Critical（対応必須）

**なし**

---

## Warning（対応推奨）

**なし**

---

## Info — actionable（いずれ対応が必要）

### [I-002] 通知・検索ページのフィルタリングがクライアントサイドのみ
- **ファイル:** `app/routes/notifications/index.tsx`, `app/routes/search/index.tsx`
- **カテゴリ:** 不完全な制御フロー
- **根拠:** フィルターUIはReact stateで管理されているが、サーバーへのクエリパラメータ送信やloader再呼び出しが未実装。
- **対応タイミング:** フィルタリング機能の本実装時

### [I-003] 管理系画面が完全に未実装（デザイン待ち）
- **ファイル:** ルートなし
- **カテゴリ:** spec 未実装
- **根拠:** `spec/progress.md` で「デザインなし」とマーク。デザイン確定待ち。
- **対応タイミング:** デザイン確定後

### [I-005] portal/loader.ts の SpaceItem.description が常に空文字
- **ファイル:** `app/routes/portal/loader.ts`
- **カテゴリ:** 要確認
- **根拠:** Space エンティティに description プロパティが存在しない。型定義の見直しが望ましい。
- **対応タイミング:** ポータル画面の改善時

---

## Info — accepted（意図的な設計判断、対応不要）

### [I-001] ルートindex.tsxが return null のリダイレクト専用ページ
- **ファイル:** `app/routes/index.tsx:7-9`
- **カテゴリ:** 不完全な制御フロー
- **根拠:** loaderでリダイレクトするため通常到達しない。React Router v7の仕様上意図的な設計として許容される。

### [I-004] DB CHECK制約が未実装（アプリケーション層で検証する設計判断）
- **ファイル:** `app/core/adapters/drizzleSqlite/schema.ts`
- **カテゴリ:** spec 未実装
- **根拠:** Drizzle ORM + SQLiteの制約上、アプリケーション層での検証に委譲。意図的な設計判断。

---

## spec 照合結果

### ドメイン照合
**全12ドメイン完全一致**

### ユースケース照合
**168/168 実装済み (100%)**

| ドメイン | spec | 実装 |
|---------|------|------|
| access-control | 12 | 12 |
| app | 29 | 29 |
| bookmark | 4 | 4 |
| file | 3 | 3 |
| identity | 24 | 24 |
| message | 4 | 4 |
| notification | 21 | 21 |
| people | 11 | 11 |
| portal | 2 | 2 |
| record | 25 | 25 |
| search | 3 | 3 |
| space | 30 | 30 |

### フロントエンド照合
**メインルート: 13/13 実装済み、全loaderバックエンド接続済み**

未実装画面群はデザイン待ち（admin-open-desk, admin-cybozu 等13カテゴリ）。

### DB照合
**59/59 テーブル + eventOutbox テーブル = 60テーブル実装済み**

---

## Stub アダプター状況

13個の Stub アダプターがプロダクション DI に残存。全て外部サービス依存のポートであり、接続先サービスの選定・設定が必要:

| Stub | 用途 | loader/action での対策 |
|------|------|---------------------|
| AuthenticationProvider | OAuth/API認証 | Web認証はセッションCookie方式で代替済み |
| SearchIndexProvider | 全文検索 | エラー時に空結果を返す |
| RecordQueryService | レコードクエリ | エラー時に空結果を返す |
| FileStorageProvider | ファイル保存 | 該当UI未実装 |
| RecordValidationService | レコードバリデーション | 書き込み時のみ影響 |
| ProcessExecutionService | プロセス実行 | 書き込み時のみ影響 |
| CsvImportService | CSV取込 | 該当UI未実装 |
| FilterCondEvaluator | フィルタ評価 | 該当UI未実装 |
| EmailNotificationSender | メール送信 | 通知生成時のみ影響 |
| DesktopNotificationPublisher | デスクトップ通知 | 通知生成時のみ影響 |
| NotificationSourceResolver | 通知ソース解決 | 通知表示時のみ影響 |
| AppCreationService | アプリ作成 | 該当UI未実装 |
| AppDeploymentService | アプリデプロイ | 該当UI未実装 |

---

## 全ラウンド修正履歴

### ラウンド1: 基盤 + loader/action 接続
| 対象 | 修正内容 |
|------|---------|
| C-001 | `server.instance.ts` → `di/server.ts` 接続 |
| C-003 | 全15 loader をバックエンドに接続 |
| C-004 | 全3 action をバックエンドに接続 |
| session.server.ts | セッション認証ヘルパー新規作成 |
| login/action.ts | セッション Cookie 設定追加 |
| W-002 | TODO コメント削除、構造化ログ実装 |
| W-003 | `createSpaceTemplate.ts` 新規実装 |
| W-004 | レコード作成後ナビゲーション実装 |
| W-005 | 変更履歴タブに実データ表示 |

### ラウンド2: ラウンド1の修正品質改善
| 対象 | 修正内容 |
|------|---------|
| handleUseCase.ts | orTee ログバグ修正（HandleError 型を正しく参照） |
| apps/app/loader.ts | catch で "Not implemented" のみキャッチに限定 |
| settings/loader.ts | 未使用 getPreference 呼び出し除去 |
| settings/action.ts | requireAuth の try-catch 除去 |

### ラウンド3: Warning 完全解消
| 対象 | 修正内容 |
|------|---------|
| W-001 | Outbox パターン実装（スキーマ + リポジトリ + ワーカー） |
| W-002 | timeFormat 永続化（VO → Entity → Schema → Adapter → UC → Loader → Action） |
| W-003 | isFavorite を BookmarkRepository から取得 |
| W-004 | `listSpaceTemplates.ts` 新規実装 |
| W-005 | `deleteSpaceTemplate.ts` 新規実装 |
| W-006 | `addGuestUser.ts` + `deleteGuestUser.ts` 新規実装 |
| W-007 | `deleteExpiredNotifications.ts` 新規実装 |
