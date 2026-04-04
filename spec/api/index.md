# OpenDesk API 仕様

OpenDesk の API 仕様ドキュメント一覧。公式ドキュメント（https://cybozu.dev/ja/OpenDesk/docs/）に基づく。

## 共通仕様

| ドキュメント | パス | 概要 |
|------------|------|------|
| [API共通仕様](./overview.md) | `overview.md` | 認証方式（パスワード/APIトークン/セッション/OAuth）、共通リクエスト・レスポンス仕様、エラーコード、制限事項、デプロイフロー |
| [フィールド形式](./field-types.md) | `field-types.md` | 全フィールド形式のtype値・value形式一覧、サブテーブル等の特殊構造、REST API/JS APIでの入出力形式 |
| [クエリの書き方](./query.md) | `query.md` | レコード絞り込みクエリの構文、演算子・関数一覧、フィールド別対応表、クエリ例 |
| [Webhook](./webhook.md) | `webhook.md` | Webhook設定方法、トリガーイベント5種、ペイロード構造、リトライポリシー、制限事項 |

## REST API

REST API 合計: **75 エンドポイント**

### レコード操作（18 API）

| ドキュメント | パス | API数 | 概要 |
|------------|------|:---:|------|
| [レコード CRUD](./rest/record/crud.md) | `rest/record/crud.md` | 7 | 1件/複数の取得・登録・更新・削除 |
| [カーソル](./rest/record/cursor.md) | `rest/record/cursor.md` | 3 | カーソルの作成・取得・削除（大量レコード取得用） |
| [コメント](./rest/record/comment.md) | `rest/record/comment.md` | 3 | レコードコメントの取得・投稿・削除 |
| [プロセス管理](./rest/record/process.md) | `rest/record/process.md` | 3 | 作業者更新、ステータス更新（1件/複数） |
| [一括処理](./rest/record/bulk.md) | `rest/record/bulk.md` | 1 | 複数APIの一括リクエスト |
| [アクセス権評価](./rest/record/acl.md) | `rest/record/acl.md` | 1 | レコードアクセス権の評価 |

### アプリ操作（33 API）

| ドキュメント | パス | API数 | 概要 |
|------------|------|:---:|------|
| [アプリ情報](./rest/app/info.md) | `rest/app/info.md` | 6 | アプリ取得・作成・使用状況・管理者メモ + preview/デプロイ解説 |
| [フォーム](./rest/app/form.md) | `rest/app/form.md` | 7 | フィールドの取得/追加/変更/削除、レイアウトの取得/変更 |
| [一覧](./rest/app/view.md) | `rest/app/view.md` | 2 | 一覧設定の取得/変更 |
| [グラフ](./rest/app/report.md) | `rest/app/report.md` | 2 | グラフ設定の取得/変更 |
| [アプリ設定](./rest/app/settings.md) | `rest/app/settings.md` | 13 | 一般設定、プロセス管理、デプロイ、プラグイン、カスタマイズ、アクション、スペース変更 |
| [通知設定](./rest/app/notification.md) | `rest/app/notification.md` | 6 | 条件通知/レコード条件通知/リマインダーの取得/変更 |
| [アクセス権](./rest/app/acl.md) | `rest/app/acl.md` | 6 | アプリ/レコード/フィールドアクセス権の取得/変更 |

### スペース・ファイル・プラグイン（24 API）

| ドキュメント | パス | API数 | 概要 |
|------------|------|:---:|------|
| [スペース・スレッド・ゲスト](./rest/space.md) | `rest/space.md` | 14 | スペース管理、スレッド操作、ゲストユーザー管理 |
| [ファイル操作](./rest/file.md) | `rest/file.md` | 2 | ファイルのアップロード・ダウンロード |
| [プラグイン・API情報](./rest/plugin.md) | `rest/plugin.md` | 8 | プラグイン管理、API一覧・スキーマ取得 |

## JavaScript API

| ドキュメント | パス | 概要 |
|------------|------|------|
| [イベント](./js/events.md) | `js/events.md` | 一覧/詳細/追加/編集/印刷/グラフ/ポータル/スペース画面のイベント |
| [API実行メソッド](./js/api.md) | `js/api.md` | openDesk.api()、openDesk.proxy() 関連 |
| [情報取得メソッド](./js/data.md) | `js/data.md` | レコード・アプリ・ユーザー・環境の情報取得 |
| [フィールド制御](./js/field.md) | `js/field.md` | フィールド表示/非表示、グループ開閉、スタイル設定 |
| [UI要素制御・要素取得](./js/ui.md) | `js/ui.md` | ボタン表示制御、DOM要素取得 |
| [ダイアログ・通知・ユーティリティ](./js/dialog.md) | `js/dialog.md` | 確認ダイアログ、通知、ローディング、URL構築、ショートカットキー |
| [プラグインAPI](./js/plugin.md) | `js/plugin.md` | プラグイン設定、プロキシ設定、外部API実行 |

## ディレクトリ構造

```
spec/api/
├── index.md                 ← このファイル
├── overview.md              ← API共通仕様
├── field-types.md           ← フィールド形式
├── query.md                 ← クエリの書き方
├── webhook.md               ← Webhook
├── rest/
│   ├── record/
│   │   ├── crud.md          ← レコード CRUD (7 API)
│   │   ├── cursor.md        ← カーソル (3 API)
│   │   ├── comment.md       ← コメント (3 API)
│   │   ├── process.md       ← プロセス管理 (3 API)
│   │   ├── bulk.md          ← 一括処理 (1 API)
│   │   └── acl.md           ← アクセス権評価 (1 API)
│   ├── app/
│   │   ├── info.md          ← アプリ情報 (6 API)
│   │   ├── form.md          ← フォーム (7 API)
│   │   ├── view.md          ← 一覧 (2 API)
│   │   ├── report.md        ← グラフ (2 API)
│   │   ├── settings.md      ← アプリ設定 (13 API)
│   │   ├── notification.md  ← 通知設定 (6 API)
│   │   └── acl.md           ← アクセス権 (6 API)
│   ├── space.md             ← スペース・スレッド・ゲスト (14 API)
│   ├── file.md              ← ファイル操作 (2 API)
│   └── plugin.md            ← プラグイン・API情報 (8 API)
└── js/
    ├── events.md            ← イベント
    ├── api.md               ← API実行メソッド
    ├── data.md              ← 情報取得メソッド
    ├── field.md             ← フィールド制御
    ├── ui.md                ← UI要素制御・要素取得
    ├── dialog.md            ← ダイアログ・通知・ユーティリティ
    └── plugin.md            ← プラグインAPI
```

## API エンドポイント早見表

### レコード操作
| メソッド | エンドポイント | 概要 | 詳細 |
|---------|-------------|------|------|
| GET | `/k/v1/record.json` | レコード1件取得 | [crud](./rest/record/crud.md) |
| POST | `/k/v1/record.json` | レコード1件登録 | [crud](./rest/record/crud.md) |
| PUT | `/k/v1/record.json` | レコード1件更新 | [crud](./rest/record/crud.md) |
| GET | `/k/v1/records.json` | レコード複数取得 | [crud](./rest/record/crud.md) |
| POST | `/k/v1/records.json` | レコード複数登録 | [crud](./rest/record/crud.md) |
| PUT | `/k/v1/records.json` | レコード複数更新 | [crud](./rest/record/crud.md) |
| DELETE | `/k/v1/records.json` | レコード複数削除 | [crud](./rest/record/crud.md) |
| POST | `/k/v1/records/cursor.json` | カーソル作成 | [cursor](./rest/record/cursor.md) |
| GET | `/k/v1/records/cursor.json` | カーソルからレコード取得 | [cursor](./rest/record/cursor.md) |
| DELETE | `/k/v1/records/cursor.json` | カーソル削除 | [cursor](./rest/record/cursor.md) |
| GET | `/k/v1/record/comments.json` | コメント取得 | [comment](./rest/record/comment.md) |
| POST | `/k/v1/record/comment.json` | コメント投稿 | [comment](./rest/record/comment.md) |
| DELETE | `/k/v1/record/comment.json` | コメント削除 | [comment](./rest/record/comment.md) |
| PUT | `/k/v1/record/assignees.json` | 作業者更新 | [process](./rest/record/process.md) |
| PUT | `/k/v1/record/status.json` | ステータス更新（1件） | [process](./rest/record/process.md) |
| PUT | `/k/v1/records/status.json` | ステータス更新（複数） | [process](./rest/record/process.md) |
| POST | `/k/v1/bulkRequest.json` | 一括処理 | [bulk](./rest/record/bulk.md) |
| GET | `/k/v1/records/acl/evaluate.json` | アクセス権評価 | [acl](./rest/record/acl.md) |

### アプリ操作
| メソッド | エンドポイント | 概要 | 詳細 |
|---------|-------------|------|------|
| GET | `/k/v1/app.json` | アプリ1件取得 | [info](./rest/app/info.md) |
| GET | `/k/v1/apps.json` | アプリ複数取得 | [info](./rest/app/info.md) |
| POST | `/k/v1/preview/app.json` | アプリ作成 | [info](./rest/app/info.md) |
| GET | `/k/v1/apps/statistics.json` | 使用状況取得 | [info](./rest/app/info.md) |
| GET | `/k/v1/app/adminNotes.json` | 管理者メモ取得 | [info](./rest/app/info.md) |
| PUT | `/k/v1/preview/app/adminNotes.json` | 管理者メモ変更 | [info](./rest/app/info.md) |
| GET | `/k/v1/app/form/fields.json` | フォームフィールド取得 | [form](./rest/app/form.md) |
| POST | `/k/v1/preview/app/form/fields.json` | フィールド追加 | [form](./rest/app/form.md) |
| PUT | `/k/v1/preview/app/form/fields.json` | フィールド変更 | [form](./rest/app/form.md) |
| DELETE | `/k/v1/preview/app/form/fields.json` | フィールド削除 | [form](./rest/app/form.md) |
| GET | `/k/v1/app/form/layout.json` | レイアウト取得 | [form](./rest/app/form.md) |
| PUT | `/k/v1/preview/app/form/layout.json` | レイアウト変更 | [form](./rest/app/form.md) |
| GET | `/k/v1/form.json` | フォーム設計情報（旧） | [form](./rest/app/form.md) |
| GET | `/k/v1/app/views.json` | 一覧設定取得 | [view](./rest/app/view.md) |
| PUT | `/k/v1/preview/app/views.json` | 一覧設定変更 | [view](./rest/app/view.md) |
| GET | `/k/v1/app/reports.json` | グラフ設定取得 | [report](./rest/app/report.md) |
| PUT | `/k/v1/preview/app/reports.json` | グラフ設定変更 | [report](./rest/app/report.md) |
| GET | `/k/v1/app/settings.json` | 一般設定取得 | [settings](./rest/app/settings.md) |
| PUT | `/k/v1/preview/app/settings.json` | 一般設定変更 | [settings](./rest/app/settings.md) |
| GET | `/k/v1/app/status.json` | プロセス管理取得 | [settings](./rest/app/settings.md) |
| PUT | `/k/v1/preview/app/status.json` | プロセス管理変更 | [settings](./rest/app/settings.md) |
| POST | `/k/v1/preview/app/deploy.json` | デプロイ実行 | [settings](./rest/app/settings.md) |
| GET | `/k/v1/preview/app/deploy.json` | デプロイ状況確認 | [settings](./rest/app/settings.md) |
| GET | `/k/v1/app/plugins.json` | プラグイン一覧取得 | [settings](./rest/app/settings.md) |
| POST | `/k/v1/preview/app/plugins.json` | プラグイン追加 | [settings](./rest/app/settings.md) |
| GET | `/k/v1/app/customize.json` | カスタマイズ取得 | [settings](./rest/app/settings.md) |
| PUT | `/k/v1/preview/app/customize.json` | カスタマイズ変更 | [settings](./rest/app/settings.md) |
| GET | `/k/v1/app/notifications/general.json` | 条件通知取得 | [notification](./rest/app/notification.md) |
| PUT | `/k/v1/preview/app/notifications/general.json` | 条件通知変更 | [notification](./rest/app/notification.md) |
| GET | `/k/v1/app/notifications/perRecord.json` | レコード通知取得 | [notification](./rest/app/notification.md) |
| PUT | `/k/v1/preview/app/notifications/perRecord.json` | レコード通知変更 | [notification](./rest/app/notification.md) |
| GET | `/k/v1/app/notifications/reminder.json` | リマインダー取得 | [notification](./rest/app/notification.md) |
| PUT | `/k/v1/preview/app/notifications/reminder.json` | リマインダー変更 | [notification](./rest/app/notification.md) |
| GET | `/k/v1/app/acl.json` | アプリアクセス権取得 | [acl](./rest/app/acl.md) |
| PUT | `/k/v1/app/acl.json` | アプリアクセス権変更 | [acl](./rest/app/acl.md) |
| GET | `/k/v1/record/acl.json` | レコードアクセス権取得 | [acl](./rest/app/acl.md) |
| PUT | `/k/v1/record/acl.json` | レコードアクセス権変更 | [acl](./rest/app/acl.md) |
| GET | `/k/v1/field/acl.json` | フィールドアクセス権取得 | [acl](./rest/app/acl.md) |
| PUT | `/k/v1/field/acl.json` | フィールドアクセス権変更 | [acl](./rest/app/acl.md) |
| GET | `/k/v1/app/actions.json` | アクション設定取得 | [settings](./rest/app/settings.md) |
| PUT | `/k/v1/preview/app/actions.json` | アクション設定変更 | [settings](./rest/app/settings.md) |
| POST | `/k/v1/app/move.json` | スペース変更 | [settings](./rest/app/settings.md) |

### スペース・スレッド・ゲスト
| メソッド | エンドポイント | 概要 |
|---------|-------------|------|
| GET | `/k/v1/space.json` | スペース情報取得 |
| PUT | `/k/v1/space.json` | スペース設定変更 |
| POST | `/k/v1/template/space.json` | テンプレートからスペース作成 |
| DELETE | `/k/v1/space.json` | スペース削除 |
| PUT | `/k/v1/space/body.json` | スペース本文更新 |
| GET | `/k/v1/space/members.json` | メンバー取得 |
| PUT | `/k/v1/space/members.json` | メンバー更新 |
| GET | `/k/v1/space/statistics.json` | 使用状況取得 |
| POST | `/k/v1/space/thread.json` | スレッド作成 |
| PUT | `/k/v1/space/thread.json` | スレッド更新 |
| POST | `/k/v1/space/thread/comment.json` | スレッドコメント投稿 |
| POST | `/k/v1/guests.json` | ゲスト追加 |
| DELETE | `/k/v1/guests.json` | ゲスト削除 |
| PUT | `/k/guest/{id}/v1/space/guests.json` | ゲストメンバー更新 |

### ファイル操作
| メソッド | エンドポイント | 概要 |
|---------|-------------|------|
| GET | `/k/v1/file.json` | ファイルダウンロード |
| POST | `/k/v1/file.json` | ファイルアップロード |

### プラグイン・API情報
| メソッド | エンドポイント | 概要 |
|---------|-------------|------|
| GET | `/k/v1/plugins.json` | インストール済みプラグイン取得 |
| GET | `/k/v1/plugins/required.json` | 必須プラグイン取得 |
| GET | `/k/v1/plugin/apps.json` | プラグイン追加済みアプリ取得 |
| POST | `/k/v1/plugin.json` | プラグイン読み込み |
| PUT | `/k/v1/plugin.json` | プラグイン更新 |
| DELETE | `/k/v1/plugin.json` | プラグインアンインストール |
| GET | `/k/v1/apis.json` | API一覧取得 |
| GET | `/k/v1/apis/{API_ID}.json` | APIスキーマ取得 |
