# コメント

## コメント取得

`GET /k/v1/record/comments.json`

レコードのコメントを取得する。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| app | 数値または文字列 | 必須 | アプリID |
| record | 数値または文字列 | 必須 | レコードID |
| order | 文字列 | 任意 | ソート順。`asc`（昇順）または `desc`（降順、デフォルト）。コメントIDの順序。 |
| offset | 数値 | 任意 | スキップするコメント数。デフォルトは0。 |
| limit | 数値 | 任意 | 取得するコメントの最大件数（0〜10）。デフォルトは10。 |

### レスポンス

| プロパティ | 型 | 説明 |
|---|---|---|
| comments | オブジェクトの配列 | コメントの配列 |
| comments[].id | 文字列 | コメントID |
| comments[].text | 文字列 | コメント本文。改行やメンションを含む（@記号は除去される）。 |
| comments[].createdAt | 文字列 | コメント作成日時（ISO 8601形式） |
| comments[].creator | オブジェクト | コメント投稿者の情報 |
| comments[].creator.code | 文字列 | 投稿者のユーザーコード |
| comments[].creator.name | 文字列 | 投稿者の表示名 |
| comments[].mentions | オブジェクトの配列 | メンション先の情報 |
| comments[].mentions[].code | 文字列 | メンション先のコード |
| comments[].mentions[].type | 文字列 | メンション先の種別: `USER`, `GROUP`, `ORGANIZATION` |
| older | 真偽値 | より古いコメントが存在するかどうか |
| newer | 真偽値 | より新しいコメントが存在するかどうか |

### 必要なアクセス権

- アプリの閲覧権限
- 対象レコードの閲覧権限

### 制限事項

- 一度に取得できるコメントは **最大10件**
- コメント機能が無効なアプリでは実行不可

### リクエスト例

```bash
curl -X GET 'https://sample.cybozu.com/k/v1/record/comments.json?app=1&record=1&order=asc&offset=0&limit=10' \
  -H 'X-Cybozu-Authorization: QWRtaW5pc3RyYXRvcjpjeWJvenU='
```

### レスポンス例

```json
{
  "comments": [
    {
      "id": "2",
      "text": "ありがとうございます。内容を確認しました。",
      "createdAt": "2016-04-12T23:49:00Z",
      "creator": {
        "code": "kato",
        "name": "加藤 美咲"
      },
      "mentions": [
        {
          "code": "sato",
          "type": "USER"
        }
      ]
    }
  ],
  "older": false,
  "newer": false
}
```

---

## コメント投稿

`POST /k/v1/record/comment.json`

レコードにコメントを投稿する。メンション（宛先指定）も可能。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| app | 数値または文字列 | 必須 | アプリID |
| record | 数値または文字列 | 必須 | レコードID |
| comment | オブジェクト | 必須 | コメント情報 |
| comment.text | 文字列 | 必須 | コメント本文。最大65,535文字。 |
| comment.mentions | オブジェクトの配列 | 任意 | メンション（宛先）情報。最大10件。 |
| comment.mentions[].code | 文字列 | 任意 | ユーザー/組織/グループのコード。ゲストユーザーは `guest/メールアドレス` 形式。 |
| comment.mentions[].type | 文字列 | 任意 | 宛先の種別: `USER`, `GROUP`, `ORGANIZATION` |

### レスポンス

| プロパティ | 型 | 説明 |
|---|---|---|
| id | 数値 | 投稿されたコメントのID |

### 必要なアクセス権

- アプリの閲覧権限
- 対象レコードの閲覧権限

### 制限事項

- コメント本文は **最大65,535文字**
- 宛先は **最大10件**
- APIトークン認証で投稿した場合、投稿者は「Administrator」となる
- 宛先名はAPI実行ユーザーの言語設定に依存する
- 無効化・削除されたユーザーやグループには通知されない
- 「招待中」のゲストユーザーをメンションするとエラー
- コメント機能が無効なアプリではエラー

### リクエスト例

```bash
curl -X POST 'https://sample.cybozu.com/k/v1/record/comment.json' \
  -H 'X-Cybozu-API-Token: API_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "app": 1,
    "record": 4,
    "comment": {
      "text": "システムからのコメントです。ご確認をお願いします。",
      "mentions": [
        { "code": "takahashi", "type": "USER" },
        { "code": "guest/yamada@test.jp", "type": "USER" }
      ]
    }
  }'
```

### レスポンス例

```json
{
  "id": 3
}
```

---

## コメント削除

`DELETE /k/v1/record/comment.json`

レコードのコメントを削除する。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| app | 数値または文字列 | 必須 | アプリID |
| record | 数値または文字列 | 必須 | レコードID |
| comment | 数値または文字列 | 必須 | コメントID |

### レスポンス

空のJSONオブジェクト `{}` を返す。

### 必要なアクセス権

- アプリの閲覧権限
- 対象レコードの閲覧権限

### 制限事項

- API実行ユーザーが投稿した本人のコメントのみ削除可能
- APIトークン認証では「Administrator」が投稿したコメントのみ削除可能
- コメント機能が無効なアプリではエラー

### リクエスト例

```bash
curl -X DELETE 'https://sample.cybozu.com/k/v1/record/comment.json?app=1&record=1&comment=1' \
  -H 'X-Cybozu-API-Token: API_TOKEN'
```

### レスポンス例

```json
{}
```
