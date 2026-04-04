# アクセス権

## 7.1 アプリアクセス権の取得

**GET** `/k/v1/app/acl.json`

アプリのアクセス権設定を取得する。動作テスト環境用は `/k/v1/preview/app/acl.json`。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| app | 数値または文字列 | 必須 | アプリID |

### レスポンス

| プロパティ | 型 | 説明 |
|-----------|------|------|
| rights | 配列 | アクセス権設定リスト（優先順位順） |
| rights[].entity | オブジェクト | アクセス権の対象 |
| rights[].entity.type | 文字列 | 対象種別: USER, GROUP, ORGANIZATION, CREATOR |
| rights[].entity.code | 文字列 | 対象コード（CREATOR の場合は null） |
| rights[].includeSubs | 真偽値 | 下位組織への継承 |
| rights[].appEditable | 真偽値 | アプリ管理権限 |
| rights[].recordViewable | 真偽値 | レコード閲覧権限 |
| rights[].recordAddable | 真偽値 | レコード追加権限 |
| rights[].recordEditable | 真偽値 | レコード編集権限 |
| rights[].recordDeletable | 真偽値 | レコード削除権限 |
| rights[].recordImportable | 真偽値 | ファイルインポート権限 |
| rights[].recordExportable | 真偽値 | ファイルエクスポート権限 |
| revision | 文字列 | 設定のリビジョン番号 |

### 必要な権限

アプリ管理権限

### リクエスト例

```
GET /k/v1/app/acl.json?app=8
X-Cybozu-Authorization: QWRtaW5pc3RyYXRvcjpjeWJvenU=
```

### レスポンス例

```json
{
  "rights": [
    {
      "entity": { "type": "USER", "code": "user1" },
      "includeSubs": false,
      "appEditable": true,
      "recordViewable": true,
      "recordAddable": true,
      "recordEditable": true,
      "recordDeletable": true,
      "recordImportable": true,
      "recordExportable": true
    }
  ],
  "revision": "2"
}
```

---

## 7.2 アプリアクセス権の変更

**PUT** `/k/v1/app/acl.json`（運用環境）/ `/k/v1/preview/app/acl.json`（動作テスト環境）

アプリのアクセス権設定を変更する。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| app | 数値/文字列 | 必須 | アプリID |
| rights | 配列 | 必須 | アクセス権設定（優先順位順） |
| rights[].entity | オブジェクト | 必須 | アクセス権の対象 |
| rights[].entity.type | 文字列 | 必須 | USER, GROUP, ORGANIZATION, CREATOR |
| rights[].entity.code | 文字列 | 条件付き | 対象コード（CREATOR 以外で必須） |
| rights[].includeSubs | 真偽値/文字列 | 任意 | 下位組織への継承（デフォルト: false） |
| rights[].appEditable | 真偽値/文字列 | 任意 | アプリ管理権限（デフォルト: false） |
| rights[].recordViewable | 真偽値/文字列 | 任意 | レコード閲覧権限（デフォルト: false） |
| rights[].recordAddable | 真偽値/文字列 | 任意 | レコード追加権限（デフォルト: false） |
| rights[].recordEditable | 真偽値/文字列 | 任意 | レコード編集権限（デフォルト: false） |
| rights[].recordDeletable | 真偽値/文字列 | 任意 | レコード削除権限（デフォルト: false） |
| rights[].recordImportable | 真偽値/文字列 | 任意 | ファイルインポート権限（デフォルト: false） |
| rights[].recordExportable | 真偽値/文字列 | 任意 | ファイルエクスポート権限（デフォルト: false） |
| revision | 数値/文字列 | 任意 | 期待するリビジョン番号 |

### レスポンス

| プロパティ | 型 | 説明 |
|-----------|------|------|
| revision | 文字列 | 更新後のリビジョン番号 |

### 必要な権限

アプリ管理権限

### 制限事項

- レコードの編集/削除権限には閲覧権限が必要
- ファイルインポートにはレコード追加権限が必要
- 「Everyone」グループは指定した優先順位に関わらず最低優先度になる
- ゲストユーザーのログイン名には "guest/" プレフィックスが必要

### リクエスト例

```json
// PUT /k/v1/app/acl.json
{
  "app": 1,
  "rights": [
    {
      "entity": { "type": "USER", "code": "user1" },
      "appEditable": true,
      "recordViewable": true,
      "recordAddable": true
    }
  ],
  "revision": 2
}
```

### レスポンス例

```json
{
  "revision": "3"
}
```

---

## 7.3 レコードアクセス権の取得

**GET** `/k/v1/record/acl.json`

レコードのアクセス権設定を取得する。動作テスト環境用は `/k/v1/preview/record/acl.json`。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| app | 数値または文字列 | 必須 | アプリID |
| lang | 文字列 | 任意 | 取得する名前の言語（ja, en, zh, user, default） |

### レスポンス

| プロパティ | 型 | 説明 |
|-----------|------|------|
| rights | 配列 | アクセス権設定リスト（優先順位順） |
| rights[].filterCond | 文字列 | レコード条件（クエリ形式） |
| rights[].entities | 配��� | アクセス権対象リスト（優先順位順） |
| rights[].entities[].entity | オブジェクト | 対象詳細 |
| rights[].entities[].entity.type | 文字列 | USER, GROUP, ORGANIZATION, FIELD_ENTITY |
| rights[].entities[].entity.code | 文字列 | 対象コード |
| rights[].entities[].viewable | 真偽値 | 閲覧権限 |
| rights[].entities[].editable | 真偽値 | 編集権限 |
| rights[].entities[].deletable | 真偽値 | 削除権限 |
| rights[].entities[].includeSubs | 真偽値 | 下位組織への継承 |
| revision | 文字列 | 設定のリビジョン番号 |

### 必要な権限

アプリ管理権限

### リクエスト例

```
GET /k/v1/record/acl.json?app=1&lang=ja
X-Cybozu-API-Token: API_TOKEN
```

### レスポンス例

```json
{
  "rights": [
    {
      "filterCond": "更新日時 > \"2012-02-03T09:00:00Z\" and 更新日時 < \"2012-02-03T10:00:00Z\"",
      "entities": [
        {
          "entity": { "type": "ORGANIZATION", "code": "org1" },
          "viewable": false,
          "editable": false,
          "deletable": false,
          "includeSubs": true
        }
      ]
    }
  ],
  "revision": "2"
}
```

---

## 7.4 レコードアクセス権の変更

**PUT** `/k/v1/record/acl.json`（運用環境）/ `/k/v1/preview/record/acl.json`（動作テスト環境）

レコードのアクセス権設定を変更する。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| app（または id） | 数値/文字列 | 必須 | アプリID（両方指定時は id が���先） |
| rights | 配列 | 必須 | アクセス権設定（優先順位順） |
| rights[].filterCond | 文字列 | 任意 | レコード条件（省略時は全レコード対象） |
| rights[].entities | 配列 | 必須 | アクセス権対象（優先順位順） |
| rights[].entities[].entity | オブジェクト | 必須 | 対象詳細 |
| rights[].entities[].entity.type | 文字列 | 必須 | USER, GROUP, ORGANIZATION, FIELD_ENTITY |
| rights[].entities[].entity.code | 文字列 | 必須 | 対象コード |
| rights[].entities[].viewable | 真偽値/文字列 | 任意 | 閲覧権限（デフォルト: false） |
| rights[].entities[].editable | 真偽値/文字列 | 任意 | 編集権限（デフォルト: false、viewable=true が前提） |
| rights[].entities[].deletable | 真偽値/文字列 | 任意 | 削除権限（デフォルト: false、viewable=true が前提） |
| rights[].entities[].includeSubs | 真偽値/文字列 | 任意 | 下位組織への継承（デフォルト: false） |
| revision | 数値/文字列 | 任意 | 期待するリビジョン番号 |

### レスポンス

| プロパティ | 型 | 説明 |
|-----------|------|------|
| revision | 文字列 | 更新後のリビジョン番号 |

### 必要な権限

アプリ管理権限

### 制限事項

filterCond の制約:
- `order by`, `limit`, `offset` は使用不可
- `and` と `or` の混在不可
- 文字列1行、リンクフィールド: `like`, `not like` 不可
- レコード番号、数値、計算フィールド: `in`, `>`, `<` 不可
- ステータスフィールド: `=` 不可
- 複数行テキスト、リッチエディター、添付ファイル: 条件に使用不可
- 日付関数（NOW(), TODAY() 等）は使用不可

権限の依存関係:
- 編集・削除権限には閲覧権限が必要
- 閲覧権限を無効にすると、編集・削除権限も強制的に無効になる

### リクエスト例

```json
// PUT /k/v1/record/acl.json
{
  "app": 1,
  "rights": [
    {
      "filterCond": "更新日時 > \"2012-02-03T09:00:00Z\"",
      "entities": [
        {
          "entity": { "type": "USER", "code": "user1" },
          "viewable": false,
          "editable": false,
          "deletable": false
        },
        {
          "entity": { "type": "FIELD_ENTITY", "code": "更新者" },
          "viewable": true,
          "editable": true,
          "deletable": true
        }
      ]
    }
  ],
  "revision": 2
}
```

### レスポンス例

```json
{
  "revision": "3"
}
```

---

## 7.5 フィールドアクセス権の取得

**GET** `/k/v1/field/acl.json`

フィールドのアクセス権設定を取得する。動作テスト環境用は `/k/v1/preview/field/acl.json`。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| app | 数値または文字列 | 必須 | アプリID |

### レスポンス

| プロパティ | 型 | 説明 |
|-----------|------|------|
| rights | 配列 | フィールドアクセス権設定 |
| rights[].code | 文字列 | アクセス権が設定されたフィールドコード |
| rights[].entities | 配列 | アクセス権対象リスト（優先順位順） |
| rights[].entities[].accessibility | 文字列 | 権限レベル: READ（閲覧のみ）, WRITE（閲覧+編集）, NONE（アクセス不可） |
| rights[].entities[].entity | オブジェクト | 対象詳細 |
| rights[].entities[].entity.type | 文字列 | USER, GROUP, ORGANIZATION, FIELD_ENTITY |
| rights[].entities[].entity.code | 文字列 | 対象コード |
| rights[].entities[].includeSubs | 真偽値 | 下位組織への継承 |
| revision | 文字列 | 設定のリビジョン番号 |

### 必要な権限

アプリ管理権限

### リクエスト例

```
GET /k/v1/field/acl.json?app=1
X-Cybozu-API-Token: API_TOKEN
```

### レスポンス例

```json
{
  "rights": [
    {
      "code": "text_field",
      "entities": [
        {
          "accessibility": "WRITE",
          "entity": { "type": "USER", "code": "user1" },
          "includeSubs": false
        }
      ]
    }
  ],
  "revision": "2"
}
```

---

## 7.6 フィールドアクセス権の変更

**PUT** `/k/v1/field/acl.json`（運用環境）/ `/k/v1/preview/field/acl.json`（動作テスト環境）

フィールドのアクセス権設定を変更する。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| app（または id） | 数値/文字列 | 必須 | アプリID（両方指定時は id が優先） |
| rights | 配列 | 必須 | フィールドアクセス権設定 |
| rights[].code | 文字列 | 必須 | フィールドコード |
| rights[].entities | 配列 | 必須 | アクセス権対象（優先順位順） |
| rights[].entities[].accessibility | 文字列 | 必須 | READ, WRITE, NONE |
| rights[].entities[].entity | オブジェクト | 必須 | 対象詳細 |
| rights[].entities[].entity.type | 文字列 | 必須 | USER, GROUP, ORGANIZATION, FIELD_ENTITY |
| rights[].entities[].entity.code | 文字列 | 必須 | 対象コード |
| rights[].entities[].includeSubs | 真偽値/文字列 | 任意 | 下位組織への継承（デフォルト: false） |
| revision | 数値/文字列 | 任意 | 期待するリビジョン番号 |

### レスポンス

| プロパティ | 型 | 説明 |
|-----------|------|------|
| revision | 文字列 | 更新後のリビジョン番号 |

### 必要な権限

アプリ管理権限

### 制限事項

- 「Everyone」は指定した優先順位に関わらず最低優先度
- 「Everyone」を省略するとデフォルトで全ユーザーのアクセスが拒否される
- 変更は段階的に反映される

### リクエスト例

```json
// PUT /k/v1/field/acl.json
{
  "app": 1,
  "rights": [
    {
      "code": "文字列_0",
      "entities": [
        {
          "accessibility": "WRITE",
          "entity": { "type": "USER", "code": "user1" }
        },
        {
          "accessibility": "READ",
          "entity": { "type": "GROUP", "code": "group1" }
        }
      ]
    }
  ]
}
```

### レスポンス例

```json
{
  "revision": "3"
}
```
