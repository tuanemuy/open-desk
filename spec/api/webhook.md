# Webhook

## 概要

Webhookを利用すると、OpenDeskのアプリで特定の操作が行われたときに、その操作内容を外部サービスにJSON形式で自動送信できる。
OpenDeskのサーバー側からHTTP POSTリクエストが送信されるため、ブラウザに依存しない堅牢な連携が可能。

Zapier、Microsoft Power Automate、IFTTTなどの連携サービスで受け取ることができる。

参照: https://cybozu.dev/ja/OpenDesk/docs/overview/webhook/

## 設定方法

1. 連携先サービス（Zapier等）でWebhook受信用のエンドポイントURLを取得する
2. OpenDeskアプリの設定画面を開く
3. 「カスタマイズ/サービス連携」>「Webhook」を選択
4. 「+」をクリックしてWebhookを追加
5. 以下の項目を設定する:
   - **Webhook URL**: 送信先のURL（HTTPS必須、最大1,024文字、`https://` プレフィックスは除いて入力）
   - **説明**: Webhookの識別用メモ（最大64文字）
   - **通知を送信するイベント**: トリガーとなるイベントを選択
   - **有効化チェックボックス**: 有効/無効の切り替え
6. 設定を保存し、アプリを更新して反映

## トリガーイベント

| イベント | type値 | 説明 |
|---------|--------|------|
| レコードの追加 | `ADD_RECORD` | レコードが新規作成されたとき |
| レコードの編集 | `UPDATE_RECORD` | レコードが編集・保存されたとき |
| レコードの削除 | `DELETE_RECORD` | レコードが削除されたとき |
| コメントの書き込み | `ADD_RECORD_COMMENT` | レコードにコメントが投稿されたとき |
| ステータスの更新 | `UPDATE_STATUS` | プロセス管理のステータスが変更されたとき |

### Webhookが発火しないケース

以下の操作ではWebhookは送信されない:

- Excel/CSVファイルによるレコードの一括インポート
- レコードの一括削除
- REST APIによる複数レコードの一括操作

## リクエスト構造

### HTTP仕様

| 項目 | 値 |
|------|-----|
| メソッド | POST |
| Content-Type | application/json |
| プロトコル | HTTPS のみ |

**注意**: リクエストに署名検証用のヘッダーは付与されない。

### ペイロード構造

すべてのイベントで共通のフィールド:

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `id` | string | 通知ごとに割り当てられる一意のID |
| `type` | string | イベントの種類（`ADD_RECORD`, `UPDATE_RECORD`, `DELETE_RECORD`, `UPDATE_STATUS`, `ADD_RECORD_COMMENT`） |
| `app` | object | アプリ情報（`id`: アプリID, `name`: アプリ名） |

## イベント別ペイロード

### レコード追加 (`ADD_RECORD`)

```json
{
  "id": "01234567-0123-0123-0123-0123456789ab",
  "type": "ADD_RECORD",
  "app": {
    "id": "1",
    "name": "案件管理"
  },
  "record": {
    "レコード番号": {
      "type": "RECORD_NUMBER",
      "value": "2"
    },
    "文字列_1行": {
      "type": "SINGLE_LINE_TEXT",
      "value": "サンプルデータ"
    },
    "$revision": {
      "type": "__REVISION__",
      "value": "1"
    },
    "$id": {
      "type": "__ID__",
      "value": "2"
    }
  },
  "recordTitle": "訪問: サイボウズ株式会社",
  "url": "https://example.cybozu.com/k/1/show#record=2"
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `record` | object | レコードのフィールド情報。REST APIの1件取得と同じ形式。`$id` と `$revision` を含む |
| `recordTitle` | string | レコードのタイトル |
| `url` | string | レコードへのURL |

### レコード編集 (`UPDATE_RECORD`)

```json
{
  "id": "01234567-0123-0123-0123-0123456789ab",
  "type": "UPDATE_RECORD",
  "app": {
    "id": "1",
    "name": "案件管理"
  },
  "record": {
    "レコード番号": {
      "type": "RECORD_NUMBER",
      "value": "2"
    },
    "文字列_1行": {
      "type": "SINGLE_LINE_TEXT",
      "value": "更新後のデータ"
    },
    "$revision": {
      "type": "__REVISION__",
      "value": "3"
    },
    "$id": {
      "type": "__ID__",
      "value": "2"
    }
  },
  "recordTitle": "訪問: サイボウズ株式会社",
  "url": "https://example.cybozu.com/k/1/show#record=2"
}
```

ペイロード構造は `ADD_RECORD` と同一。`record` には編集後の全フィールド値が含まれる。

### ステータス更新 (`UPDATE_STATUS`)

```json
{
  "id": "01234567-0123-0123-0123-0123456789ab",
  "type": "UPDATE_STATUS",
  "app": {
    "id": "1",
    "name": "案件管理"
  },
  "record": {
    "レコード番号": {
      "type": "RECORD_NUMBER",
      "value": "2"
    },
    "ステータス": {
      "type": "STATUS",
      "value": "対応中"
    },
    "$revision": {
      "type": "__REVISION__",
      "value": "4"
    },
    "$id": {
      "type": "__ID__",
      "value": "2"
    }
  },
  "recordTitle": "訪問: サイボウズ株式会社",
  "url": "https://example.cybozu.com/k/1/show#record=2"
}
```

ペイロード構造は `ADD_RECORD` と同一。`record` にはステータス変更後の全フィールド値が含まれる。

### レコード削除 (`DELETE_RECORD`)

```json
{
  "id": "01234567-0123-0123-0123-0123456789ab",
  "type": "DELETE_RECORD",
  "app": {
    "id": "1",
    "name": "案件管理"
  },
  "recordId": "2",
  "deletedBy": {
    "code": "sato",
    "name": "Noboru Sato"
  },
  "deletedAt": "2022-10-01T00:00:00Z"
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `recordId` | string | 削除されたレコードのID（アプリコードは含まない） |
| `deletedBy` | object | 削除したユーザー情報（`code`, `name`） |
| `deletedAt` | string | 削除日時（ISO 8601形式） |

**注意**: 削除イベントでは `record`, `recordTitle`, `url` フィールドは含まれない。

### コメント投稿 (`ADD_RECORD_COMMENT`)

```json
{
  "id": "01234567-0123-0123-0123-0123456789ab",
  "type": "ADD_RECORD_COMMENT",
  "app": {
    "id": "1",
    "name": "案件管理"
  },
  "recordId": "2",
  "comment": {
    "id": "1",
    "text": "コメントの内容です",
    "createdAt": "2022-10-01T00:00:00Z",
    "creator": {
      "code": "sato",
      "name": "Noboru Sato"
    },
    "mentions": [
      {
        "code": "tanaka",
        "type": "USER"
      }
    ]
  },
  "url": "https://example.cybozu.com/k/1/show#record=2"
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `recordId` | string | コメントが投稿されたレコードのID |
| `comment` | object | コメント情報。REST APIのコメント取得と同じ形式 |
| `comment.id` | string | コメントID |
| `comment.text` | string | コメント本文 |
| `comment.createdAt` | string | コメント作成日時 |
| `comment.creator` | object | コメント投稿者（`code`, `name`） |
| `comment.mentions` | array | メンション先のユーザー/グループ/組織 |
| `url` | string | レコードへのURL |

## リトライポリシー

- **リトライなし**: Webhook送信が失敗した場合、リトライは行われない
- **タイムアウト**: 送信先サービスが5秒以内にレスポンスを返す必要がある。5秒を超えるとタイムアウトとなり、送信失敗として記録される

## 制限事項

| 制限項目 | 内容 |
|---------|------|
| 1アプリあたりのWebhook数 | 最大10件 |
| 送信頻度 | 1ドメインあたり1分間に最大60回。61回目以降は通知されない |
| 送信先プロトコル | HTTPS のみ（HTTPは不可） |
| Webhook URL文字数 | 最大1,024文字 |
| 説明文字数 | 最大64文字 |
| 通知データサイズ | 最大1MB。超過すると送信失敗 |
| 送信順序 | 保証されない |
| 署名検証 | なし（リクエストに署名検証用ヘッダーは付与されない） |
| ライセンス | Liteプランでは利用不可 |

## 実行ログ

- 各Webhookの直近10件の実行ログをアプリ設定画面から確認可能
- 成功（緑チェック）/失敗（赤三角）のステータスがアイコンで表示される
- ログには通知ID、操作種類、実行者、実行日時が記録される
- 10件より古いログはcybozu.com共通管理の監査ログで確認可能

## 失敗の主な原因

- 通知データが1MBを超えている
- OpenDesk側でタイムアウトが発生した
- 送信先Webサービスがメンテナンス等でダウンしている
- 送信先でタイムアウトが発生した（5秒以内にレスポンスがない）
- 送信先が受信上限に達した
- 1分間の送信回数が60回を超えた
