# 通知設定

## 6.1 条件通知の取得

**GET** `/k/v1/app/notifications/general.json`

アプリの条件通知設定を取得する。動作テスト環境用は `/k/v1/preview/app/notifications/general.json`。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| app | 数値または文字列 | 必須 | アプ���ID |

### レスポンス

| プロパティ | 型 | 説明 |
|-----------|------|------|
| notifications | 配列 | 通知設定の配列 |
| notifications[].entity | オブジェクト | 通知対象 |
| notifications[].entity.type | 文字列 | 対象種別: USER, GROUP, ORGANIZATION, FIELD_ENTITY |
| notifications[].entity.code | 文字列 | 対象コード |
| notifications[].includeSubs | 真偽値 | 下位組織への継承 |
| notifications[].recordAdded | 真偽値 | レコード追加時に通知 |
| notifications[].recordEdited | 真偽値 | レコード編集時に通知 |
| notifications[].commentAdded | 真偽値 | コメント追加時に通知 |
| notifications[].statusChanged | 真偽値 | ステータス変更時に通知 |
| notifications[].fileImported | 真偽値 | ファイルインポート時に通知 |
| notifyToCommenter | 真偽値 | コメント投稿者にその後のコメントを通知するか |
| revision | 文字列 | 設定のリビジョン番号 |

### 必要な権限

アプリ管理���限

### リクエスト例

```
GET /k/v1/app/notifications/general.json?app=1
X-Cybozu-API-Token: API_TOKEN
```

### レスポンス例

```json
{
  "notifications": [
    {
      "entity": { "type": "USER", "code": "user1" },
      "includeSubs": false,
      "recordAdded": true,
      "recordEdited": true,
      "commentAdded": false,
      "statusChanged": false,
      "fileImported": true
    }
  ],
  "notifyToCommenter": true,
  "revision": "2"
}
```

---

## 6.2 条件通知の変更

**PUT** `/k/v1/preview/app/notifications/general.json`

動作テスト環境のアプリの条件通知設定を変更する。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| app | 数値/文字列 | 必須 | アプリID |
| notifications | 配列 | 任意 | 通知設定（省略された設定は削除される。空配列で全削除） |
| notifications[].entity | オブジェクト | 条件付き | 通知対象（notifications 指定時に必須） |
| notifications[].entity.type | 文字列 | 条件付き | USER, GROUP, ORGANIZATION, FIELD_ENTITY |
| notifications[].entity.code | 文字列 | 条件付き | 対象コード |
| notifications[].includeSubs | 真偽値/��字列 | 任意 | 下位組織への継承（デフォルト: false） |
| notifications[].recordAdded | 真偽値/文字列 | 任意 | レコード追加時に通知（デフォルト: false） |
| notifications[].recordEdited | 真偽値/文字列 | 任意 | レコード編集時に通知（デフォルト: false） |
| notifications[].commentAdded | 真偽値/文字列 | 任意 | コメント追加時に通知（デフォルト: false） |
| notifications[].statusChanged | 真偽値/文字列 | 任意 | ステータス変更時に通知（デフォルト: false） |
| notifications[].fileImported | 真偽値/文字列 | 任意 | ファイルインポート時に通知（デフォルト: false） |
| notifyToCommenter | 真偽値/文字列 | 任意 | コメント投稿者通知 |
| revision | 数値/文字列 | 任意 | 期待するリビジョン番号 |

### レスポンス

| プロパティ | 型 | 説明 |
|-----------|------|------|
| revision | 文字列 | 更新後のリビジョン番号 |

### 必要な権限

アプリ管理権限

### 制限事項

- ゲストユーザーのログイン名には "guest/" プレフィックスが必要

### リクエスト例

```json
// PUT /k/v1/preview/app/notifications/general.json
{
  "app": "1",
  "notifications": [
    {
      "entity": { "type": "USER", "code": "user1" },
      "recordAdded": true,
      "recordEdited": true,
      "commentAdded": false,
      "statusChanged": false,
      "fileImported": true
    }
  ],
  "notifyToCommenter": true,
  "revision": "2"
}
```

### レスポンス例

```json
{
  "revision": "2"
}
```

---

## 6.3 レコード条件通知の取得

**GET** `/k/v1/app/notifications/perRecord.json`

レコード単位の条件通知設定を取得する。動作テスト環境用は `/k/v1/preview/app/notifications/perRecord.json`。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| app | 数値または文字列 | 必須 | アプリID |
| lang | 文字列 | 任意 | 取得する名前の言語（ja, en, zh, user, default） |

### レスポンス

| プロパティ | 型 | 説明 |
|-----------|------|------|
| notifications | 配列 | 通知設定の配列 |
| notifications[].filterCond | 文字列 | レコード条件（クエリ形式） |
| notifications[].title | 文字列 | 通知メッセージ |
| notifications[].targets | 配列 | 通知先リスト |
| notifications[].targets[].entity | オブジェクト | 通知先詳細 |
| notifications[].targets[].entity.type | 文字列 | USER, GROUP, ORGANIZATION, FIELD_ENTITY |
| notifications[].targets[].entity.code | 文字列 | 対象コード |
| notifications[].targets[].includeSubs | 真偽値 | 下位組織への継承 |
| revision | 文字列 | 設定のリビジョン番号 |

### 必要な権限

アプリ管理権限

### リクエスト例

```
GET /k/v1/app/notifications/perRecord.json?app=8
X-Cybozu-API-Token: API_TOKEN
```

### レスポンス例

```json
{
  "notifications": [
    {
      "filterCond": "ユーザー選択_0 in (\"user1\")",
      "title": "user1が選択されました",
      "targets": [
        {
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

## 6.4 レコード条件通知の変更

**PUT** `/k/v1/preview/app/notifications/perRecord.json`

動作テスト環境のレコード条件通知設定を変更する。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| app | 数値/文字列 | 必須 | アプリID |
| notifications | 配列 | 必須 | 通知設定（既存設定も含めて指定。省略すると削除される） |
| notifications[].filterCond | 文字列 | 任意 | レコード条件（省略時は全レコード対象） |
| notifications[].title | 文字列 | 任意 | 通知メッセージ（デフォルト: 空文字列） |
| notifications[].targets | 配列 | 条件付き | 通知先（notifications 指定時に必須） |
| notifications[].targets[].entity | オブジェクト | 条件付き | 通知先詳細 |
| notifications[].targets[].entity.type | 文字列 | 条件付き | USER, GROUP, ORGANIZATION, FIELD_ENTITY |
| notifications[].targets[].entity.code | 文字列 | 条件付き | 対象コード |
| notifications[].targets[].includeSubs | 真偽値/文字列 | 任意 | 下位組織への継承（デフォルト: false） |
| revision | 数値/文字列 | 任意 | 期待するリビジョン番号 |

### レスポンス

| プロパティ | 型 | 説明 |
|-----------|------|------|
| revision | 文字列 | 更新後のリビジョン番号 |

### 必要な権限

アプリ管理権限

### リクエスト例

```json
// PUT /k/v1/preview/app/notifications/perRecord.json
{
  "app": "1",
  "notifications": [
    {
      "filterCond": "ユーザー選択フィールド in (\"user1\")",
      "title": "user1が選択されました",
      "targets": [
        { "entity": { "type": "USER", "code": "user1" } }
      ]
    }
  ],
  "revision": "2"
}
```

### レスポンス例

```json
{
  "revision": "2"
}
```

---

## 6.5 リマインダー通知の取得

**GET** `/k/v1/app/notifications/reminder.json`

リマインダー通知設定を取得する。動作テスト環境用は `/k/v1/preview/app/notifications/reminder.json`。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| app | 数値または文字列 | 必須 | アプリID |
| lang | 文字列 | 任意 | 取得する名前の言語（ja, en, zh, user, default） |

### レスポンス

| プロパティ | 型 | 説明 |
|-----------|------|------|
| notifications | 配列 | リマインダー通知設定の配列 |
| notifications[].timing | オブジェクト | 通知タイミング |
| notifications[].timing.code | 文字列 | 基準日時のフィールドコード |
| notifications[].timing.daysLater | 文字列 | 基準日時からの日数（負の値は前） |
| notifications[].timing.hoursLater | 文字列 | 基準日時からの時間数 |
| notifications[].timing.time | 文字列 | 通知時刻（日付フィールドや絶対時刻指定用） |
| notifications[].filterCond | 文字列 | リマインダー条件（クエリ形式） |
| notifications[].title | 文字列 | 通知メッセージ |
| notifications[].targets | 配列 | 通知先リスト |
| notifications[].targets[].entity | オブジェクト | 通知先詳細 |
| notifications[].targets[].entity.type | 文字列 | USER, GROUP, ORGANIZATION, FIELD_ENTITY |
| notifications[].targets[].entity.code | 文字列 | 対象コード |
| notifications[].targets[].includeSubs | 真偽値 | 下位組織への継承 |
| timezone | 文字列 | リマインダーのタイムゾーン（未設定時は null） |
| revision | 文字列 | 設定のリビジョン番号 |

### 必要な権限

アプリ管理権限

### リクエスト例

```
GET /k/v1/app/notifications/reminder.json?app=1&lang=ja
X-Cybozu-API-Token: API_TOKEN
```

### レスポンス例

```json
{
  "notifications": [
    {
      "timing": {
        "code": "作成日時",
        "daysLater": "1",
        "hoursLater": "2"
      },
      "filterCond": "ユーザー選択_0 in (\"user1\")",
      "title": "リマインドです",
      "targets": [
        {
          "entity": { "type": "USER", "code": "user1" },
          "includeSubs": false
        }
      ]
    }
  ],
  "timezone": "Asia/Tokyo",
  "revision": "2"
}
```

---

## 6.6 リマインダー通知の変更

**PUT** `/k/v1/preview/app/notifications/reminder.json`

動作テスト環境のリマインダー通知設定を変更する。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| app | 数値/文字列 | 必須 | アプリID |
| notifications | 配列 | 任意 | リマインダー設定（省略で既存維持、空配列で全削除） |
| notifications[].timing | オブジェクト | 条件付き | 通知タイミング（notifications 指定時に必須） |
| notifications[].timing.code | 文字列 | 条件付き | 基準日時のフィールドコード |
| notifications[].timing.daysLater | 数値/文字列 | 条件付き | 基準日からの日数（-10,000〜10,000） |
| notifications[].timing.hoursLater | 数値/文字列 | 条件付き | 基準日からの時間数（hoursLater または time のいずれか必須） |
| notifications[].timing.time | 文字列 | 条件付き | 通知時刻（HH:mm、10分刻み。hoursLater または time のいずれか必須） |
| notifications[].filterCond | 文字列 | 任意 | 条件（クエリ形式。order by/limit/offset は使用不可） |
| notifications[].title | 文字列 | 任意 | 通知メッセージ（最大100文字） |
| notifications[].targets | 配列 | 条件付き | 通知先（notifications 指定時に必須） |
| notifications[].targets[].entity | オブジェクト | 条件付き | 通知先詳細 |
| notifications[].targets[].entity.type | 文字列 | 条件付き | USER, GROUP, ORGANIZATION, FIELD_ENTITY |
| notifications[].targets[].entity.code | 文字列 | 条件付き | 対象コード |
| notifications[].targets[].includeSubs | 真偽値/文字列 | 任意 | 下位組織への継承（デフォルト: false） |
| timezone | 文字列 | 任意 | タイムゾ��ン |
| revision | 数値/文字列 | 任意 | 期待するリビジョン番号 |

### レスポンス

| プロパティ | 型 | 説明 |
|-----------|------|------|
| revision | 文字列 | 更新後のリビジョン番号 |

### 必要な権限

アプリ管理権限

### 制限事項

- ゲストスペースでは ORGANIZATION タイプは使用不可
- フィルター条件に order by, limit, offset は使用不可

### リクエスト例

```json
// PUT /k/v1/preview/app/notifications/reminder.json
{
  "app": 1,
  "notifications": [
    {
      "timing": {
        "code": "作成日時",
        "daysLater": "1",
        "hoursLater": "2"
      },
      "filterCond": "ユーザー選択フィールド in (\"user1\")",
      "title": "リマインドです",
      "targets": [
        {
          "entity": { "type": "USER", "code": "user1" },
          "includeSubs": false
        }
      ]
    }
  ],
  "timezone": "Asia/Tokyo",
  "revision": "2"
}
```

### レスポンス例

```json
{
  "revision": "2"
}
```

---
