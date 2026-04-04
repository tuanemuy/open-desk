# カーソル

大量のレコードを取得する際に使用する。レコード複数取得APIの `offset` 上限（10,000件）を超えるデータの取得に有用。

## カーソル作成

`POST /k/v1/records/cursor.json`

レコード一括取得用のカーソルを作成する。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| app | 数値または文字列 | 必須 | アプリID |
| fields | 文字列の配列 | 任意 | レスポンスに含めるフィールドコード。省略時は閲覧権限のある全フィールドを返す。 |
| query | 文字列 | 任意 | レコードの絞り込み条件。`limit` と `offset` は使用不可。 |
| size | 数値または文字列 | 任意 | 1回のGETリクエストで取得するレコード数（1〜500）。デフォルトは100。 |

### レスポンス

| プロパティ | 型 | 説明 |
|---|---|---|
| id | 文字列 | カーソルID |
| totalCount | 文字列 | 条件に一致するレコードの総数 |

### 必要なアクセス権

- アプリのレコード閲覧権限
- 各レコードの閲覧権限
- 各フィールドの閲覧権限

### 制限事項

- 1ドメインあたり有効なカーソルは **最大10個**。上限に達すると既存カーソルの完了または失効まで新規作成不可。
- カーソルの有効期限は作成または最後のレコード取得リクエストから **10分間**
- カーソル作成のタイムアウトは **5分間**
- キーワード検索（`like` / `not like`）は100,000件に達した時点で検索が打ち切られる

### リクエスト例

```bash
curl -X POST 'https://sample.cybozu.com/k/v1/records/cursor.json' \
  -H 'X-Cybozu-API-Token: API_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "app": 1,
    "fields": ["レコード番号", "作成者", "作成日時"],
    "query": "作成者 in (LOGINUSER()) and 作成日時 = TODAY() order by レコード番号 asc",
    "size": 500
  }'
```

### レスポンス例

```json
{
  "id": "9a9716fe-1394-4677-a1c7-2199a5d28215",
  "totalCount": "123456"
}
```

---

## カーソルからレコード取得

`GET /k/v1/records/cursor.json`

作成したカーソルからレコードを取得する。`next` が `false` になるまで繰り返し呼び出す。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| id | 文字列 | 必須 | カーソルID |

### レスポンス

| プロパティ | 型 | 説明 |
|---|---|---|
| records | オブジェクトの配列 | レコードデータの配列 |
| next | 真偽値 | `true`: まだ取得可能なレコードがある。`false`: 全レコード取得完了。 |

### 必要なアクセス権

- アプリのレコード閲覧権限
- 各レコードの閲覧権限
- 各フィールドの閲覧権限

### 制限事項

- カーソル作成時点のレコード集合を取得するが、フィールドの値は取得実行時点のものが返る
- カーソル作成後にアクセス権が変更されると、想定外のレコードが取得される可能性がある
- 全レコード取得完了後、カーソルは自動的に削除される
- `next` が `true` でも `records` が空配列になる場合がある

### リクエスト例

```bash
curl -X GET 'https://sample.cybozu.com/k/v1/records/cursor.json?id=9a9716fe-1394-4677-a1c7-2199a5d28215' \
  -H 'X-Cybozu-API-Token: API_TOKEN'
```

### レスポンス例

```json
{
  "records": [
    {
      "レコード番号": {
        "type": "RECORD_NUMBER",
        "value": "1"
      },
      "作成者": {
        "type": "CREATOR",
        "value": {
          "code": "Administrator",
          "name": "Administrator"
        }
      },
      "作成日時": {
        "type": "CREATED_TIME",
        "value": "2025-05-23T04:50:00Z"
      }
    }
  ],
  "next": false
}
```

---

## カーソル削除

`DELETE /k/v1/records/cursor.json`

作成済みのカーソルを削除する。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| id | 文字列 | 必須 | 削除するカーソルのID |

### レスポンス

空のJSONオブジェクト `{}` を返す。

### 必要なアクセス権

特に必要なし。

### リクエスト例

```bash
curl -X DELETE 'https://sample.cybozu.com/k/v1/records/cursor.json' \
  -H 'X-Cybozu-API-Token: API_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "id": "9a9716fe-1394-4677-a1c7-2199a5d28215"
  }'
```

### レスポンス例

```json
{}
```
