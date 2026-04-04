# OpenDesk データベース設計

## 概要

OpenDesk プラットフォームの PostgreSQL データベーススキーマ設計。各ドメインのエンティティ・値オブジェクトを永続化するためのテーブル定義、制約、インデックス、リレーションを包括的に記載する。

**RDBMS**: PostgreSQL 15+
**文字エンコーディング**: UTF-8
**タイムゾーン**: すべての TIMESTAMP は `TIMESTAMP WITH TIME ZONE`（UTC で保存）

### 共通ルール

- 主キーは UUID 型（`DEFAULT gen_random_uuid()`）
- すべてのテーブルに `created_at` / `updated_at` カラムを設ける（一部イミュータブルなテーブルは `created_at` のみ）
- 外部キーには適切な `ON DELETE` 動作を設定する
- 列挙値は `TEXT` 型 + `CHECK` 制約で表現する
- 複雑な構造・可変長コレクションは `JSONB` 型で保存する
- snake_case で命名する

---

## 1. Identity ドメイン

### 1.1 users

ユーザーエンティティ。認証情報とプロフィール情報を保持する。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | ユーザーID |
| login_name | TEXT | NOT NULL UNIQUE | ログイン名（メールアドレス形式） |
| display_name | TEXT | NOT NULL | 表示名 |
| email | TEXT | NOT NULL | メールアドレス |
| password_hash | TEXT | NOT NULL | ハッシュ化されたパスワード |
| password_algorithm | TEXT | NOT NULL DEFAULT 'bcrypt' | ハッシュアルゴリズム |
| primary_organization_id | UUID | REFERENCES organizations(id) ON DELETE SET NULL | 主所属組織 |
| timezone | TEXT | NOT NULL DEFAULT 'Asia/Tokyo' | タイムゾーン（IANA 識別子） |
| language | TEXT | NOT NULL DEFAULT 'ja' CHECK (language IN ('ja','en','zh-CN','zh-TW','es','pt-BR','th')) | 表示言語 |
| is_active | BOOLEAN | NOT NULL DEFAULT true | 有効/無効 |
| avatar_file_key | TEXT | | プロフィール画像のファイルキー |
| failed_login_attempts | INTEGER | NOT NULL DEFAULT 0 | 連続ログイン失敗回数 |
| locked_until | TIMESTAMP WITH TIME ZONE | | アカウントロック解除日時 |
| password_changed_at | TIMESTAMP WITH TIME ZONE | | パスワード最終変更日時 |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 最終更新日時 |

**インデックス**:
- `idx_users_login_name` ON users(login_name) -- ログイン検索
- `idx_users_email` ON users(email) -- メール検索
- `idx_users_primary_organization_id` ON users(primary_organization_id) -- 組織メンバー検索
- `idx_users_is_active` ON users(is_active) -- 有効ユーザー絞り込み

---

### 1.2 organizations

組織エンティティ。階層型（ツリー構造）の組織単位。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | 組織ID |
| name | TEXT | NOT NULL | 組織名 |
| code | TEXT | NOT NULL UNIQUE | 組織コード |
| parent_organization_id | UUID | REFERENCES organizations(id) ON DELETE RESTRICT | 親組織ID（null = ルート組織） |
| order_index | INTEGER | NOT NULL DEFAULT 0 CHECK (order_index >= 0) | 同一親組織内の表示順序 |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 最終更新日時 |

**インデックス**:
- `idx_organizations_parent_id` ON organizations(parent_organization_id) -- ツリー検索
- `idx_organizations_code` ON organizations(code) -- コード検索

---

### 1.3 groups

グループエンティティ。組織とは独立したフラットなユーザー集合。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | グループID |
| name | TEXT | NOT NULL | グループ名 |
| code | TEXT | NOT NULL UNIQUE | グループコード |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 最終更新日時 |

---

### 1.4 sessions

セッションエンティティ。ログインからログアウトまたはタイムアウトまでの認証済み接続。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | セッションID |
| user_id | UUID | NOT NULL REFERENCES users(id) ON DELETE CASCADE | ユーザーID |
| ip_address | TEXT | NOT NULL | 接続元IPアドレス |
| user_agent | TEXT | NOT NULL | ブラウザ/OS情報 |
| country | TEXT | | 接続元の国 |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | セッション開始日時 |
| expires_at | TIMESTAMP WITH TIME ZONE | NOT NULL | セッション有効期限 |

**インデックス**:
- `idx_sessions_user_id` ON sessions(user_id) -- ユーザー別セッション検索
- `idx_sessions_expires_at` ON sessions(expires_at) -- 期限切れセッション検索

**CHECK**:
- `CHECK (expires_at > created_at)`

---

### 1.5 user_organizations

ユーザーと組織の多対多関係。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | 関連ID |
| user_id | UUID | NOT NULL REFERENCES users(id) ON DELETE CASCADE | ユーザーID |
| organization_id | UUID | NOT NULL REFERENCES organizations(id) ON DELETE CASCADE | 組織ID |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |

**UNIQUE**:
- `uq_user_organizations` UNIQUE (user_id, organization_id)

**インデックス**:
- `idx_user_organizations_user_id` ON user_organizations(user_id)
- `idx_user_organizations_organization_id` ON user_organizations(organization_id)

---

### 1.6 user_groups

ユーザーとグループの多対多関係。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | 関連ID |
| user_id | UUID | NOT NULL REFERENCES users(id) ON DELETE CASCADE | ユーザーID |
| group_id | UUID | NOT NULL REFERENCES groups(id) ON DELETE CASCADE | グループID |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |

**UNIQUE**:
- `uq_user_groups` UNIQUE (user_id, group_id)

**インデックス**:
- `idx_user_groups_user_id` ON user_groups(user_id)
- `idx_user_groups_group_id` ON user_groups(group_id)

---

### 1.7 password_histories

パスワード履歴。パスワードポリシーの再利用禁止チェック用。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | 履歴ID |
| user_id | UUID | NOT NULL REFERENCES users(id) ON DELETE CASCADE | ユーザーID |
| password_hash | TEXT | NOT NULL | ハッシュ化されたパスワード |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 設定日時 |

**インデックス**:
- `idx_password_histories_user_id` ON password_histories(user_id)

---

### 1.8 login_histories

ログイン履歴。過去2週間・同端末最新10件を保持。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | 履歴ID |
| user_id | UUID | NOT NULL REFERENCES users(id) ON DELETE CASCADE | ユーザーID |
| ip_address | TEXT | NOT NULL | 接続元IPアドレス |
| country | TEXT | | 接続元の国 |
| user_agent | TEXT | NOT NULL | ブラウザ/OS情報 |
| success | BOOLEAN | NOT NULL | ログイン成功/失敗 |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | ログイン日時 |

**インデックス**:
- `idx_login_histories_user_id_created_at` ON login_histories(user_id, created_at DESC)

---

### 1.9 system_settings

システム全体の設定（パスワードポリシー、ロックアウトポリシー、セッションポリシーなど）。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | 設定ID |
| key | TEXT | NOT NULL UNIQUE | 設定キー |
| value | JSONB | NOT NULL | 設定値（JSON形式） |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 最終更新日時 |

---

## 2. App ドメイン

### 2.1 apps

アプリエンティティ。業務アプリケーションの基本情報・ライフサイクルを管理する。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | アプリID |
| code | TEXT | UNIQUE | アプリコード（英字で始まる半角英数字） |
| name | TEXT | NOT NULL CHECK (char_length(name) BETWEEN 1 AND 64) | アプリ名 |
| description | TEXT | CHECK (char_length(description) <= 10000) | アプリの説明（リッチテキスト） |
| space_id | UUID | | 所属スペースID |
| thread_id | UUID | | 所属スレッドID |
| theme | TEXT | NOT NULL DEFAULT 'WHITE' CHECK (theme IN ('WHITE','RED','GREEN','BLUE','YELLOW','BLACK')) | デザインテーマ |
| icon | JSONB | NOT NULL DEFAULT '{}' | アプリアイコン設定 |
| title_field_config | JSONB | NOT NULL DEFAULT '{}' | レコードタイトルフィールド設定 |
| enable_thumbnails | BOOLEAN | NOT NULL DEFAULT false | サムネイル表示 |
| enable_bulk_deletion | BOOLEAN | NOT NULL DEFAULT false | 一括削除 |
| enable_record_history | BOOLEAN | NOT NULL DEFAULT true | 変更履歴記録 |
| enable_comments | BOOLEAN | NOT NULL DEFAULT true | コメント機能 |
| enable_duplicate_record | BOOLEAN | NOT NULL DEFAULT true | レコード複製 |
| enable_inline_editing | BOOLEAN | NOT NULL DEFAULT true | インライン編集 |
| number_precision | JSONB | NOT NULL DEFAULT '{}' | 数値精度設定 |
| first_month_of_fiscal_year | INTEGER | NOT NULL DEFAULT 1 CHECK (first_month_of_fiscal_year BETWEEN 1 AND 12) | 年度開始月 |
| revision | INTEGER | NOT NULL DEFAULT 0 CHECK (revision >= 0) | リビジョン番号 |
| status | TEXT | NOT NULL DEFAULT 'PREVIEW' CHECK (status IN ('PREVIEW','ACTIVE','DELETED')) | アプリ状態 |
| creator_id | UUID | NOT NULL REFERENCES users(id) ON DELETE RESTRICT | 作成者 |
| modifier_id | UUID | NOT NULL REFERENCES users(id) ON DELETE RESTRICT | 最終更新者 |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 更新日時 |

**インデックス**:
- `idx_apps_code` ON apps(code) WHERE code IS NOT NULL
- `idx_apps_space_id` ON apps(space_id) WHERE space_id IS NOT NULL
- `idx_apps_status` ON apps(status)
- `idx_apps_creator_id` ON apps(creator_id)

---

### 2.2 fields

フィールドエンティティ。アプリのフォームを構成するデータ入力項目。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | フィールドID |
| app_id | UUID | NOT NULL REFERENCES apps(id) ON DELETE CASCADE | 所属アプリ |
| field_code | TEXT | NOT NULL | フィールドコード（アプリ内ユニーク） |
| label | TEXT | NOT NULL | フィールド名 |
| no_label | BOOLEAN | NOT NULL DEFAULT false | フィールド名非表示 |
| field_type | TEXT | NOT NULL | フィールドタイプ |
| required | BOOLEAN | NOT NULL DEFAULT false | 必須項目 |
| is_unique | BOOLEAN | NOT NULL DEFAULT false | 値の重複禁止 |
| default_value | JSONB | | 初期値 |
| properties | JSONB | NOT NULL DEFAULT '{}' | フィールドタイプ固有のプロパティ |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 最終更新日時 |

**UNIQUE**:
- `uq_fields_app_id_field_code` UNIQUE (app_id, field_code)

**インデックス**:
- `idx_fields_app_id` ON fields(app_id)
- `idx_fields_field_type` ON fields(field_type)

---

### 2.3 form_layouts

フォームレイアウトエンティティ。フィールドの配置・順序・グルーピングを管理。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | レイアウトID |
| app_id | UUID | NOT NULL UNIQUE REFERENCES apps(id) ON DELETE CASCADE | 所属アプリ（1アプリ1レイアウト） |
| rows | JSONB | NOT NULL DEFAULT '[]' | 行単位のレイアウト構造 |
| revision | INTEGER | NOT NULL DEFAULT 0 CHECK (revision >= 0) | リビジョン番号 |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 最終更新日時 |

---

### 2.4 views

ビューエンティティ。レコードの表示形式を定義。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | ビューID |
| app_id | UUID | NOT NULL REFERENCES apps(id) ON DELETE CASCADE | 所属アプリ |
| view_name | TEXT | NOT NULL | 一覧名 |
| view_type | TEXT | NOT NULL CHECK (view_type IN ('LIST','CALENDAR','CUSTOM')) | ビュータイプ |
| fields | JSONB | NOT NULL DEFAULT '[]' | 表示フィールド（LIST のみ） |
| calendar_date_field | TEXT | | カレンダー日付フィールド |
| calendar_title_field | TEXT | | カレンダータイトルフィールド |
| html | TEXT | | カスタムHTML（CUSTOM のみ） |
| pager | BOOLEAN | NOT NULL DEFAULT true | ページネーション表示 |
| device_scope | TEXT | CHECK (device_scope IN ('PC_AND_MOBILE','PC_ONLY')) | 表示範囲 |
| filter_condition | TEXT | | 絞り込み条件 |
| sort | JSONB | NOT NULL DEFAULT '[]' | ソート条件 |
| index | INTEGER | NOT NULL DEFAULT 0 | 表示順序 |
| builtin_type | TEXT | CHECK (builtin_type IN ('ASSIGNEE','ALL')) | ビルトイン種別 |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 最終更新日時 |

**UNIQUE**:
- `uq_views_app_id_view_name` UNIQUE (app_id, view_name)

**インデックス**:
- `idx_views_app_id` ON views(app_id)

---

### 2.5 reports

レポートエンティティ。レコードの集計・可視化を定義。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | レポートID |
| app_id | UUID | NOT NULL REFERENCES apps(id) ON DELETE CASCADE | 所属アプリ |
| report_name | TEXT | NOT NULL | グラフ名 |
| chart_type | TEXT | NOT NULL CHECK (chart_type IN ('BAR','COLUMN','PIE','LINE','PIVOT_TABLE','TABLE','AREA','SPLINE','SPLINE_AREA')) | グラフ種別 |
| chart_sub_type | TEXT | CHECK (chart_sub_type IN ('NORMAL','STACKED','PERCENTAGE')) | サブタイプ |
| groups | JSONB | NOT NULL DEFAULT '[]' | 分類項目（最大3） |
| aggregations | JSONB | NOT NULL DEFAULT '[]' | 集計方法（最大10） |
| filter_condition | TEXT | | 絞り込み条件 |
| sort | JSONB | NOT NULL DEFAULT '[]' | ソート条件 |
| periodic_report_config | JSONB | | 定期レポート設定 |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 最終更新日時 |

**インデックス**:
- `idx_reports_app_id` ON reports(app_id)

---

### 2.6 periodic_report_snapshots

定期レポートのスナップショットデータ。最大30件/レポート。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | スナップショットID |
| report_id | UUID | NOT NULL REFERENCES reports(id) ON DELETE CASCADE | 所属レポート |
| snapshot_data | JSONB | NOT NULL | スナップショットデータ |
| captured_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | キャプチャ日時 |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |

**インデックス**:
- `idx_periodic_report_snapshots_report_id` ON periodic_report_snapshots(report_id)
- `idx_periodic_report_snapshots_captured_at` ON periodic_report_snapshots(report_id, captured_at DESC)

---

### 2.7 process_definitions

プロセス管理定義エンティティ。レコードの業務フロー（ステータス遷移）を定義。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | プロセス定義ID |
| app_id | UUID | NOT NULL UNIQUE REFERENCES apps(id) ON DELETE CASCADE | 所属アプリ（1アプリ1定義） |
| is_enabled | BOOLEAN | NOT NULL DEFAULT false | プロセス管理の有効/無効 |
| revision | INTEGER | NOT NULL DEFAULT 0 CHECK (revision >= 0) | リビジョン番号 |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 最終更新日時 |

---

### 2.8 process_statuses

プロセスのステータスエンティティ。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | ステータスID |
| process_definition_id | UUID | NOT NULL REFERENCES process_definitions(id) ON DELETE CASCADE | 所属プロセス定義 |
| name | TEXT | NOT NULL | ステータス名 |
| order_index | INTEGER | NOT NULL DEFAULT 0 | 表示順序（0 = 初期ステータス） |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 最終更新日時 |

**インデックス**:
- `idx_process_statuses_definition_id` ON process_statuses(process_definition_id)

---

### 2.9 process_transitions

プロセスの遷移ルールエンティティ。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | 遷移ルールID |
| process_definition_id | UUID | NOT NULL REFERENCES process_definitions(id) ON DELETE CASCADE | 所属プロセス定義 |
| from_status_id | UUID | NOT NULL REFERENCES process_statuses(id) ON DELETE CASCADE | 遷移元ステータス |
| action_name | TEXT | NOT NULL | アクション名 |
| to_status_id | UUID | NOT NULL REFERENCES process_statuses(id) ON DELETE CASCADE | 遷移先ステータス |
| assignees | JSONB | NOT NULL DEFAULT '[]' | 作業者（ユーザー/組織/グループのリスト） |
| condition | TEXT | | 遷移条件 |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 最終更新日時 |

**インデックス**:
- `idx_process_transitions_definition_id` ON process_transitions(process_definition_id)
- `idx_process_transitions_from_status` ON process_transitions(from_status_id)

---

### 2.10 webhook_configs

Webhook設定エンティティ。レコード操作時に外部URLへ通知。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | WebhookID |
| app_id | UUID | NOT NULL REFERENCES apps(id) ON DELETE CASCADE | 所属アプリ |
| url | TEXT | NOT NULL | Webhook URL（HTTPS必須） |
| description | TEXT | NOT NULL DEFAULT '' | 説明 |
| events | JSONB | NOT NULL DEFAULT '[]' | トリガーイベント |
| is_active | BOOLEAN | NOT NULL DEFAULT true | 有効/無効 |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 最終更新日時 |

**インデックス**:
- `idx_webhook_configs_app_id` ON webhook_configs(app_id)

---

### 2.11 api_token_configs

APIトークン設定エンティティ。REST APIアクセス用のトークンとスコープを管理。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | トークンID |
| app_id | UUID | NOT NULL REFERENCES apps(id) ON DELETE CASCADE | 所属アプリ |
| token_hash | TEXT | NOT NULL | トークン（ハッシュ保存） |
| scopes | JSONB | NOT NULL DEFAULT '[]' | 付与するスコープ |
| memo | TEXT | NOT NULL DEFAULT '' | 用途メモ |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 最終更新日時 |

**インデックス**:
- `idx_api_token_configs_app_id` ON api_token_configs(app_id)
- `idx_api_token_configs_token_hash` ON api_token_configs(token_hash) -- トークン認証用

---

### 2.12 app_notification_configs

アプリ通知条件設定エンティティ。アプリ条件通知・レコード条件通知・リマインダー通知の設定。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | 設定ID |
| app_id | UUID | NOT NULL UNIQUE REFERENCES apps(id) ON DELETE CASCADE | 所属アプリ（1アプリ1設定） |
| general_notifications | JSONB | NOT NULL DEFAULT '[]' | アプリの条件通知 |
| per_record_notifications | JSONB | NOT NULL DEFAULT '[]' | レコードの条件通知 |
| reminder_notifications | JSONB | NOT NULL DEFAULT '[]' | リマインダーの条件通知 |
| revision | INTEGER | NOT NULL DEFAULT 0 CHECK (revision >= 0) | リビジョン番号 |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 最終更新日時 |

---

### 2.13 app_actions

アクションエンティティ。レコードデータを別アプリに転記するための設定。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | アクションID |
| app_id | UUID | NOT NULL REFERENCES apps(id) ON DELETE CASCADE | コピー元アプリ |
| action_name | TEXT | NOT NULL | アクション名 |
| destination_app_id | UUID | NOT NULL REFERENCES apps(id) ON DELETE CASCADE | コピー先アプリ |
| field_mappings | JSONB | NOT NULL DEFAULT '[]' | フィールドマッピング |
| allowed_entities | JSONB | NOT NULL DEFAULT '[]' | 利用可能なユーザー/組織/グループ |
| filter_condition | TEXT | | 利用条件 |
| index | INTEGER | NOT NULL DEFAULT 0 | 表示順序 |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 最終更新日時 |

**インデックス**:
- `idx_app_actions_app_id` ON app_actions(app_id)

---

### 2.14 app_customizations

カスタマイズ設定エンティティ。JavaScript/CSSファイルによるアプリのカスタマイズ。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | カスタマイズID |
| app_id | UUID | NOT NULL UNIQUE REFERENCES apps(id) ON DELETE CASCADE | 所属アプリ（1アプリ1設定） |
| scope | TEXT | NOT NULL DEFAULT 'NONE' CHECK (scope IN ('ALL_USERS','ADMIN_ONLY','NONE')) | 適用範囲 |
| desktop | JSONB | NOT NULL DEFAULT '{"jsFiles":[],"cssFiles":[]}' | PC用カスタマイズ |
| mobile | JSONB | NOT NULL DEFAULT '{"jsFiles":[],"cssFiles":[]}' | スマートフォン用カスタマイズ |
| revision | INTEGER | NOT NULL DEFAULT 0 CHECK (revision >= 0) | リビジョン番号 |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 最終更新日時 |

---

### 2.15 plugin_configs

プラグイン設定エンティティ。アプリに追加するプラグインとその設定。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | プラグインID |
| app_id | UUID | NOT NULL REFERENCES apps(id) ON DELETE CASCADE | 所属アプリ |
| is_active | BOOLEAN | NOT NULL DEFAULT true | 有効/無効 |
| config | TEXT | NOT NULL DEFAULT '{}' | プラグイン設定（JSON文字列、最大256KB） |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 最終更新日時 |

**インデックス**:
- `idx_plugin_configs_app_id` ON plugin_configs(app_id)

---

### 2.16 app_categories

カテゴリー設定エンティティ。レコードの階層的分類を定義。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | カテゴリー設定ID |
| app_id | UUID | NOT NULL UNIQUE REFERENCES apps(id) ON DELETE CASCADE | 所属アプリ（1アプリ1設定） |
| is_enabled | BOOLEAN | NOT NULL DEFAULT false | カテゴリーの有効/無効 |
| categories | JSONB | NOT NULL DEFAULT '[]' | カテゴリーツリー（階層構造） |
| revision | INTEGER | NOT NULL DEFAULT 0 CHECK (revision >= 0) | リビジョン番号 |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 最終更新日時 |

---

### 2.17 app_i18n_configs

多言語名設定エンティティ。アプリの各項目名を言語ごとに設定。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | 設定ID |
| app_id | UUID | NOT NULL UNIQUE REFERENCES apps(id) ON DELETE CASCADE | 所属アプリ（1アプリ1設定） |
| translations | JSONB | NOT NULL DEFAULT '[]' | 翻訳データ（スコープ・項目キー・言語ごとの名称） |
| revision | INTEGER | NOT NULL DEFAULT 0 CHECK (revision >= 0) | リビジョン番号 |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 最終更新日時 |

---

## 3. Record ドメイン

### 3.1 records

レコードエンティティ。アプリに属する1件のデータレコード。フィールド値は動的なため JSONB で保存する。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | レコードID |
| app_id | UUID | NOT NULL REFERENCES apps(id) ON DELETE CASCADE | 所属アプリ |
| revision | INTEGER | NOT NULL DEFAULT 1 CHECK (revision >= 1) | リビジョン番号 |
| field_values | JSONB | NOT NULL DEFAULT '{}' | フィールド値（フィールドコード -> 値のマップ） |
| status | TEXT | | プロセス管理ステータス |
| status_assignees | JSONB | NOT NULL DEFAULT '[]' | プロセス管理作業者（UserId の配列） |
| creator_id | UUID | NOT NULL REFERENCES users(id) ON DELETE RESTRICT | 作成者 |
| modifier_id | UUID | NOT NULL REFERENCES users(id) ON DELETE RESTRICT | 最終更新者 |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 更新日時 |

**インデックス**:
- `idx_records_app_id` ON records(app_id)
- `idx_records_app_id_created_at` ON records(app_id, created_at DESC)
- `idx_records_creator_id` ON records(creator_id)
- `idx_records_status` ON records(app_id, status) WHERE status IS NOT NULL
- `idx_records_field_values` ON records USING gin(field_values) -- JSONB フィールド検索用

---

### 3.2 record_comments

レコードコメントエンティティ。プレーンテキストのコメント。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | コメントID |
| record_id | UUID | NOT NULL REFERENCES records(id) ON DELETE CASCADE | 所属レコード |
| app_id | UUID | NOT NULL REFERENCES apps(id) ON DELETE CASCADE | 所属アプリ（検索効率用） |
| text | TEXT | NOT NULL CHECK (char_length(text) <= 65535) | コメント本文 |
| mentions | JSONB | NOT NULL DEFAULT '[]' | 宛先指定（最大10件） |
| creator_id | UUID | NOT NULL REFERENCES users(id) ON DELETE RESTRICT | 投稿者 |
| like_count | INTEGER | NOT NULL DEFAULT 0 | いいね数（非正規化。トリガーまたはアプリケーションロジックで更新） |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 投稿日時 |

**インデックス**:
- `idx_record_comments_record_id` ON record_comments(record_id)
- `idx_record_comments_app_id` ON record_comments(app_id)
- `idx_record_comments_creator_id` ON record_comments(creator_id)

---

### 3.3 record_comment_likes

レコードコメントのいいね関係。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | いいねID |
| comment_id | UUID | NOT NULL REFERENCES record_comments(id) ON DELETE CASCADE | コメントID |
| user_id | UUID | NOT NULL REFERENCES users(id) ON DELETE CASCADE | ユーザーID |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | いいね日時 |

**UNIQUE**:
- `uq_record_comment_likes` UNIQUE (comment_id, user_id)

**インデックス**:
- `idx_record_comment_likes_comment_id` ON record_comment_likes(comment_id)

---

### 3.4 record_histories

レコード変更履歴エンティティ。フィールドごとの文字レベル差分を記録。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | 履歴ID |
| record_id | UUID | NOT NULL REFERENCES records(id) ON DELETE CASCADE | 所属レコード |
| app_id | UUID | NOT NULL REFERENCES apps(id) ON DELETE CASCADE | 所属アプリ（検索効率用） |
| version | INTEGER | NOT NULL CHECK (version >= 1) | バージョン番号 |
| changed_fields | JSONB | NOT NULL DEFAULT '[]' | フィールドごとの差分情報 |
| modifier_id | UUID | NOT NULL REFERENCES users(id) ON DELETE RESTRICT | 変更者 |
| modified_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 変更日時 |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |

**UNIQUE**:
- `uq_record_histories_record_version` UNIQUE (record_id, version)

**インデックス**:
- `idx_record_histories_record_id` ON record_histories(record_id)
- `idx_record_histories_app_id` ON record_histories(app_id)

---

### 3.5 csv_import_jobs

CSVインポートジョブエンティティ。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | ジョブID |
| app_id | UUID | NOT NULL REFERENCES apps(id) ON DELETE CASCADE | 所属アプリ |
| file_name | TEXT | NOT NULL | ファイル名 |
| file_size | BIGINT | NOT NULL | ファイルサイズ（バイト） |
| encoding | TEXT | NOT NULL DEFAULT 'UTF-8' | 文字エンコーディング |
| delimiter | TEXT | NOT NULL DEFAULT ',' | 区切り文字 |
| import_mode | TEXT | NOT NULL CHECK (import_mode IN ('ADD_ONLY','UPSERT')) | インポートモード |
| update_key | TEXT | | 更新キー（UPSERT時のフィールドコード） |
| error_handling | TEXT | NOT NULL DEFAULT 'STOP' CHECK (error_handling IN ('STOP','CONTINUE')) | エラーハンドリング |
| field_mappings | JSONB | NOT NULL DEFAULT '[]' | フィールドマッピング |
| status | TEXT | NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PROCESSING','COMPLETED','FAILED')) | ジョブステータス |
| processed_count | INTEGER | NOT NULL DEFAULT 0 | 処理済み件数 |
| error_count | INTEGER | NOT NULL DEFAULT 0 | エラー件数 |
| error_details | JSONB | NOT NULL DEFAULT '[]' | エラー詳細 |
| creator_id | UUID | NOT NULL REFERENCES users(id) ON DELETE RESTRICT | 実行者 |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |

**インデックス**:
- `idx_csv_import_jobs_app_id` ON csv_import_jobs(app_id)
- `idx_csv_import_jobs_status` ON csv_import_jobs(status)

---

### 3.6 csv_export_jobs

CSVエクスポートジョブエンティティ。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | ジョブID |
| app_id | UUID | NOT NULL REFERENCES apps(id) ON DELETE CASCADE | 所属アプリ |
| view_id | TEXT | | 対象ビューID |
| encoding | TEXT | NOT NULL DEFAULT 'UTF-8' | 文字エンコーディング |
| delimiter | TEXT | NOT NULL DEFAULT ',' | 区切り文字 |
| include_header | BOOLEAN | NOT NULL DEFAULT true | ヘッダー行を含む |
| export_fields | JSONB | NOT NULL | エクスポート対象フィールド |
| include_comments | BOOLEAN | NOT NULL DEFAULT false | コメントを含む |
| status | TEXT | NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PROCESSING','COMPLETED','FAILED')) | ジョブステータス |
| output_file_name | TEXT | | 出力ファイル名 |
| output_file_size | BIGINT | | 出力ファイルサイズ |
| creator_id | UUID | NOT NULL REFERENCES users(id) ON DELETE RESTRICT | 実行者 |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |
| expires_at | TIMESTAMP WITH TIME ZONE | NOT NULL | 出力ファイルの有効期限（3日後） |

**インデックス**:
- `idx_csv_export_jobs_app_id` ON csv_export_jobs(app_id)
- `idx_csv_export_jobs_status` ON csv_export_jobs(status)

---

## 4. AccessControl ドメイン

### 4.1 app_acl_rules

アプリアクセス権エンティティ。アプリに対する操作権限の設定（優先順位付きルールリスト）。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | ACLルールID |
| app_id | UUID | NOT NULL REFERENCES apps(id) ON DELETE CASCADE | 対象アプリ |
| priority | INTEGER | NOT NULL | 優先順位（0が最高。小さいほど高優先度） |
| entity_type | TEXT | NOT NULL CHECK (entity_type IN ('USER','GROUP','ORGANIZATION','CREATOR')) | エンティティ種別 |
| entity_code | TEXT | | エンティティコード（CREATOR の場合は null） |
| include_subs | BOOLEAN | NOT NULL DEFAULT false | 下位組織継承 |
| app_editable | BOOLEAN | NOT NULL DEFAULT false | アプリ管理権限 |
| record_viewable | BOOLEAN | NOT NULL DEFAULT false | レコード閲覧 |
| record_addable | BOOLEAN | NOT NULL DEFAULT false | レコード追加 |
| record_editable | BOOLEAN | NOT NULL DEFAULT false | レコード編集 |
| record_deletable | BOOLEAN | NOT NULL DEFAULT false | レコード削除 |
| record_importable | BOOLEAN | NOT NULL DEFAULT false | レコードインポート |
| record_exportable | BOOLEAN | NOT NULL DEFAULT false | レコードエクスポート |
| revision | INTEGER | NOT NULL DEFAULT 0 | ACL リビジョン |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 最終更新日時 |

**UNIQUE**:
- `uq_app_acl_rules_app_entity` UNIQUE (app_id, entity_type, entity_code)

**インデックス**:
- `idx_app_acl_rules_app_id_priority` ON app_acl_rules(app_id, priority)

**CHECK**:
- `CHECK (record_editable = false OR record_viewable = true)` -- 編集には閲覧が必要
- `CHECK (record_deletable = false OR record_viewable = true)` -- 削除には閲覧が必要
- `CHECK (record_importable = false OR record_addable = true)` -- インポートには追加が必要

---

### 4.2 record_acl_rules

レコードアクセス権エンティティ。レコード条件に基づくレコード単位の権限設定。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | ルールID |
| app_id | UUID | NOT NULL REFERENCES apps(id) ON DELETE CASCADE | 対象アプリ |
| rule_index | INTEGER | NOT NULL | ルール順序（ルールグループ内の順序） |
| filter_cond | TEXT | | レコード条件式 |
| entity_type | TEXT | NOT NULL CHECK (entity_type IN ('USER','GROUP','ORGANIZATION','FIELD_ENTITY')) | エンティティ種別 |
| entity_code | TEXT | | エンティティコード |
| include_subs | BOOLEAN | NOT NULL DEFAULT false | 下位組織継承 |
| viewable | BOOLEAN | NOT NULL DEFAULT true | 閲覧 |
| editable | BOOLEAN | NOT NULL DEFAULT false | 編集 |
| deletable | BOOLEAN | NOT NULL DEFAULT false | 削除 |
| entity_priority | INTEGER | NOT NULL DEFAULT 0 | エンティティ優先順位（同一ルール内） |
| revision | INTEGER | NOT NULL DEFAULT 0 | ACL リビジョン |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 最終更新日時 |

**インデックス**:
- `idx_record_acl_rules_app_id` ON record_acl_rules(app_id, rule_index, entity_priority)

**CHECK**:
- `CHECK (editable = false OR viewable = true)` -- 編集には閲覧が必要
- `CHECK (deletable = false OR viewable = true)` -- 削除には閲覧が必要

---

### 4.3 field_acl_rules

フィールドアクセス権エンティティ。フィールド単位の閲覧・編集・アクセス不可の権限設定。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | ルールID |
| app_id | UUID | NOT NULL REFERENCES apps(id) ON DELETE CASCADE | 対象アプリ |
| field_code | TEXT | NOT NULL | 対象フィールドコード |
| entity_type | TEXT | NOT NULL CHECK (entity_type IN ('USER','GROUP','ORGANIZATION','FIELD_ENTITY')) | エンティティ種別 |
| entity_code | TEXT | | エンティティコード |
| include_subs | BOOLEAN | NOT NULL DEFAULT false | 下位組織継承 |
| accessibility | TEXT | NOT NULL DEFAULT 'WRITE' CHECK (accessibility IN ('READ','WRITE','NONE')) | 権限レベル |
| entity_priority | INTEGER | NOT NULL DEFAULT 0 | エンティティ優先順位（同一フィールド内） |
| revision | INTEGER | NOT NULL DEFAULT 0 | ACL リビジョン |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 最終更新日時 |

**UNIQUE**:
- `uq_field_acl_rules` UNIQUE (app_id, field_code, entity_type, entity_code)

**インデックス**:
- `idx_field_acl_rules_app_id_field` ON field_acl_rules(app_id, field_code, entity_priority)

---

### 4.4 system_permissions

システム権限エンティティ。プラットフォームレベルの権限設定。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | システム権限ID |
| entity_type | TEXT | NOT NULL CHECK (entity_type IN ('USER','GROUP','ORGANIZATION')) | エンティティ種別 |
| entity_code | TEXT | NOT NULL | エンティティコード |
| include_subs | BOOLEAN | NOT NULL DEFAULT false | 下位組織継承 |
| system_admin | BOOLEAN | NOT NULL DEFAULT false | システム管理者 |
| app_group_viewable | BOOLEAN | NOT NULL DEFAULT false | アプリグループ閲覧 |
| app_group_manageable | BOOLEAN | NOT NULL DEFAULT false | アプリグループ管理 |
| app_create | BOOLEAN | NOT NULL DEFAULT false | アプリ作成 |
| app_manage | BOOLEAN | NOT NULL DEFAULT false | アプリ管理 |
| space_create | BOOLEAN | NOT NULL DEFAULT false | スペース作成 |
| guest_space_create | BOOLEAN | NOT NULL DEFAULT false | ゲストスペース作成 |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 最終更新日時 |

**UNIQUE**:
- `uq_system_permissions_entity` UNIQUE (entity_type, entity_code)

---

## 5. Space ドメイン

### 5.1 spaces

スペースエンティティ。チームコラボレーション空間。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | スペースID |
| name | TEXT | NOT NULL CHECK (char_length(name) BETWEEN 1 AND 128) | スペース名 |
| is_private | BOOLEAN | NOT NULL DEFAULT false | 非公開フラグ |
| is_guest | BOOLEAN | NOT NULL DEFAULT false | ゲストスペース |
| use_multi_thread | BOOLEAN | NOT NULL DEFAULT false | マルチスレッド使用 |
| fixed_member | BOOLEAN | NOT NULL DEFAULT false | 参加/退会禁止 |
| cover_image | JSONB | NOT NULL DEFAULT '{"type":"PRESET","key":"default"}' | カバー画像 |
| portal_display | JSONB | NOT NULL DEFAULT '{"showAnnouncement":true,"showThreadList":true,"showAppList":true,"showMemberList":true,"showRelatedLinkList":true}' | ポータル表示設定 |
| app_creation_permission | TEXT | NOT NULL DEFAULT 'EVERYONE' CHECK (app_creation_permission IN ('EVERYONE','ADMIN')) | アプリ作成権限 |
| default_thread_id | UUID | NOT NULL REFERENCES threads(id) ON DELETE CASCADE | デフォルトスレッドID |
| creator_id | UUID | NOT NULL REFERENCES users(id) ON DELETE RESTRICT | 作成者 |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 最終更新日時 |

**注意**: spaces.default_thread_id → threads(id) と threads.space_id → spaces(id) で循環外部キーが発生する。挿入順序として、まず default_thread_id を NULL でスペースを作成し、次にデフォルトスレッドを挿入、最後にスペースの default_thread_id を UPDATE する（DEFERRABLE INITIALLY DEFERRED 制約の利用を推奨）。

**インデックス**:
- `idx_spaces_creator_id` ON spaces(creator_id)
- `idx_spaces_is_guest` ON spaces(is_guest)

---

### 5.2 threads

スレッドエンティティ。スペース内のテーマ別ディスカッション。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | スレッドID |
| space_id | UUID | NOT NULL REFERENCES spaces(id) ON DELETE CASCADE | 所属スペース |
| title | TEXT | NOT NULL CHECK (char_length(title) BETWEEN 1 AND 128) | スレッドタイトル |
| body | TEXT | CHECK (char_length(body) <= 65535) | スレッド本文（リッチテキスト/HTML） |
| creator_id | UUID | NOT NULL REFERENCES users(id) ON DELETE RESTRICT | 作成者 |
| is_default | BOOLEAN | NOT NULL DEFAULT false | デフォルトスレッド |
| notify_on_create | BOOLEAN | NOT NULL DEFAULT false | 作成時通知 |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 最終更新日時 |

**インデックス**:
- `idx_threads_space_id` ON threads(space_id)

---

### 5.3 thread_comments

スレッドコメントエンティティ。リッチテキスト・@メンション・ファイル添付をサポート。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | コメントID |
| thread_id | UUID | NOT NULL REFERENCES threads(id) ON DELETE CASCADE | 所属スレッド |
| space_id | UUID | NOT NULL REFERENCES spaces(id) ON DELETE CASCADE | 所属スペース（検索効率用） |
| text | TEXT | CHECK (char_length(text) <= 65535) | コメント本文 |
| mentions | JSONB | NOT NULL DEFAULT '[]' | 宛先指定（最大10件） |
| files | JSONB | NOT NULL DEFAULT '[]' | 添付ファイル（最大5件） |
| creator_id | UUID | NOT NULL REFERENCES users(id) ON DELETE RESTRICT | 投稿者 |
| like_count | INTEGER | NOT NULL DEFAULT 0 | いいね数（非正規化。トリガーまたはアプリケーションロジックで更新） |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 投稿日時 |

**CHECK**:
- `CONSTRAINT chk_thread_comments_content CHECK (text IS NOT NULL OR files IS NOT NULL AND jsonb_array_length(files) > 0)` -- テキストまたはファイルのいずれかが必須

**インデックス**:
- `idx_thread_comments_thread_id` ON thread_comments(thread_id)
- `idx_thread_comments_space_id` ON thread_comments(space_id)
- `idx_thread_comments_creator_id` ON thread_comments(creator_id)

---

### 5.4 thread_comment_likes

スレッドコメントのいいね関係。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | いいねID |
| comment_id | UUID | NOT NULL REFERENCES thread_comments(id) ON DELETE CASCADE | コメントID |
| user_id | UUID | NOT NULL REFERENCES users(id) ON DELETE CASCADE | ユーザーID |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | いいね日時 |

**UNIQUE**:
- `uq_thread_comment_likes` UNIQUE (comment_id, user_id)

**インデックス**:
- `idx_thread_comment_likes_comment_id` ON thread_comment_likes(comment_id)

---

### 5.5 space_announcements

スペースお知らせエンティティ。スペースのポータルに掲示されるリッチテキストコンテンツ。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | お知らせID |
| space_id | UUID | NOT NULL UNIQUE REFERENCES spaces(id) ON DELETE CASCADE | 所属スペース（1スペース1お知らせ） |
| body | TEXT | NOT NULL DEFAULT '' CHECK (char_length(body) <= 65535) | お知らせ本文（リッチテキスト/HTML） |
| updated_by | UUID | NOT NULL REFERENCES users(id) ON DELETE RESTRICT | 最終更新者 |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 最終更新日時 |

---

### 5.6 space_members

スペースメンバーエンティティ。スペースに参加しているユーザー・組織・グループ。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | メンバーID |
| space_id | UUID | NOT NULL REFERENCES spaces(id) ON DELETE CASCADE | 所属スペース |
| entity_type | TEXT | NOT NULL CHECK (entity_type IN ('USER','ORGANIZATION','GROUP')) | メンバー種別 |
| entity_id | UUID | NOT NULL | エンティティID（ユーザー/組織/グループのID） |
| entity_code | TEXT | NOT NULL | エンティティコード |
| is_admin | BOOLEAN | NOT NULL DEFAULT false | 管理者フラグ |
| include_subs | BOOLEAN | NOT NULL DEFAULT false | 下位組織含む（ORGANIZATION のみ） |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 最終更新日時 |

**UNIQUE**:
- `uq_space_members` UNIQUE (space_id, entity_type, entity_id)

**インデックス**:
- `idx_space_members_space_id` ON space_members(space_id)
- `idx_space_members_entity` ON space_members(entity_type, entity_id)

---

### 5.7 space_related_links

スペースの関連リンクエンティティ。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | リンクID |
| space_id | UUID | NOT NULL REFERENCES spaces(id) ON DELETE CASCADE | 所属スペース |
| title | TEXT | NOT NULL | リンクタイトル |
| url | TEXT | NOT NULL | リンクURL |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |

**インデックス**:
- `idx_space_related_links_space_id` ON space_related_links(space_id)

---

### 5.8 space_templates

スペーステンプレートエンティティ。スペースの構成を再利用可能なテンプレートとして保存。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | テンプレートID |
| name | TEXT | NOT NULL | テンプレート名 |
| source_space_id | UUID | NOT NULL REFERENCES spaces(id) ON DELETE RESTRICT | 元となったスペース |
| use_multi_thread | BOOLEAN | NOT NULL DEFAULT false | マルチスレッド設定 |
| fixed_member | BOOLEAN | NOT NULL DEFAULT false | 固定メンバー設定 |
| app_creation_permission | TEXT | NOT NULL DEFAULT 'EVERYONE' CHECK (app_creation_permission IN ('EVERYONE','ADMIN')) | アプリ作成権限 |
| cover_image | JSONB | NOT NULL DEFAULT '{}' | カバー画像 |
| portal_display | JSONB | NOT NULL DEFAULT '{}' | ポータル表示設定 |
| thread_names | JSONB | NOT NULL DEFAULT '[]' | スレッド名一覧 |
| app_ids | JSONB | NOT NULL DEFAULT '[]' | アプリID一覧 |
| related_links | JSONB | NOT NULL DEFAULT '[]' | 関連リンク一覧 |
| announcement_body | TEXT | | お知らせ本文 |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |

---

### 5.9 thread_follows

スレッドのフォロー状態。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | フォローID |
| thread_id | UUID | NOT NULL REFERENCES threads(id) ON DELETE CASCADE | スレッドID |
| user_id | UUID | NOT NULL REFERENCES users(id) ON DELETE CASCADE | ユーザーID |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | フォロー日時 |

**UNIQUE**:
- `uq_thread_follows` UNIQUE (thread_id, user_id)

**インデックス**:
- `idx_thread_follows_thread_id` ON thread_follows(thread_id)
- `idx_thread_follows_user_id` ON thread_follows(user_id)

---

## 6. Notification ドメイン

### 6.1 notifications

通知エンティティ。イベント発生時に受信者に対して生成される通知メッセージ。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | 通知ID |
| recipient_id | UUID | NOT NULL REFERENCES users(id) ON DELETE CASCADE | 受信者 |
| type | TEXT | NOT NULL CHECK (type IN ('MENTION','APP_CONDITION','RECORD_CONDITION','REMINDER','SPACE')) | 通知種別 |
| source_type | TEXT | NOT NULL CHECK (source_type IN ('RECORD','COMMENT','THREAD')) | 発生元種別 |
| source_id | TEXT | NOT NULL | 発生元リソースID |
| sender_id | UUID | REFERENCES users(id) ON DELETE SET NULL | 送信者（リマインダー等は null） |
| title | TEXT | NOT NULL CHECK (char_length(title) <= 256) | 通知タイトル |
| content | TEXT | NOT NULL DEFAULT '' CHECK (char_length(content) <= 1024) | 通知本文スニペット |
| is_read | BOOLEAN | NOT NULL DEFAULT false | 既読状態 |
| is_read_later | BOOLEAN | NOT NULL DEFAULT false | 「あとで読む」フラグ |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 生成日時 |

**インデックス**:
- `idx_notifications_recipient_id_created_at` ON notifications(recipient_id, created_at DESC) -- 通知一覧取得
- `idx_notifications_recipient_is_read` ON notifications(recipient_id, is_read) WHERE is_read = false -- 未読通知
- `idx_notifications_recipient_read_later` ON notifications(recipient_id, is_read_later) WHERE is_read_later = true -- あとで読む
- `idx_notifications_source` ON notifications(source_type, source_id) -- 発生元から通知検索

---

### 6.2 notification_filters

通知フィルタエンティティ。ユーザーが作成するカスタムの通知絞り込み条件。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | フィルタID |
| user_id | UUID | NOT NULL REFERENCES users(id) ON DELETE CASCADE | フィルタ所有者 |
| is_built_in | BOOLEAN | NOT NULL DEFAULT false | ビルトインフィルタ |
| name | TEXT | NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100) | フィルタ名 |
| notification_type | TEXT | NOT NULL DEFAULT 'ALL' CHECK (notification_type IN ('ALL','MENTION')) | 通知種別フィルタ |
| location_mode | TEXT | NOT NULL DEFAULT 'ALL' CHECK (location_mode IN ('ALL','INCLUDE','EXCLUDE')) | 場所条件モード |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 最終更新日時 |

**インデックス**:
- `idx_notification_filters_user_id` ON notification_filters(user_id)

---

### 6.3 notification_filter_location_conditions

通知フィルタの場所条件。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | 条件ID |
| filter_id | UUID | NOT NULL REFERENCES notification_filters(id) ON DELETE CASCADE | 所属フィルタ |
| location_type | TEXT | NOT NULL CHECK (location_type IN ('APP','SPACE','PEOPLE','MESSAGE')) | 場所種別 |
| location_id | TEXT | | 場所ID（null = すべてのXXX） |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |

**インデックス**:
- `idx_nf_location_conditions_filter_id` ON notification_filter_location_conditions(filter_id)

---

### 6.4 notification_filter_sender_conditions

通知フィルタの送信者条件。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | 条件ID |
| filter_id | UUID | NOT NULL REFERENCES notification_filters(id) ON DELETE CASCADE | 所属フィルタ |
| sender_type | TEXT | NOT NULL CHECK (sender_type IN ('USER','ORGANIZATION','GROUP')) | 送信者種別 |
| sender_id | TEXT | NOT NULL | 送信者ID |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |

**UNIQUE**:
- `uq_nf_sender_conditions` UNIQUE (filter_id, sender_type, sender_id)

**インデックス**:
- `idx_nf_sender_conditions_filter_id` ON notification_filter_sender_conditions(filter_id)

---

### 6.5 notification_preferences

通知設定エンティティ。ユーザーごとのメール通知・デスクトップ通知の受信設定。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | 設定ID |
| user_id | UUID | NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE | 所有ユーザー（1ユーザー1設定） |
| email_enabled | BOOLEAN | NOT NULL DEFAULT true | メール通知有効 |
| email_scope | TEXT | NOT NULL DEFAULT 'MENTION_ONLY' CHECK (email_scope IN ('MENTION_ONLY','ALL')) | メール通知対象範囲 |
| email_format | TEXT | NOT NULL DEFAULT 'HTML' CHECK (email_format IN ('HTML','TEXT')) | メール通知形式 |
| desktop_enabled | BOOLEAN | NOT NULL DEFAULT false | デスクトップ通知有効 |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 最終更新日時 |

---

## 7. Portal ドメイン

### 7.1 portal_announcements

ポータルお知らせ掲示板エンティティ。システム全体で1つのみ存在するシングルトン。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | お知らせID |
| title | TEXT | NOT NULL DEFAULT 'お知らせ' | 掲示板タイトル |
| body | TEXT | NOT NULL DEFAULT '' | リッチテキスト本文（HTML形式） |
| attachment_file_keys | JSONB | NOT NULL DEFAULT '[]' | 添付ファイルキー一覧 |
| last_updated_by | UUID | NOT NULL REFERENCES users(id) ON DELETE RESTRICT | 最終更新者 |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 最終更新日時 |

---

## 8. People ドメイン

### 8.1 profiles

プロフィールエンティティ。Identity ドメインのユーザー情報を拡張するプロフィール。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | プロフィールID |
| user_id | UUID | NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE | ユーザーID（1ユーザー1プロフィール） |
| cover_image_file_key | TEXT | | カバー画像のファイルキー |
| comment | TEXT | NOT NULL DEFAULT '' | 自由記述コメント |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 最終更新日時 |

---

### 8.2 posts

投稿エンティティ。ユーザーのステータス投稿。作成後は編集不可。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | 投稿ID |
| author_id | UUID | NOT NULL REFERENCES users(id) ON DELETE CASCADE | 投稿者 |
| content | TEXT | NOT NULL CHECK (char_length(content) > 0) | 投稿本文（リッチテキストHTML） |
| attachment_file_keys | JSONB | NOT NULL DEFAULT '[]' | 添付ファイルキー一覧 |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 投稿日時 |

**インデックス**:
- `idx_posts_author_id_created_at` ON posts(author_id, created_at DESC) -- ユーザー別投稿一覧

---

### 8.3 post_mentions

投稿のメンション。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | メンションID |
| post_id | UUID | NOT NULL REFERENCES posts(id) ON DELETE CASCADE | 投稿ID |
| mention_type | TEXT | NOT NULL CHECK (mention_type IN ('user','group','organization')) | メンション種別 |
| target_id | TEXT | NOT NULL | 対象ID |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |

**インデックス**:
- `idx_post_mentions_post_id` ON post_mentions(post_id)
- `idx_post_mentions_target` ON post_mentions(mention_type, target_id)

---

### 8.4 follows

フォロー関係エンティティ。ユーザー間のフォロー/フォロワー関係。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | フォローID |
| follower_id | UUID | NOT NULL REFERENCES users(id) ON DELETE CASCADE | フォローする側 |
| followee_id | UUID | NOT NULL REFERENCES users(id) ON DELETE CASCADE | フォローされる側 |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | フォロー開始日時 |

**UNIQUE**:
- `uq_follows` UNIQUE (follower_id, followee_id)

**CHECK**:
- `CHECK (follower_id != followee_id)` -- 自己フォロー禁止

**インデックス**:
- `idx_follows_follower_id` ON follows(follower_id)
- `idx_follows_followee_id` ON follows(followee_id)

---

## 9. Message ドメイン

### 9.1 message_threads

メッセージスレッドエンティティ。2人のユーザー間のダイレクトメッセージの会話単位。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | スレッドID |
| participant_1_id | UUID | NOT NULL REFERENCES users(id) ON DELETE CASCADE | 参加者1（ID が小さい方） |
| participant_2_id | UUID | NOT NULL REFERENCES users(id) ON DELETE CASCADE | 参加者2（ID が大きい方） |
| last_message_at | TIMESTAMP WITH TIME ZONE | | 最新メッセージの送信日時 |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | スレッド作成日時 |

**UNIQUE**:
- `uq_message_threads_participants` UNIQUE (participant_1_id, participant_2_id)

**CHECK**:
- `CHECK (participant_1_id < participant_2_id)` -- ID の順序を正規化

**インデックス**:
- `idx_message_threads_participant_1` ON message_threads(participant_1_id, last_message_at DESC NULLS LAST)
- `idx_message_threads_participant_2` ON message_threads(participant_2_id, last_message_at DESC NULLS LAST)

---

### 9.2 direct_messages

ダイレクトメッセージエンティティ。作成後は編集・削除不可。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | メッセージID |
| thread_id | UUID | NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE | 所属スレッド |
| sender_id | UUID | NOT NULL REFERENCES users(id) ON DELETE RESTRICT | 送信者 |
| content | TEXT | NOT NULL CHECK (char_length(content) > 0) | メッセージ本文（リッチテキストHTML） |
| attachment_file_keys | JSONB | NOT NULL DEFAULT '[]' | 添付ファイルキー一覧 |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 送信日時 |

**インデックス**:
- `idx_direct_messages_thread_id_created_at` ON direct_messages(thread_id, created_at DESC) -- スレッド内メッセージ一覧
- `idx_direct_messages_sender_id` ON direct_messages(sender_id)

---

## 10. File ドメイン

### 10.1 stored_files

保管ファイルエンティティ。アップロードされたファイルのメタデータ。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | ファイルID |
| file_key | TEXT | NOT NULL UNIQUE | ファイルの一意識別キー |
| file_name | TEXT | NOT NULL CHECK (char_length(file_name) > 0) | アップロード時のファイル名 |
| content_type | TEXT | NOT NULL CHECK (char_length(content_type) > 0) | MIME タイプ |
| size | BIGINT | NOT NULL CHECK (size > 0) | ファイルサイズ（バイト） |
| uploader_id | UUID | NOT NULL REFERENCES users(id) ON DELETE RESTRICT | アップロードしたユーザー |
| status | TEXT | NOT NULL DEFAULT 'TEMPORARY' CHECK (status IN ('TEMPORARY','ATTACHED')) | ファイル状態 |
| uploaded_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | アップロード日時 |
| expires_at | TIMESTAMP WITH TIME ZONE | | 自動削除期限（TEMPORARY のみ） |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 最終更新日時 |

**CHECK**:
- `CHECK ((status = 'TEMPORARY' AND expires_at IS NOT NULL) OR (status = 'ATTACHED' AND expires_at IS NULL))` -- TEMPORARY は expires_at 必須、ATTACHED は null

**インデックス**:
- `idx_stored_files_file_key` ON stored_files(file_key) -- ファイルキー検索
- `idx_stored_files_uploader_id` ON stored_files(uploader_id)
- `idx_stored_files_status` ON stored_files(status) WHERE status = 'TEMPORARY' -- 一時ファイル検索
- `idx_stored_files_expires_at` ON stored_files(expires_at) WHERE expires_at IS NOT NULL -- 期限切れ検索

---

## 11. Bookmark ドメイン

### 11.1 bookmarks

ブックマークエンティティ。ユーザーが保存した URL ブックマーク。

| カラム名 | 型 | 制約 | 説明 |
|---------|-----|------|------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | ブックマークID |
| user_id | UUID | NOT NULL REFERENCES users(id) ON DELETE CASCADE | 所有ユーザー |
| name | TEXT | NOT NULL CHECK (char_length(name) > 0) | ブックマーク表示名 |
| url | TEXT | NOT NULL CHECK (char_length(url) > 0) | ブックマーク対象URL |
| category | TEXT | NOT NULL CHECK (category IN ('APP','SEARCH','OTHER')) | カテゴリ |
| app_id | UUID | | APP カテゴリのアプリID（APP 以外は null） |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL DEFAULT now() | 作成日時 |

**CHECK**:
- `CHECK ((category = 'APP' AND app_id IS NOT NULL) OR (category != 'APP' AND app_id IS NULL))` -- APP カテゴリなら app_id 必須

**インデックス**:
- `idx_bookmarks_user_id_created_at` ON bookmarks(user_id, created_at ASC) -- ユーザー別ブックマーク一覧（追加順）
- `idx_bookmarks_user_id_category` ON bookmarks(user_id, category) -- カテゴリ別絞り込み

---

## 12. Search ドメイン

Search ドメインは全文検索インデックス（Elasticsearch 等）を使用する。PostgreSQL テーブルは不要。検索インデックスの構築・更新・削除は SearchIndexProvider ポート経由で外部検索エンジンに委譲する。

---

## リレーション図（概要）

```
Identity ドメイン
  users ──< user_organizations >── organizations (自己参照: parent)
  users ──< user_groups >── groups
  users ──< sessions
  users ──< password_histories
  users ──< login_histories

App ドメイン
  apps ──< fields
  apps ──< views
  apps ──< reports ──< periodic_report_snapshots
  apps ──1 form_layouts
  apps ──1 process_definitions ──< process_statuses
                                ──< process_transitions
  apps ──< webhook_configs
  apps ──< api_token_configs
  apps ──1 app_notification_configs
  apps ──< app_actions
  apps ──1 app_customizations
  apps ──< plugin_configs
  apps ──1 app_categories
  apps ──1 app_i18n_configs

Record ドメイン
  records ──< record_comments ──< record_comment_likes
  records ──< record_histories
  apps ──< csv_import_jobs
  apps ──< csv_export_jobs

AccessControl ドメイン
  apps ──< app_acl_rules
  apps ──< record_acl_rules
  apps ──< field_acl_rules
  system_permissions (独立)

Space ドメイン
  spaces ──< threads ──< thread_comments ──< thread_comment_likes
  spaces ──1 space_announcements
  spaces ──< space_members
  spaces ──< space_related_links
  spaces ──< space_templates
  threads ──< thread_follows

Notification ドメイン
  users ──< notifications
  users ──< notification_filters ──< notification_filter_location_conditions
                                  ──< notification_filter_sender_conditions
  users ──1 notification_preferences

Portal ドメイン
  portal_announcements (シングルトン)

People ドメイン
  users ──1 profiles
  users ──< posts ──< post_mentions
  users ──< follows (follower/followee)

Message ドメイン
  message_threads ──< direct_messages
  users ──< message_threads (participant_1/participant_2)

File ドメイン
  users ──< stored_files

Bookmark ドメイン
  users ──< bookmarks
```

---

## 補足: テーブル一覧（全48テーブル）

| # | ドメイン | テーブル名 | 概要 |
|---|---------|-----------|------|
| 1 | Identity | users | ユーザー |
| 2 | Identity | organizations | 組織 |
| 3 | Identity | groups | グループ |
| 4 | Identity | sessions | セッション |
| 5 | Identity | user_organizations | ユーザー↔組織 |
| 6 | Identity | user_groups | ユーザー↔グループ |
| 7 | Identity | password_histories | パスワード履歴 |
| 8 | Identity | login_histories | ログイン履歴 |
| 9 | Identity | system_settings | システム設定 |
| 10 | App | apps | アプリ |
| 11 | App | fields | フィールド |
| 12 | App | form_layouts | フォームレイアウト |
| 13 | App | views | ビュー |
| 14 | App | reports | レポート |
| 15 | App | periodic_report_snapshots | 定期レポートスナップショット |
| 16 | App | process_definitions | プロセス定義 |
| 17 | App | process_statuses | プロセスステータス |
| 18 | App | process_transitions | プロセス遷移 |
| 19 | App | webhook_configs | Webhook設定 |
| 20 | App | api_token_configs | APIトークン設定 |
| 21 | App | app_notification_configs | 通知条件設定 |
| 22 | App | app_actions | アクション |
| 23 | App | app_customizations | カスタマイズ設定 |
| 24 | App | plugin_configs | プラグイン設定 |
| 25 | App | app_categories | カテゴリー設定 |
| 26 | App | app_i18n_configs | 多言語名設定 |
| 27 | Record | records | レコード |
| 28 | Record | record_comments | レコードコメント |
| 29 | Record | record_comment_likes | コメントいいね |
| 30 | Record | record_histories | 変更履歴 |
| 31 | Record | csv_import_jobs | CSVインポートジョブ |
| 32 | Record | csv_export_jobs | CSVエクスポートジョブ |
| 33 | AccessControl | app_acl_rules | アプリACL |
| 34 | AccessControl | record_acl_rules | レコードACL |
| 35 | AccessControl | field_acl_rules | フィールドACL |
| 36 | AccessControl | system_permissions | システム権限 |
| 37 | Space | spaces | スペース |
| 38 | Space | threads | スレッド |
| 39 | Space | thread_comments | スレッドコメント |
| 40 | Space | thread_comment_likes | コメントいいね |
| 41 | Space | space_announcements | お知らせ |
| 42 | Space | space_members | メンバー |
| 43 | Space | space_related_links | 関連リンク |
| 44 | Space | space_templates | テンプレート |
| 45 | Space | thread_follows | スレッドフォロー |
| 46 | Notification | notifications | 通知 |
| 47 | Notification | notification_filters | 通知フィルタ |
| 48 | Notification | notification_filter_location_conditions | フィルタ場所条件 |
| 49 | Notification | notification_filter_sender_conditions | フィルタ送信者条件 |
| 50 | Notification | notification_preferences | 通知設定 |
| 51 | Portal | portal_announcements | ポータルお知らせ |
| 52 | People | profiles | プロフィール |
| 53 | People | posts | 投稿 |
| 54 | People | post_mentions | 投稿メンション |
| 55 | People | follows | フォロー関係 |
| 56 | Message | message_threads | メッセージスレッド |
| 57 | Message | direct_messages | ダイレクトメッセージ |
| 58 | File | stored_files | 保管ファイル |
| 59 | Bookmark | bookmarks | ブックマーク |
