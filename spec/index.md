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

### Phase 2: ユースケース設計 ✅

| 成果物 | パス | ユースケース数 |
|--------|------|--------------|
| Identity | [usecases/identity.md](usecases/identity.md) | 24 |
| App | [usecases/app.md](usecases/app.md) | 29 |
| Record | [usecases/record.md](usecases/record.md) | 25 |
| AccessControl | [usecases/access-control.md](usecases/access-control.md) | 12 |
| Space | [usecases/space.md](usecases/space.md) | 30 |
| Notification | [usecases/notification.md](usecases/notification.md) | 21 |
| Portal | [usecases/portal.md](usecases/portal.md) | 2 |
| People | [usecases/people.md](usecases/people.md) | 11 |
| Message | [usecases/message.md](usecases/message.md) | 4 |
| File | [usecases/file.md](usecases/file.md) | 3 |
| Search | [usecases/search.md](usecases/search.md) | 3 |
| Bookmark | [usecases/bookmark.md](usecases/bookmark.md) | 4 |

### Phase 3: DB設計 ✅

| 成果物 | パス | テーブル数 |
|--------|------|-----------|
| DB設計 | [database/index.md](database/index.md) | 59 |

### Phase 4: テストケース定義 ✅

| ドメイン | パス | ファイル数 |
|---------|------|-----------|
| Identity | [testcases/identity/](testcases/identity/) | 24 |
| App | [testcases/app/](testcases/app/) | 29 |
| Record | [testcases/record/](testcases/record/) | 25 |
| AccessControl | [testcases/access-control/](testcases/access-control/) | 12 |
| Space | [testcases/space/](testcases/space/) | 30 |
| Notification | [testcases/notification/](testcases/notification/) | 21 |
| Portal | [testcases/portal/](testcases/portal/) | 2 |
| People | [testcases/people/](testcases/people/) | 11 |
| Message | [testcases/message/](testcases/message/) | 4 |
| File | [testcases/file/](testcases/file/) | 3 |
| Search | [testcases/search/](testcases/search/) | 3 |
| Bookmark | [testcases/bookmark/](testcases/bookmark/) | 4 |

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

## ADR

| # | タイトル | パス |
|---|---------|------|
| 001 | ドメイン境界の定義 | [adr/001-domain-boundaries.md](adr/001-domain-boundaries.md) |

## レビュー

| フェーズ | パス | ラウンド数 |
|---------|------|-----------|
| ドメイン設計 | [domains/review/](domains/review/) | 2 |
| ユースケース設計 | [usecases/review/](usecases/review/) | 1 |
| DB設計 | [database/review/](database/review/) | 1 |
| クロスフェーズ検証 | [review/cross-phase/](review/cross-phase/) | 1 |
