# OpenDesk 設計ドキュメント

## 概要

Cybozu OpenDesk のクローンプロジェクトの設計ドキュメント。

## 上流成果物（体験設計）

| 成果物 | パス | 概要 |
|--------|------|------|
| 全体概要 | [overview.md](overview.md) | プロダクト概要・ターゲット・主要機能 |
| サイトマップ | [sitemap.md](sitemap.md) | 画面一覧・サイト構造・画面遷移 |
| 認証・認可 | [auth.md](auth.md) | 認証方式・認可レベル・アクセス権粒度 |
| 共通UIコンポーネント | [components.md](components.md) | ヘッダー・ナビ・モーダル・共通パーツ |
| ページ設計 | [pages/](pages/) | 各画面の詳細設計（25ファイル） |
| フロー設計 | [flows/](flows/) | ユーザーフロー定義（7ファイル） |
| API設計 | [api/](api/) | REST API・JS API・Webhook仕様（27ファイル） |

## 技術設計

### Phase 1: ドメイン設計 ✅

| 成果物 | パス |
|--------|------|
| ドメイン一覧 | [domains/index.md](domains/index.md) |
| Identity | [domains/identity.md](domains/identity.md) |
| App | [domains/app.md](domains/app.md) |
| Record | [domains/record.md](domains/record.md) |
| AccessControl | [domains/access-control.md](domains/access-control.md) |
| Space | [domains/space.md](domains/space.md) |
| Notification | [domains/notification.md](domains/notification.md) |
| Portal | [domains/portal.md](domains/portal.md) |
| People | [domains/people.md](domains/people.md) |
| Message | [domains/message.md](domains/message.md) |
| File | [domains/file.md](domains/file.md) |
| Search | [domains/search.md](domains/search.md) |
| Bookmark | [domains/bookmark.md](domains/bookmark.md) |
| SystemSettings | [domains/system-settings.md](domains/system-settings.md) |
| Audit | [domains/audit.md](domains/audit.md) |

### Phase 2: ユースケース設計 ✅

| 成果物 | パス | ユースケース数 |
|--------|------|--------------|
| Identity | [usecases/identity.md](usecases/identity.md) | 40 |
| App | [usecases/app.md](usecases/app.md) | 42 |
| Record | [usecases/record.md](usecases/record.md) | 25 |
| AccessControl | [usecases/access-control.md](usecases/access-control.md) | 17 |
| Space | [usecases/space.md](usecases/space.md) | 35 |
| Notification | [usecases/notification.md](usecases/notification.md) | 21 |
| Portal | [usecases/portal.md](usecases/portal.md) | 2 |
| People | [usecases/people.md](usecases/people.md) | 11 |
| Message | [usecases/message.md](usecases/message.md) | 4 |
| File | [usecases/file.md](usecases/file.md) | 3 |
| Search | [usecases/search.md](usecases/search.md) | 3 |
| Bookmark | [usecases/bookmark.md](usecases/bookmark.md) | 4 |
| SystemSettings | [usecases/system-settings.md](usecases/system-settings.md) | 32 |
| Audit | [usecases/audit.md](usecases/audit.md) | 9 |

### Phase 3: DB設計 ✅

| 成果物 | パス | テーブル数 |
|--------|------|-----------|
| DB設計 | [database/index.md](database/index.md) | 73 |

### Phase 4: テストケース定義 ✅

| ドメイン | パス | ファイル数 |
|---------|------|-----------|
| Identity | [testcases/identity/](testcases/identity/) | 40 |
| App | [testcases/app/](testcases/app/) | 42 |
| Record | [testcases/record/](testcases/record/) | 25 |
| AccessControl | [testcases/access-control/](testcases/access-control/) | 17 |
| Space | [testcases/space/](testcases/space/) | 35 |
| Notification | [testcases/notification/](testcases/notification/) | 21 |
| Portal | [testcases/portal/](testcases/portal/) | 2 |
| People | [testcases/people/](testcases/people/) | 11 |
| Message | [testcases/message/](testcases/message/) | 4 |
| File | [testcases/file/](testcases/file/) | 3 |
| Search | [testcases/search/](testcases/search/) | 3 |
| Bookmark | [testcases/bookmark/](testcases/bookmark/) | 4 |
| SystemSettings | [testcases/system-settings/](testcases/system-settings/) | 32 |
| Audit | [testcases/audit/](testcases/audit/) | 9 |

### Phase 5: クロスフェーズ検証 ✅

| 検証項目 | 結果 |
|---------|------|
| 上流成果物 → ユースケース | PASS |
| ユースケース → ドメインモデル | PASS |
| ドメインエンティティ → DBテーブル | PASS |
| ポート → ユースケース | PASS |
| アーキテクチャ適合性 | PASS |
| 実装可能性 | PASS |

検証レポート: [review/cross-phase/](review/cross-phase/)

## デザイン ✅

| 成果物 | パス | 概要 |
|--------|------|------|
| デザイン方針 | [design/index.md](design/index.md) | Clean Neutral 方向性、レイアウト原則、コンポーネント方針 |
| デザイントークン | [design/tokens.md](design/tokens.md) | カラー、タイポグラフィ、スペーシング、CSS カスタムプロパティ |
| ドラフト | [design/drafts/](design/drafts/) | 5方向性 × 3画面 = 15ファイル |
| デザイン（全画面） | [design/pages/](design/pages/) | 30画面のHTMLデザイン（既存13 + 新規17） |
| レビュー記録 | [design/review/](design/review/) | 6ラウンド（#001-#005 既存13画面, #006 新規17画面） |

### デザイン対象画面

| 画面 | ファイル |
|------|---------|
| ログイン | [design/pages/login.html](design/pages/login.html) |
| ポータル | [design/pages/portal.html](design/pages/portal.html) |
| 通知一覧 | [design/pages/notifications.html](design/pages/notifications.html) |
| アプリ一覧 | [design/pages/app-list.html](design/pages/app-list.html) |
| レコード詳細 | [design/pages/record-detail.html](design/pages/record-detail.html) |
| レコード追加/編集 | [design/pages/record-form.html](design/pages/record-form.html) |
| スペース | [design/pages/space.html](design/pages/space.html) |
| スレッド詳細 | [design/pages/space-thread.html](design/pages/space-thread.html) |
| ピープル | [design/pages/people.html](design/pages/people.html) |
| メッセージ | [design/pages/message.html](design/pages/message.html) |
| 検索結果 | [design/pages/search.html](design/pages/search.html) |
| アプリ設定 | [design/pages/app-settings.html](design/pages/app-settings.html) |
| 個人設定 | [design/pages/personal-settings.html](design/pages/personal-settings.html) |
| オプションメニュー | [design/pages/options-menu.html](design/pages/options-menu.html) |
| ブックマーク | [design/pages/bookmark.html](design/pages/bookmark.html) |
| レコードコメント | [design/pages/record-comments.html](design/pages/record-comments.html) |
| 顧客リストアプリ | [design/pages/app-customer-list.html](design/pages/app-customer-list.html) |
| ファイル管理アプリ | [design/pages/app-file-management.html](design/pages/app-file-management.html) |
| 通知の絞り込み | [design/pages/notification-filter.html](design/pages/notification-filter.html) |
| 定期レポート | [design/pages/periodic-report.html](design/pages/periodic-report.html) |
| その他の設定 | [design/pages/app-other-settings.html](design/pages/app-other-settings.html) |
| 変更履歴 | [design/pages/record-history.html](design/pages/record-history.html) |
| お知らせ掲示板編集 | [design/pages/portal-notice.html](design/pages/portal-notice.html) |
| ゲストスペース | [design/pages/guest-space.html](design/pages/guest-space.html) |
| 集計結果 | [design/pages/aggregate.html](design/pages/aggregate.html) |
| 一覧・グラフ設定 | [design/pages/list-and-graph.html](design/pages/list-and-graph.html) |
| プロセス管理 | [design/pages/process-management.html](design/pages/process-management.html) |
| フィールドタイプ設定 | [design/pages/field-types.html](design/pages/field-types.html) |
| OpenDeskシステム管理 | [design/pages/admin-open-desk.html](design/pages/admin-open-desk.html) |
| cybozu.com共通管理 | [design/pages/admin-cybozu.html](design/pages/admin-cybozu.html) |

## ADR

| # | タイトル | パス |
|---|---------|------|
| 001 | ドメイン境界の定義 | [adr/001-domain-boundaries.md](adr/001-domain-boundaries.md) |
| 002 | 管理機能のドメイン境界 | [adr/002-admin-domain-boundaries.md](adr/002-admin-domain-boundaries.md) |

## レビュー

| フェーズ | パス | ラウンド数 |
|---------|------|-----------|
| ドメイン設計 | [domains/review/](domains/review/) | 2 |
| ユースケース設計 | [usecases/review/](usecases/review/) | 1 |
| DB設計 | [database/review/](database/review/) | 1 |
| クロスフェーズ検証 | [review/cross-phase/](review/cross-phase/) | 1 |
| デザイン | [design/review/](design/review/) | 6 |
