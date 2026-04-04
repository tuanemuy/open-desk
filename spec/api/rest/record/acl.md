# レコードアクセス権

## レコードアクセス権評価

`GET /k/v1/records/acl/evaluate.json`

APIを実行したユーザーについて、レコードやフィールドのアクセス権設定を取得する。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| app | 数値または文字列 | 必須 | アプリID |
| ids | 数値または文字列の配列 | 必須 | 評価対象のレコードID。最大100件。存在しないIDを指定するとエラー。 |

### レスポンス

| プロパティ | 型 | 説明 |
|---|---|---|
| rights | オブジェクトの配列 | アクセス権情報の配列 |
| rights[].id | 文字列 | レコードID |
| rights[].record | オブジェクト | レコードレベルのアクセス権 |
| rights[].record.viewable | 真偽値 | 閲覧権限。メンテナンス中は `false`。 |
| rights[].record.editable | 真偽値 | 編集権限。メンテナンス中は `false`。 |
| rights[].record.deletable | 真偽値 | 削除権限。メンテナンス中は `false`。 |
| rights[].fields | オブジェクト | フィールドレベルのアクセス権。キーはフィールドコード。 |
| rights[].fields.{fieldCode}.viewable | 真偽値 | フィールドの閲覧権限 |
| rights[].fields.{fieldCode}.editable | 真偽値 | フィールドの編集権限 |

### 認証方式

- パスワード認証
- セッション認証

**注意: APIトークン認証は使用不可。**

### 必要なアクセス権

- レコードの閲覧権限、またはレコードの追加権限

### 制限事項

- 一度に評価できるレコードは **最大100件**
- 以下のフィールドのアクセス権は取得できない:
  - レコード番号、ラベル、セパレーター、スペース、テーブル（フィールドのアクセス権で設定不可）
  - グループ、関連レコード一覧
  - 作成者、作成日時、更新者、更新日時
- フィールドレベルのアクセス権はレコードレベルのアクセス権によって上書きされる
- テーブル内のフィールドは通常フィールドと同じ階層で返される

### リクエスト例

```bash
curl -X GET 'https://sample.cybozu.com/k/v1/records/acl/evaluate.json' \
  -H 'X-Cybozu-Authorization: QWRtaW5pc3RyYXRvcjpjeWJvenU=' \
  -H 'Content-Type: application/json' \
  -d '{"app": 1, "ids": [1, 2]}'
```

### レスポンス例

```json
{
  "rights": [
    {
      "id": "1",
      "record": {
        "viewable": true,
        "editable": true,
        "deletable": false
      },
      "fields": {
        "文字列1行": {
          "viewable": true,
          "editable": true
        },
        "数値": {
          "viewable": true,
          "editable": false
        }
      }
    },
    {
      "id": "2",
      "record": {
        "viewable": true,
        "editable": false,
        "deletable": false
      },
      "fields": {
        "文字列1行": {
          "viewable": true,
          "editable": false
        },
        "数値": {
          "viewable": true,
          "editable": false
        }
      }
    }
  ]
}
```
