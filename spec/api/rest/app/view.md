# 一覧

## 3.1 一覧設定の取得

**GET** `/k/v1/app/views.json`

アプリの一覧（ビュー）設定を取得する。動作テスト環境用は `/k/v1/preview/app/views.json`。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| app | 数値 | 必須 | アプリID |
| lang | 文字列 | 任意 | 取得する名前の言語（ja, en, zh, user, default） |

### レスポンス

| プロパティ | 型 | 説明 |
|-----------|------|------|
| views | オブジェク�� | 一覧設定のコンテナ |
| views.{viewName}.type | 文字列 | 一覧の表示形式: LIST, CALENDAR, CUSTOM |
| views.{viewName}.builtinType | 文字列 | 組み込み一覧の種類（例: ASSIGNEE） |
| views.{viewName}.name | 文字列 | 一覧名 |
| views.{viewName}.id | 文字列 | 一覧ID |
| views.{viewName}.fields | 配列 | 表示するフィールドコード（LIST タイプのみ） |
| views.{viewName}.date | 文字列 | 日付フィールドコード（CALENDAR タイプのみ） |
| views.{viewName}.title | 文字列 | タイトルフィールドコード（CALENDAR タイプのみ） |
| views.{viewName}.html | 文字列 | カスタムHTML（CUSTOM タイプのみ） |
| views.{viewName}.pager | 真偽値 | ページネーション表示（CUSTOM タイプ） |
| views.{viewName}.device | 文字列 | 表示範囲: DESKTOP, ANY（CUSTOM タイプ） |
| views.{viewName}.filterCond | 文字列 | フィルター条件（クエリ形式） |
| views.{viewName}.sort | 文字列 | ソート条件（クエリ形式） |
| views.{viewName}.index | 文字列 | 表示順（昇順） |
| revision | 文字列 | アプリ設定のリビジョン番号 |

### 必要な権限

- 運用環境: レコード閲覧権限またはレコード追加権限
- 動作テスト環境: アプリ管理権限

### 制限事項

- 同名の一覧がある場合は正しく取得できない

### リクエスト例

```
GET /k/v1/app/views.json?app=8&lang=ja
X-Cybozu-API-Token: API_TOKEN
```

### レスポンス例

```json
{
  "views": {
    "一覧1": {
      "type": "LIST",
      "name": "一覧1",
      "id": "1321",
      "fields": ["レコード番号", "文字列__1行_"],
      "filterCond": "",
      "sort": "レコード番号 asc",
      "index": "0"
    }
  },
  "revision": "2"
}
```

---

## 3.2 一覧設定の変更

**PUT** `/k/v1/preview/app/views.json`

動作テスト環境のアプリの一覧設定を変更する。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| app | 数値 | 必須 | アプリID |
| views | オブジェクト | 必須 | 一覧設定のコンテナ |
| views.{viewName}.index | 文字列 | 必須 | 表示順 |
| views.{viewName}.type | 文字列 | 必須 | 表示形式: LIST, CALENDAR, CUSTOM |
| views.{viewName}.name | 文字列 | 条件付き | 一覧名（最大64文字、新規追加時は必須） |
| views.{viewName}.fields | 配列 | 条件付き | 表示フィールドコード（LIST タイプで必須） |
| views.{viewName}.date | 文字列 | 任意 | 日付フィールドコード（CALENDAR タイプ） |
| views.{viewName}.title | 文字列 | 任意 | タイトルフィールドコード（CALENDAR タイプ） |
| views.{viewName}.html | 文字列 | 任意 | カスタムHTML（CUSTOM タイプ） |
| views.{viewName}.pager | 真偽値 | 任意 | ページネーション（CUSTOM タイプ、デフォルト: true） |
| views.{viewName}.device | 文字列 | 任意 | 表示環境: DESKTOP, ANY（CUSTOM タイプ） |
| views.{viewName}.filterCond | 文字列 | 任意 | フィルター条件 |
| views.{viewName}.sort | 文字列 | 任意 | ソート条件 |
| revision | 数値/文字列 | 任意 | 期待するリビジョン番号 |

### レスポンス

| プロパティ | 型 | 説明 |
|-----------|------|------|
| views | オブジェクト | 更新された一覧情報 |
| views.{viewName}.id | 文字列 | 一覧ID |
| revision | 文字列 | 更新後のリビジョン番号 |

### 必要な権限

- LIST/CALENDAR 一覧: アプリ管理権限
- CUSTOM 一覧: OpenDesk システム管理権限

### 制限事項

- 同名の一覧は変更不可
- カスタムビューを含むアプリでは API トークン認証が使用不可

### リクエスト例

```json
// PUT /k/v1/preview/app/views.json
{
  "app": 18,
  "views": {
    "一覧1": {
      "index": "0",
      "type": "LIST",
      "name": "一覧1",
      "fields": ["レコード番号", "文字列__1行_"],
      "filterCond": "更新日時 > \"2012-02-03T09:00:00Z\"",
      "sort": "レコード番号 asc"
    }
  }
}
```

### レスポンス例

```json
{
  "views": {
    "一覧1": { "id": "1321" }
  },
  "revision": 2
}
```

---
