# REST API: プラグイン・API情報

## 1. インストール済みプラグインの取得

### メソッド・エンドポイント

```
GET /k/v1/plugins.json
```

### 説明

OpenDeskにインストール済みのプラグイン一覧を取得する。並び順はインストール日時の降順。

### リクエストパラメータ

| パラメータ | 型 | 必須/任意 | 説明 |
|---|---|---|---|
| offset | 数値または文字列 | 任意 | 取得をスキップする件数（デフォルト: 0） |
| limit | 数値または文字列 | 任意 | 取得件数の上限。1~100（デフォルト: 100） |
| ids | 配列 | 任意 | 取得対象のプラグインID。最大100件 |

### レスポンス

| フィールド | 型 | 説明 |
|---|---|---|
| plugins | 配列 | インストール済みプラグインの一覧 |
| plugins[].id | 文字列 | プラグインID |
| plugins[].name | 文字列 | プラグインの名前 |
| plugins[].description | 文字列 | プラグインの説明 |
| plugins[].isMarketPlugin | 真偽値 | プラグインストアのプラグインかどうか |
| plugins[].version | 文字列 | プラグインのバージョン |

### 制限事項

- 認証はパスワード認証またはセッション認証
- 必要なアクセス権は特になし

### リクエスト例

```bash
curl -X GET 'https://sample.cybozu.com/k/v1/plugins.json?offset=0&limit=10' \
  -H 'X-Cybozu-Authorization: QWRtaW5pc3RyYXRvcjpjeWJvenU='
```

### レスポンス例

```json
{
  "plugins": [
    {
      "id": "djmhffjhfgmebgnmcggopedaofckljlj",
      "name": "サンプルプラグイン",
      "description": "プラグインの説明",
      "isMarketPlugin": false,
      "version": "1.0.0"
    }
  ]
}
```

---

## 2. インストールが必要なプラグインの取得

### メソッド・エンドポイント

```
GET /k/v1/plugins/required.json
```

### 説明

アプリで使用されているがまだインストールされていないプラグインの一覧を取得する。並び順はプラグインIDの昇順。

### リクエストパラメータ

| パラメータ | 型 | 必須/任意 | 説明 |
|---|---|---|---|
| offset | 数値または文字列 | 任意 | 取得をスキップする件数（デフォルト: 0） |
| limit | 数値または文字列 | 任意 | 取得件数の上限。1~100（デフォルト: 100） |

### レスポンス

| フィールド | 型 | 説明 |
|---|---|---|
| plugins | 配列 | インストールが必要なプラグインの一覧 |
| plugins[].id | 文字列 | プラグインID |
| plugins[].name | 文字列 | プラグイン名（取得できない場合はnull） |
| plugins[].isMarketPlugin | 真偽値 | プラグインストアのプラグインかどうか |

### 制限事項

- 認証はパスワード認証またはセッション認証
- 必要なアクセス権は特になし
- プラグインが存在しない場合は空配列が返される

### リクエスト例

```bash
curl -X GET 'https://sample.cybozu.com/k/v1/plugins/required.json?offset=0&limit=10' \
  -H 'X-Cybozu-Authorization: QWRtaW5pc3RyYXRvcjpjeWJvenU='
```

### レスポンス例

```json
{
  "plugins": [
    {
      "id": "djmhffjhfgmebgnmcggopedaofckljlj",
      "name": "サンプルプラグイン",
      "isMarketPlugin": false
    }
  ]
}
```

---

## 3. プラグイン追加済みアプリの取得

### メソッド・エンドポイント

```
GET /k/v1/plugin/apps.json
```

### 説明

指定したプラグインが追加されているアプリの一覧を取得する。並び順はアプリIDの昇順。

### リクエストパラメータ

| パラメータ | 型 | 必須/任意 | 説明 |
|---|---|---|---|
| id | 文字列 | 必須 | プラグインID |
| offset | 数値または文字列 | 任意 | 取得をスキップする件数（デフォルト: 0） |
| limit | 数値または文字列 | 任意 | 取得件数の上限。1~500（デフォルト: 100） |

### レスポンス

| フィールド | 型 | 説明 |
|---|---|---|
| apps | 配列 | プラグイン追加済みアプリ情報の配列。該当なしの場合は空配列 |
| apps[].id | 文字列 | アプリID |
| apps[].name | 文字列 | アプリ名 |

### 制限事項

- cybozu.com共通管理者権限が必要
- プラグイン追加反映前のアプリ情報も取得可能

### リクエスト例

```bash
curl -X GET 'https://sample.cybozu.com/k/v1/plugin/apps.json?id=djmhffjhfgmebgnmcggopedaofckljlj&offset=0&limit=10' \
  -H 'X-Cybozu-Authorization: QWRtaW5pc3RyYXRvcjpjeWJvenU='
```

### レスポンス例

```json
{
  "apps": [
    {
      "id": "1",
      "name": "サンプルアプリ"
    },
    {
      "id": "2",
      "name": "顧客管理アプリ"
    }
  ]
}
```

---

## 4. プラグインの読み込み（インストール）

### メソッド・エンドポイント

```
POST /k/v1/plugin.json
```

### 説明

ファイルアップロードAPIで事前にアップロードしたプラグインファイルをOpenDeskに読み込む（インストールする）。

### リクエストパラメータ

| パラメータ | 型 | 必須/任意 | 説明 |
|---|---|---|---|
| fileKey | 文字列 | 必須 | ファイルアップロードAPI（POST /k/v1/file.json）でアップロードしたプラグインファイルのファイルキー |

### レスポンス

| フィールド | 型 | 説明 |
|---|---|---|
| id | 文字列 | プラグインID |
| version | 文字列 | プラグインのバージョン |

### 制限事項

- OpenDeskシステム管理者権限が必要
- 認証はパスワード認証またはセッション認証

### リクエスト例

```bash
curl -X POST 'https://sample.cybozu.com/k/v1/plugin.json' \
  -H 'X-Cybozu-Authorization: QWRtaW5pc3RyYXRvcjpjeWJvenU=' \
  -H 'Content-Type: application/json' \
  -d '{
    "fileKey": "c15b3870-7505-4ab6-9d8d-b9bdbc74f5d6"
  }'
```

### レスポンス例

```json
{
  "id": "djmhffjhfgmebgnmcggopedaofckljlj",
  "version": "1"
}
```

---

## 5. プラグインの更新

### メソッド・エンドポイント

```
PUT /k/v1/plugin.json
```

### 説明

インストール済みのプラグインを新しいバージョンに更新する。

### リクエストパラメータ

| パラメータ | 型 | 必須/任意 | 説明 |
|---|---|---|---|
| id | 文字列 | 必須 | 更新するプラグインのプラグインID |
| fileKey | 文字列 | 必須 | ファイルアップロードAPI（POST /k/v1/file.json）でアップロードしたプラグインファイルのファイルキー |

### レスポンス

| フィールド | 型 | 説明 |
|---|---|---|
| id | 文字列 | 更新されたプラグインのプラグインID |
| version | 文字列 | プラグインのバージョン |

### 制限事項

- OpenDeskシステム管理者権限が必要
- 認証はパスワード認証またはセッション認証

### リクエスト例

```bash
curl -X PUT 'https://sample.cybozu.com/k/v1/plugin.json' \
  -H 'X-Cybozu-Authorization: QWRtaW5pc3RyYXRvcjpjeWJvenU=' \
  -H 'Content-Type: application/json' \
  -d '{
    "id": "djmhffjhfgmebgnmcggopedaofckljlj",
    "fileKey": "c15b3870-7505-4ab6-9d8d-b9bdbc74f5d6"
  }'
```

### レスポンス例

```json
{
  "id": "djmhffjhfgmebgnmcggopedaofckljlj",
  "version": "2"
}
```

---

## 6. プラグインのアンインストール

### メソッド・エンドポイント

```
DELETE /k/v1/plugin.json
```

### 説明

OpenDeskにインストールされているプラグインをアンインストールする。

### リクエストパラメータ

| パラメータ | 型 | 必須/任意 | 説明 |
|---|---|---|---|
| id | 文字列 | 必須 | アンインストールするプラグインのプラグインID |

### レスポンス

```json
{}
```

空のJSONオブジェクトが返される。

### 制限事項

- OpenDeskシステム管理者権限が必要
- 認証はパスワード認証またはセッション認証

### リクエスト例

```bash
curl -X DELETE 'https://sample.cybozu.com/k/v1/plugin.json' \
  -H 'X-Cybozu-Authorization: QWRtaW5pc3RyYXRvcjpjeWJvenU=' \
  -H 'Content-Type: application/json' \
  -d '{
    "id": "djmhffjhfgmebgnmcggopedaofckljlj"
  }'
```

### レスポンス例

```json
{}
```

---

## 7. API一覧の取得

### メソッド・エンドポイント

```
GET /k/v1/apis.json
```

### 説明

OpenDesk REST APIの一覧を取得する。認証情報は不要。

### リクエストパラメータ

なし

### レスポンス

| フィールド | 型 | 説明 |
|---|---|---|
| baseUrl | 文字列 | APIを実行するときの基本となるURL |
| apis | オブジェクト | 各APIの情報一覧。キーはAPIのID文字列 |
| apis.{APIのID} | オブジェクト | 各APIの情報 |
| apis.{APIのID}.link | 文字列 | APIのスキーマ情報を取得するためのAPIのURL |

### 制限事項

- 認証情報は不要
- このAPI自体と「OpenDesk REST APIのスキーマ情報を取得するAPI」の情報は取得できない
- スペース・ピープル・ゲストスペース機能を無効にしている場合でも、すべてのAPI一覧が取得される

### リクエスト例

```bash
curl -X GET 'https://sample.cybozu.com/k/v1/apis.json'
```

### レスポンス例

```json
{
  "baseUrl": "https://sample.cybozu.com/k/v1/",
  "apis": {
    "records/get": {
      "link": "apis/records/get.json"
    },
    "record/get": {
      "link": "apis/record/get.json"
    },
    "record/post": {
      "link": "apis/record/post.json"
    }
  }
}
```

---

## 8. APIスキーマ情報の取得

### メソッド・エンドポイント

```
GET /k/v1/apis/{API_ID}.json
```

### 説明

指定したOpenDesk REST APIのスキーマ情報（リクエスト/レスポンスの構造）をJSON Schema形式で取得する。認証情報は不要。

### パスパラメータ

| パラメータ | 説明 |
|---|---|
| API_ID | 取得対象のAPI識別子（例: `record/get`、`records/get`） |

### リクエストパラメータ

なし

### レスポンス

| フィールド | 型 | 説明 |
|---|---|---|
| id | 文字列 | OpenDesk REST APIのAPIのID |
| baseUrl | 文字列 | APIを実行するときの基本となるURL |
| path | 文字列 | APIのパス。baseUrlと結合して完全なURLになる |
| httpMethod | 文字列 | APIを実行するためのHTTPメソッド |
| request | オブジェクト | APIリクエストのスキーマ情報（JSON Schema形式） |
| response | オブジェクト | APIレスポンスのスキーマ情報（JSON Schema形式） |
| schemas | オブジェクト | API共通スキーマ情報の一覧 |

### 制限事項

- 認証情報は不要
- 以下のAPIのスキーマ情報は取得できない:
  - OpenDesk REST APIの一覧を取得するAPI（GET /k/v1/apis.json）
  - このAPIスキーマ取得API自体（GET /k/v1/apis/{API_ID}.json）

### リクエスト例

```bash
curl -X GET 'https://sample.cybozu.com/k/v1/apis/record/get.json'
```

### レスポンス例

```json
{
  "id": "record/get",
  "baseUrl": "https://sample.cybozu.com/k/v1/",
  "path": "record.json",
  "httpMethod": "GET",
  "request": {
    "type": "object",
    "properties": {
      "app": {
        "type": ["string", "integer"],
        "required": true
      },
      "id": {
        "type": ["string", "integer"],
        "required": true
      }
    }
  },
  "response": {
    "type": "object",
    "properties": {
      "record": {
        "$ref": "record"
      }
    }
  },
  "schemas": {
    "record": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "properties": {
          "type": { "type": "string" },
          "value": {}
        }
      }
    }
  }
}
```
