# 一括処理

## 一括リクエスト

`POST /k/v1/bulkRequest.json`

複数のAPIリクエストをまとめて1回のリクエストで実行する。異なるアプリに対する操作も同時に実行可能。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| requests | オブジェクトの配列 | 必須 | 実行するAPIリクエストの一覧。最大20件。 |
| requests[].method | 文字列 | 必須 | HTTPメソッド（`POST`, `PUT`, `DELETE`） |
| requests[].api | 文字列 | 必須 | APIのエンドポイントパス（例: `/k/v1/record.json`） |
| requests[].payload | オブジェクト | 必須 | 各APIに渡すリクエストボディ |

### レスポンス

| プロパティ | 型 | 説明 |
|---|---|---|
| results | 配列 | 各リクエストのレスポンスの配列（リクエスト順）。成功時は各APIのレスポンス、失敗時はエラー情報を含む。 |

### 利用可能なAPI

以下のレコード操作APIを一括実行可能:
- レコード1件登録 (`POST /k/v1/record.json`)
- レコード複数登録 (`POST /k/v1/records.json`)
- レコード1件更新 (`PUT /k/v1/record.json`)
- レコード複数更新 (`PUT /k/v1/records.json`)
- レコード削除 (`DELETE /k/v1/records.json`)
- ステータス更新1件 (`PUT /k/v1/record/status.json`)
- ステータス更新複数 (`PUT /k/v1/records/status.json`)
- 作業者更新 (`PUT /k/v1/record/assignees.json`)

### 制限事項

- 1回のリクエストに含められるAPIは **最大20件**
- いずれかのAPIが失敗すると、**後続のAPIは実行されず全処理がロールバック** される
- ゲストスペースのアプリは同一ゲストスペース内のアプリのみまとめて処理可能
- ゲストスペースと通常スペースのアプリ、異なるゲストスペースのアプリを混在させることはできない
- APIトークン認証で複数アプリにまたがる場合、各アプリのトークンをそれぞれ指定する必要がある

### リクエスト例

```bash
curl -X POST 'https://sample.cybozu.com/k/v1/bulkRequest.json' \
  -H 'X-Cybozu-API-Token: API_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "requests": [
      {
        "method": "POST",
        "api": "/k/v1/record.json",
        "payload": {
          "app": 1,
          "record": {
            "文字列1行": { "value": "バルクテスト" }
          }
        }
      },
      {
        "method": "PUT",
        "api": "/k/v1/record.json",
        "payload": {
          "app": 1,
          "id": 100,
          "record": {
            "文字列1行": { "value": "バルク更新" }
          }
        }
      },
      {
        "method": "DELETE",
        "api": "/k/v1/records.json",
        "payload": {
          "app": 2,
          "ids": [50, 51]
        }
      }
    ]
  }'
```

### レスポンス例

```json
{
  "results": [
    { "id": "200", "revision": "1" },
    { "revision": "5" },
    {}
  ]
}
```
