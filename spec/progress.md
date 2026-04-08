# 実装進捗

凡例: [x] 完了 / [-] 部分実装 / [~] UI のみ（バックエンド未実装）/ [ ] 未実装

## ドメイン
- [x] Identity
- [x] App
- [x] Record
- [x] AccessControl
- [x] Space
- [x] Notification
- [x] Portal
- [x] People
- [x] Message
- [x] File
- [x] Search
- [x] Bookmark
- [x] SystemSettings — ドメイン・アダプター・ユースケース・テスト完了
- [x] Audit — ドメイン・アダプター・ユースケース・テスト完了
- [x] Identity / Title — ドメイン・アダプター・ユースケース・テスト完了
- [x] Identity / Provisioning — ドメイン・アダプター・ユースケース・テスト完了
- [x] App / AppTemplate — ドメイン・アダプター・ユースケース・テスト完了
- [x] App / AppGroup — ドメイン・アダプター・ユースケース・テスト完了
- [x] App / Plugin — ドメイン・アダプター・ユースケース・テスト完了
- [x] Space / ThreadAction — ドメイン・アダプター・ユースケース・テスト完了
- [x] AccessControl / OrgAccessControl — ドメイン・アダプター・ユースケース・テスト完了

## アダプター
- [x] drizzleSqlite（スキーマ + リポジトリ）
- [x] drizzleSqlite / systemSettings — リポジトリ実装完了
- [x] drizzleSqlite / pluginConfig — リポジトリあり、対応ユースケースあり
- [x] drizzleSqlite / audit — スキーマ + リポジトリ3つ実装完了
- [x] drizzleSqlite / title — スキーマ + リポジトリ2つ実装完了
- [x] drizzleSqlite / provisioning — スキーマ + リポジトリ3つ実装完了
- [x] drizzleSqlite / appGroup — スキーマ + リポジトリ実装完了
- [x] drizzleSqlite / appTemplate — スキーマ + リポジトリ実装完了
- [x] drizzleSqlite / plugin — スキーマ + リポジトリ実装完了
- [x] drizzleSqlite / threadAction — スキーマ + リポジトリ実装完了
- [x] drizzleSqlite / orgAccessRule — スキーマ + リポジトリ実装完了

## ユースケース
- [x] Identity（40ユースケース）
- [x] App（42ユースケース）
- [x] Record
- [x] AccessControl（17ユースケース）
- [x] Space（35ユースケース）
- [x] Notification
- [x] Portal
- [x] People
- [x] Message
- [x] File
- [x] Search
- [x] Bookmark
- [x] SystemSettings（32ユースケース）
- [x] Audit（9ユースケース）

## テスト
- [x] Identity
- [x] App
- [x] Record
- [x] AccessControl
- [x] Space
- [x] Notification
- [x] Portal
- [x] People
- [x] Message
- [x] File
- [x] Search
- [x] Bookmark
- [x] SystemSettings — 6テストファイル、64テスト
- [x] Audit — 9テストファイル、93テスト
- [x] Identity / Title+Provisioning — 8テストファイル、74テスト
- [x] App / AppGroup+AppTemplate+Plugin — 4テストファイル、28テスト
- [x] Space / ThreadAction+restoreSpace — 2テストファイル、16テスト
- [x] AccessControl / OrgAccessControl — 2テストファイル、13テスト

## フロントエンド
- [x] Portal
- [x] People
- [x] Message
- [x] Space
- [x] App
- [x] Record
- [x] Search
- [x] Bookmark
- [x] Notification
- [-] Admin — UI 全セクション実装済み、バックエンド接続は一部のみ（詳細は下記）
- [x] PersonalSettings

### Admin 詳細ステータス

#### Admin OpenDesk（/admin/system/）
- [x] アプリ管理 — リポジトリ経由で実データ取得
- [~] アプリテンプレート — バックエンド実装済み、フロント未接続
- [x] スペース管理 — listSpaceUsage ユースケース接続済み
- [x] スペーステンプレート — listSpaceTemplates ユースケース接続済み
- [~] スレッドのアクション — バックエンド実装済み、フロント未接続
- [~] ゲストユーザー管理 — バックエンド実装済み、フロント未接続
- [~] ゲストユーザーの認証 — バックエンド実装済み、フロント未接続
- [x] アクセス権 — listSystemPermissions / add / update / delete 接続済み
- [~] アプリグループ — バックエンド実装済み、フロント未接続
- [~] JavaScript/CSSカスタマイズ — バックエンド実装済み、フロント未接続
- [~] ヘッダーの色 — バックエンド実装済み、フロント未接続
- [~] アップデートオプション — バックエンド実装済み、フロント未接続
- [~] 利用する機能の選択 — バックエンド実装済み、フロント未接続
- [~] プラグイン — バックエンド実装済み、フロント未接続
- [~] スマートフォンでの表示 — バックエンド実装済み、フロント未接続
- [-] アプリ/スペースの復旧 — restoreApp + restoreSpace バックエンド実装済み
- [~] ユーザーのアクセス状況 — バックエンド実装済み、フロント未接続
- [~] アプリの共通設定 — バックエンド実装済み、フロント未接続

#### Admin Cybozu（/admin/）
- [-] 契約状況 — ユーザー数は実データ、アプリ数・スペース数・ディスク使用量はハードコード
- [x] 組織/ユーザー — userRepository / createUser / activateUser / deactivateUser 接続済み
- [x] サービスの利用ユーザー — userRepository 接続済み
- [x] ユーザーの一括削除 — deleteUser 接続済み
- [~] 役職 — バックエンド実装済み、フロント未接続
- [x] グループ（ロール） — groupRepository / createGroup / deleteGroup 接続済み
- [~] ファイルからの読み込み — CSV ユースケースは Record 向けのみ、ユーザー一括操作は未実装
- [~] ファイルへの書き出し — 同上
- [x] 管理者の設定 — userRepository でフィルタリング取得
- [x] 組織の事前設定 — organizationRepository 接続済み
- [~] 組織間のアクセス権 — バックエンド実装済み、フロント未接続
- [~] プロビジョニング — バックエンド実装済み、フロント未接続
- [~] ログインセキュリティ — バックエンド実装済み、フロント未接続
- [~] アクセス制限 — バックエンド実装済み、フロント未接続
- [~] 監査ログ — バックエンド実装済み、フロント未接続
- [~] 監査ログ設定 — バックエンド実装済み、フロント未接続
- [-] OAuth — issueApiToken / revokeApiToken 実装済みだがフロント未接続
- [-] APIトークン — manageApiToken 実装済みだがフロント未接続
- [~] その他の設定 — バックエンド実装済み、フロント未接続
- [~] システムメール — バックエンド実装済み、フロント未接続
- [~] ロケール — バックエンド実装済み（システム全体）、フロント未接続
- [~] ロゴ — バックエンド実装済み、フロント未接続
- [~] ログインページ — バックエンド実装済み、フロント未接続
- [~] アップデートオプション — バックエンド実装済み、フロント未接続
- [x] 各サービスの設定 — 管理画面リンク表示
