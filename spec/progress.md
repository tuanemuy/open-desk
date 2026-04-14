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
- [x] Identity / ApiTokenRecord — エンティティ・リポジトリ・ユースケース・テスト完了
- [x] Identity / CSV Import/Export — ユースケース・テスト完了
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
- [x] drizzleSqlite / apiTokenRecord — スキーマ + リポジトリ + マイグレーション実装完了

## ユースケース
- [x] Identity（46ユースケース — listApiTokens, csvImport/Export x3 追加）
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
- [x] SystemSettings（34ユースケース — getOAuthIntegrations, updateOAuthIntegration, getDiskUsage 追加）
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
- [x] Identity / ApiTokenRecord — issueApiToken, revokeApiToken テスト更新済み
- [x] Identity / CSV Import/Export — 6テストファイル、36テスト
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
- [x] Admin — 全セクション実装済み、バックエンド接続完了、JS/CSS カスタマイズ修正済み
- [x] PersonalSettings

## Manual Test 再実装バックログ (2026-04-14)

`.manual-test/2026-04-14/full-matrix.md` の FAIL を、実装単位として扱いやすい Issue 粒度に再編したもの。  
以降はこの単位で Issue を切り、完了ごとに該当 manual test を再実行する。

凡例: `[ ]` 未着手 / `[-]` 一部対応 / `[x]` 完了

### 推奨 Issue 分解

- [ ] Issue A / #31: Record 詳細の編集・削除・再利用を実装
  - 対応ケース: `record-crud.md` TC-006, TC-007, TC-008, TC-009
  - 完了条件:
    - レコード詳細から編集画面へ遷移できる
    - 保存後に詳細へ戻り更新内容が反映される
    - 削除確認ダイアログとキャンセル導線がある
    - 再利用で値コピー済み新規作成画面へ遷移できる
  - 主な対象:
    - `app/routes/apps/app/records/record/`
    - 必要なら `updateRecord`, `deleteRecord`, `duplicate/reuse` 系 use case / route 追加

- [ ] Issue B / #32: スペース作成フローを手順書水準まで拡張
  - 対応ケース: `space-create.md` TC-001〜TC-011 のうち TC-008, TC-010 以外
  - 完了条件:
    - ポータルから通常/ゲストスペース作成導線が見える
    - 仕様相当の作成 UI を提供する
    - 非公開、マルチスレッド、メンバー指定、カバー画像に対応する
    - 空欄/129文字のエラー表示が期待に近い形で出る
  - 主な対象:
    - `app/routes/portal/index.tsx`
    - `app/routes/spaces/new/`
    - `app/routes/spaces/space/`

- [ ] Issue C / #33: スレッド作成・投稿・フォロー機能を実装
  - 対応ケース: `thread-post.md` TC-001〜TC-013
  - 完了条件:
    - スレッド作成フォームがある
    - タイトルバリデーションがある
    - コメント投稿が action と接続される
    - フォロー/解除が機能する
    - 可能なら通知付き作成、メンション、添付の対応方針も決める
  - 主な対象:
    - `app/routes/spaces/space/`
    - `app/routes/spaces/space/threads/thread/`
    - Space/Thread/Comment 系 use case, route action

- [ ] Issue D / #34: アプリ向け CSV Import を実装
  - 対応ケース: `csv-import.md` TC-001〜TC-011
  - 完了条件:
    - 顧客リスト等のアプリ画面から import 導線がある
    - ファイル選択、文字コード、ヘッダー設定、マッピング、追加/更新モード、エラー時継続/中止に対応する
    - manual test で使う CSV fixture を再現できる
  - 主な対象:
    - `app/routes/apps/app/` 配下に import UI/route を新設
    - `csvImportService` / record validation / mapping 周辺

- [ ] Issue E / #35: アプリ向け CSV Export を実装
  - 対応ケース: `csv-export.md` TC-001〜TC-011
  - 完了条件:
    - アプリ画面から export 導線がある
    - 文字コード、区切り、ヘッダー有無、フィールド選択に対応する
    - 出力ファイル一覧、保持期限表示、削除に対応するか方針を決める
  - 主な対象:
    - `app/routes/apps/app/` 配下に export UI/route を新設
    - CSV export service / download list UI

- [ ] Issue F / #36: アプリ作成フローを手順書水準まで拡張
  - 対応ケース: `app-create.md` TC-001〜TC-011
  - 完了条件:
    - ストア画面に作成方法一覧を表示する
    - 空アプリ作成後に名前編集、フィールド追加、公開、破棄ができる
    - 設定/一覧/グラフ/フォームのタブが機能する
    - テンプレート追加の操作が実装される、またはテンプレート機能のスコープを明確化する
  - 主な対象:
    - `app/routes/apps/store/`
    - `app/routes/apps/app/settings/`
    - `appCreationService`, `appDeploymentService`

- [ ] Issue G / #37: ポータル/手順書/UI 文言の整合を取る
  - 対応ケース:
    - `space-create.md` TC-007, TC-009 の期待文言差分
    - `login.md` 空欄エラーの技術的文言
    - `app-create.md` / `space-create.md` / `thread-post.md` のラベル差分
  - 完了条件:
    - 主要フォームのエラー文言が user-facing になる
    - manual test の期待文言と大きく乖離しない
  - 主な対象:
    - Route schema / UI error rendering / i18n 文言

### 推奨実装順

1. Issue A: Record 詳細
2. Issue C: スレッド
3. Issue B: スペース作成
4. Issue F: アプリ作成
5. Issue D: CSV Import
6. Issue E: CSV Export
7. Issue G: 文言・最終整合

### 再テスト単位

- Issue A 完了後: `record-crud.md`
- Issue B 完了後: `space-create.md`
- Issue C 完了後: `thread-post.md`
- Issue D 完了後: `csv-import.md`
- Issue E 完了後: `csv-export.md`
- Issue F 完了後: `app-create.md`
- 最終: `spec/manual-tests/` 全件

### Admin 詳細ステータス

### 未実装残件

- [x] Admin / JS・CSS カスタマイズ — URL指定・ファイルアップロードダイアログ + ファイルリスト表示・削除を実装済み

## 監査修正ラウンド (2026-04-11)

前回監査 (.audit/completeness/report.md) で検出された Critical 5件 / Warning 9件を修正。

### 修正済み
- [x] [C-001] FormLayoutService.validateLayoutConsistency — 3つの不変条件の検証ロジックを実装
- [x] [C-002] Messages ページ — 空状態UIを実装（スレッド存在時はリダイレクト）
- [x] [C-003] グローバルヘッダー検索 — フォーム送信 + /search 遷移を実装
- [x] [C-004] 通知2ペインレイアウト — detail モードの左右分割レイアウトを実装
- [x] [C-005] ポータルオプションメニュー — ドロップダウンメニュー + メニュー項目を実装
- [x] [W-001] NotificationFilterMatchingService PEOPLE/MESSAGE — locationId 比較ロジック実装
- [x] [W-002] NotificationFilterMatchingService ORGANIZATION/GROUP — 設計判断として true 返却 + コメント明記
- [x] [W-004] queryRecords catch block — StubNotImplementedError による堅牢なエラー判定に改善
- [x] [W-005] ポータルアイコン — DB の icon フィールドから取得するよう修正
- [x] [W-006] JSON.parse エラーハンドリング — try-catch + Zod バリデーションエラー化
- [x] [W-007] スタブアダプター統一 — 全13ファイルを StubNotImplementedError に統一
- [x] [W-008/W-009] CSV Import/Export loader — UIが静的フォームのみで修正不要と判断

### 対象外だった項目（→ スタブ本実装ラウンドで対応済み）
- [x] W-003: SearchIndexProvider → Meilisearch で実装済み (`app/core/adapters/meilisearch/`)
- [x] W-007: 13個のスタブアダプター → 全13個を本実装に差し替え済み

## スタブアダプター本実装

現在 `app/core/adapters/stub/` にある 13 個のスタブアダプターを、選定したプロバイダーで本実装する。

### プロバイダー選定

| サービス | プロバイダー | ライブラリ | 環境変数プレフィックス |
|---------|-------------|-----------|---------------------|
| メール送信 | SMTP (Nodemailer) | `nodemailer` | `SMTP_*` |
| ファイルストレージ | Cloudflare R2 | `@aws-sdk/client-s3` | `R2_*` |
| 全文検索 | Meilisearch | `meilisearch` | `MEILI_*` |
| 外部認証 (SAML/OAuth) | 自前実装 | `samlify` + `oauth4webapi` | `SAML_*` / `OAUTH_*` |
| デスクトップ通知 | Web Push API | `web-push` | `VAPID_*` |

### 外部サービスアダプター（プロバイダー実装）

| # | スタブファイル | ポートインターフェース | プロバイダー | ステータス |
|---|--------------|---------------------|------------|-----------|
| 1 | emailNotificationSender.ts | EmailNotificationSender | SMTP (Nodemailer) | [x] `app/core/adapters/smtp/` |
| 2 | fileStorageProvider.ts | FileStorageProvider | Cloudflare R2 (S3互換) | [x] `app/core/adapters/r2/` |
| 3 | searchIndexProvider.ts | SearchIndexProvider | Meilisearch | [x] `app/core/adapters/meilisearch/` |
| 4 | authenticationProvider.ts | AuthenticationProvider | DB + BearerTokenHasher | [x] `app/core/adapters/auth/` |
| 5 | desktopNotificationPublisher.ts | DesktopNotificationPublisher | Web Push API | [x] `app/core/adapters/webpush/` |

### 内部ロジックアダプター（Drizzle + SQLite で実装）

| # | スタブファイル | ポートインターフェース | 実装方式 | ステータス |
|---|--------------|---------------------|---------|-----------|
| 6 | csvImportService.ts | CsvImportService | papaparse + Drizzle | [x] `app/core/adapters/drizzleSqlite/services/` |
| 7 | recordQueryService.ts | RecordQueryService | クエリパーサー + バリデーター | [x] `app/core/adapters/drizzleSqlite/services/` |
| 8 | recordValidationService.ts | RecordValidationService | ドメインロジック + Drizzle | [x] `app/core/adapters/drizzleSqlite/services/` |
| 9 | filterCondEvaluator.ts | FilterCondEvaluator | クエリパーサー + 評価器 | [x] `app/core/adapters/drizzleSqlite/services/` |
| 10 | processExecutionService.ts | ProcessExecutionService | Drizzle + ドメインロジック | [x] `app/core/adapters/drizzleSqlite/services/` |
| 11 | appCreationService.ts | AppCreationService | Drizzle + ドメインロジック | [x] `app/core/adapters/drizzleSqlite/services/` |
| 12 | appDeploymentService.ts | AppDeploymentService | Drizzle + ドメインロジック | [x] `app/core/adapters/drizzleSqlite/services/` |
| 13 | notificationSourceResolver.ts | NotificationSourceResolver | Drizzle クロスドメインクエリ | [x] `app/core/adapters/drizzleSqlite/services/` |

### .env.example

```env
# ===== SMTP (Email) =====
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=noreply@example.com

# ===== Cloudflare R2 (File Storage) =====
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=

# ===== Meilisearch (Full-text Search) =====
MEILI_HOST=http://localhost:7700
MEILI_API_KEY=

# ===== SAML Authentication =====
SAML_IDP_METADATA_URL=
SAML_SP_ENTITY_ID=
SAML_SP_ACS_URL=
SAML_SP_CERTIFICATE=
SAML_SP_PRIVATE_KEY=

# ===== OAuth 2.0 =====
OAUTH_CLIENT_ID=
OAUTH_CLIENT_SECRET=
OAUTH_AUTHORIZATION_URL=
OAUTH_TOKEN_URL=
OAUTH_USERINFO_URL=
OAUTH_REDIRECT_URI=

# ===== Web Push (Desktop Notifications) =====
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@example.com
```

### 実装順序

依存関係を考慮した推奨実装順:

1. **notificationSourceResolver** — 他のアダプターへの依存なし、通知フィルタリングに必要
2. **recordQueryService** — レコード一覧表示の基盤
3. **filterCondEvaluator** — ビュー・フィルタリングに必要
4. **recordValidationService** — レコード作成・更新に必要
5. **csvImportService** — レコードバリデーション後に実装
6. **processExecutionService** — レコードクエリ後に実装
7. **appCreationService** — テンプレート・Excel/CSV からの作成
8. **appDeploymentService** — preview → production デプロイ
9. **emailNotificationSender** — SMTP 接続
10. **fileStorageProvider** — R2 接続
11. **searchIndexProvider** — Meilisearch 接続
12. **authenticationProvider** — SAML/OAuth 実装
13. **desktopNotificationPublisher** — Web Push 実装

#### Admin OpenDesk（/admin/system/）
- [x] アプリ管理 — リポジトリ経由で実データ取得
- [x] アプリテンプレート — listAppTemplates + CRUD 接続済み
- [x] スペース管理 — listSpaceUsage ユースケース接続済み
- [x] スペーステンプレート — listSpaceTemplates ユースケース接続済み
- [x] スレッドのアクション — listThreadActions + CRUD 接続済み
- [x] ゲストユーザー管理 — listGuestUsers 接続済み
- [x] ゲストユーザーの認証 — getGuestAuth / updateGuestAuth 接続済み
- [x] アクセス権 — listSystemPermissions / add / update / delete 接続済み
- [x] アプリグループ — listAppGroups + CRUD 接続済み
- [x] JavaScript/CSSカスタマイズ — getJsCssCustomization / updateJsCssCustomization 接続済み
- [x] ヘッダーの色 — getHeaderColor / updateHeaderColor 接続済み
- [x] アップデートオプション — getUpdateOption / updateUpdateOption 接続済み
- [x] 利用する機能の選択 — getFeatureFlags / updateFeatureFlags 接続済み
- [x] プラグイン — listPlugins + import/delete/updateStatus 接続済み
- [x] スマートフォンでの表示 — getMobileDisplay / updateMobileDisplay 接続済み
- [x] アプリ/スペースの復旧 — restoreApp + restoreSpace 接続済み
- [x] ユーザーのアクセス状況 — listUserAccessUsages + CSV export 接続済み
- [x] アプリの共通設定 — getSharedAppSettings / updateSharedAppSettings 接続済み

#### Admin Cybozu（/admin/）
- [x] 契約状況 — ユーザー数・アプリ数・スペース数・ディスク使用量すべて実データ（getDiskUsage 接続済み）
- [x] 組織/ユーザー — userRepository / createUser / activateUser / deactivateUser 接続済み
- [x] サービスの利用ユーザー — userRepository 接続済み
- [x] ユーザーの一括削除 — deleteUser 接続済み
- [x] 役職 — listTitles + CRUD 接続済み
- [x] グループ（ロール） — groupRepository / createGroup / deleteGroup 接続済み
- [x] ファイルからの読み込み — csvImportUsers / csvImportOrganizations / csvImportGroups 接続済み
- [x] ファイルへの書き出し — csvExportUsers / csvExportOrganizations / csvExportGroups 接続済み
- [x] 管理者の設定 — userRepository でフィルタリング取得
- [x] 組織の事前設定 — organizationRepository 接続済み
- [x] 組織間のアクセス権 — listOrgAccessRules + CRUD 接続済み
- [x] プロビジョニング — getProvisioningConfig / updateProvisioningConfig 接続済み
- [x] ログインセキュリティ — getLoginSecurity + updatePasswordPolicy / updateLockoutPolicy / updateSessionPolicy / updateSamlAuth / updateTwoFactorAuth 接続済み
- [x] アクセス制限 — getAccessRestriction / updateAccessRestriction 接続済み
- [x] 監査ログ — listAuditLogs + フィルタ + CSV export 接続済み
- [x] 監査ログ設定 — getAuditLogSettings / updateAuditLogSettings 接続済み
- [x] OAuth — getOAuthIntegrations / updateOAuthIntegration 接続済み
- [x] APIトークン — listApiTokens / issueApiToken / revokeApiToken 接続済み
- [x] その他の設定 — getExternalIntegration / updateExternalIntegration 接続済み
- [x] システムメール — getSystemMail / updateSystemMail 接続済み
- [x] ロケール — getLocale / updateLocale 接続済み
- [x] ロゴ — getLogo / updateLogo 接続済み
- [x] ログインページ — getLoginPage / updateLoginPage 接続済み
- [x] アップデートオプション — getUpdateOption / updateUpdateOption 接続済み
- [x] 各サービスの設定 — 管理画面リンク表示
