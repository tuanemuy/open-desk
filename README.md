# OpenDesk

クラウド型ノーコード業務アプリケーション構築プラットフォーム。
IT の知識がなくても自社業務に合わせたデータベースアプリをノーコードで作成・運用でき、チームコラボレーション機能（スペース・スレッド）も統合されている。

## 主要機能

- **業務アプリ作成・運用** — ノーコードでデータベースアプリを構築。フォーム設計、ビュー切替、絞り込み・集計、CSV 入出力、全文検索
- **スペース** — チーム単位のコミュニケーション空間。お知らせ掲示板、スレッド、メンバー管理
- **通知** — @メンション通知、アプリ条件通知、リマインダー。未読/既読管理、フィルタリング
- **ピープル** — ユーザープロフィール表示、ステータス投稿
- **ポータル** — お知らせ・通知・スペース・アプリの各ウィジェットを集約表示するホーム画面
- **全体検索** — アプリ内検索・スペース内検索・全体検索のスコープ自動切替
- **メッセージ** — ユーザー間の 1 対 1 ダイレクトメッセージ
- **ブックマーク** — アプリ・検索結果・その他の 3 カテゴリで管理
- **管理機能** — ユーザー/組織/グループ管理、アクセス権、監査ログ、プラグイン、プロビジョニング

## セットアップ

### 前提条件

- Node.js 22.x
- pnpm
- Docker (Meilisearch, Mailpit 用)

> [Nix](https://nixos.org/) を使用している場合は `nix develop` で開発環境が構築される。

### インストール

```bash
# 依存関係のインストール
pnpm install

# 環境変数の設定
cp .env.example .env

# 開発用サービスの起動 (Meilisearch + Mailpit)
docker compose up -d

# データベースのマイグレーション
pnpm db:migrate

# シードデータの投入
pnpm db:seed

# 開発サーバーの起動
pnpm dev
```

開発サーバーは http://localhost:5173 で起動する。
Mailpit の Web UI は http://localhost:8025 で確認できる。

### 環境変数

| 変数 | 説明 | デフォルト |
|------|------|-----------|
| `SQLITE_URL` | データベース URL | `file:./data/local.db` |
| `SESSION_SECRET` | セッション暗号化キー（32 文字以上） | — |
| `SMTP_HOST` / `SMTP_PORT` | SMTP サーバー | `localhost` / `1025` |
| `SMTP_FROM` | 送信元メールアドレス | `noreply@example.com` |
| `MEILI_HOST` / `MEILI_API_KEY` | Meilisearch 接続先 | `http://localhost:7700` |
| `R2_*` | Cloudflare R2 (未設定時はローカルファイルシステム) | — |
| `VAPID_*` | Web Push 通知用 VAPID キー | — |
| `APP_URL` | アプリケーション URL | `http://localhost:5173` |

## 開発コマンド

```bash
pnpm dev              # 開発サーバー起動
pnpm build            # プロダクションビルド
pnpm start            # プロダクションサーバー起動
pnpm typecheck        # 型チェック
pnpm lint             # リント
pnpm lint:fix         # リント + 自動修正
pnpm format           # フォーマット
pnpm format:check     # フォーマットチェック
pnpm test             # テスト実行
pnpm db:generate      # マイグレーションファイル生成
pnpm db:migrate       # マイグレーション実行
pnpm db:studio        # Drizzle Studio 起動
pnpm db:seed          # シードデータ投入
```

ドメイン単位でテストを実行する場合:

```bash
TEST_DOMAIN=identity pnpm test:domain
TEST_DOMAIN=app pnpm test:domain
```

## 設計仕様

詳細な設計仕様は `spec/` ディレクトリを参照。

| ディレクトリ | 内容 |
|-------------|------|
| `spec/overview.md` | プロジェクト概要 |
| `spec/domains/` | ドメイン定義（エンティティ・値オブジェクト・ポート） |
| `spec/usecases/` | ユースケース定義 |
| `spec/database/` | データベーススキーマ設計 |
| `spec/api/` | API 設計 |
| `spec/pages/` | 画面設計 |
| `spec/flows/` | ユーザーフロー |
| `spec/design/` | UI デザイン（HTML） |
| `spec/adr/` | アーキテクチャ決定記録 |
| `spec/testcases/` | テストケース定義 |
| `spec/manual-tests/` | 手動テスト手順書 |
