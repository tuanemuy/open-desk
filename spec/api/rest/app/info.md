# アプリ情報

## preview API とデプロイの関係性

OpenDesk のアプリ設定変更系 API は「動作テスト環境（preview）」と「運用環境（production）」の 2 段階構成になっている。

## 基本フロー

```
STEP 1: アプリを動作テスト環境に作成（新規の場合）
  POST /k/v1/preview/app.json

STEP 2: 動作テスト環境で各種設定を変更
  - フィールド追加/変更/削除
  - レイアウト変更
  - 一覧設定変更
  - グラフ設定���更
  - 一般設定変更
  - プロセス管理設定変更
  - 通知設定変更
  - アクセス権変更
  - カスタマイズ設定変更
  - アクション設定変更
  - プラグイン追加
  - 管理者メモ変更

STEP 3: 運用環境へデプロイ
  POST /k/v1/preview/app/deploy.json
```

## URL パターン

| 用途 | URL パターン |
|------|-------------|
| 運用環境からの取得 | `/k/v1/{endpoint}.json` |
| 動作テスト環境からの取得 | `/k/v1/preview/{endpoint}.json` |
| 動作テスト環境への変更 | `/k/v1/preview/{endpoint}.json` |
| ゲストスペース | `/k/guest/{SPACE_ID}/v1/{endpoint}.json` |

設定変更系 API（POST/PUT/DELETE）は原則として動作テスト環境のみを操作する。変更を運用環境に反映するには、デプロイ API を実行する必要がある。既存アプリの設定変更の場合、STEP 1 はスキップし STEP 2 から開始する。

---

## 1.1 アプリの取得

**GET** `/k/v1/app.json`

1 件のアプリの情報を取得する。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| id | 数値または文字列 | 必須 | アプリID |

### レスポンス

| プロパティ | 型 | 説明 |
|-----------|------|------|
| appId | 文字列 | アプリID |
| code | 文字列 | アプリコード（未設定時は空文字列） |
| name | 文字列 | アプリ名（ユーザーの言語設定に依存） |
| description | 文字列 | アプリの説明 |
| spaceId | 文字列 | スペースID（スペースに所属しない場合は null） |
| threadId | 文字列 | スレッドID（スペースに所属しない場合は null） |
| createdAt | 文字列 | 作成日時 |
| creator.code | 文字列 | 作成者のユーザーコード |
| creator.name | 文字列 | 作成者の表示名 |
| modifiedAt | 文字列 | 更新日時 |
| modifier.code | 文字列 | 更新者のユーザーコード |
| modifier.name | 文字列 | 更新者の表示名 |

### 必要な権限

レコード閲覧権限またはレコード追加権限

### 制限事項

- 運用環境に公開されているアプリのみ取得可能

### リクエスト例

```
GET /k/v1/app.json?id=1
X-Cybozu-API-Token: API_TOKEN
```

### レスポンス例

```json
{
  "appId": "1",
  "code": "",
  "name": "案件管理",
  "description": "案件ごとに、受注の確度や金額はもちろん、活動の履歴も記録できるアプリです。",
  "spaceId": "2",
  "threadId": "3",
  "createdAt": "2021-10-01T05:14:05.000Z",
  "creator": { "code": "tanaka", "name": "田中太郎" },
  "modifiedAt": "2021-10-02T05:22:05.000Z",
  "modifier": { "code": "tanaka", "name": "田中太郎" }
}
```

---

## 1.2 複数アプリの取得

**GET** `/k/v1/apps.json`

複数のアプリの情報を一括取得する。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| ids | 配列（数値/文字列） | 任意 | アプリID一覧（最大100件） |
| codes | 配列（文字列） | 任意 | アプリコード一覧（最大100件、完全一致、大文字小文字区別） |
| name | 文字列 | 任意 | アプリ名（部分一致、大文字小文字区別なし、最大64文字） |
| spaceIds | 配列（数値/文字列） | 任意 | スペースID一覧（最大100件） |
| offset | 数値または文字列 | 任意 | スキップするレコード数（デフォルト: 0） |
| limit | 数値または文字列 | 任意 | 取得件数（1-100、デフォルト: 100） |

### レスポンス

| プロパティ | 型 | 説明 |
|-----------|------|------|
| apps | 配列 | アプリ情報オブジェクトの配列 |
| apps[].appId | 文字列 | アプリID |
| apps[].code | 文字列 | アプリコード（未設定時は空文字列） |
| apps[].name | 文字列 | アプリ名 |
| apps[].description | 文字列 | アプリの説明 |
| apps[].spaceId | 文字列 | スペースID（null の場合あり） |
| apps[].threadId | 文字列 | スレッドID（null の場合あり） |
| apps[].createdAt | 文字列 | 作成日時 |
| apps[].creator.code | 文字列 | 作成者のユーザーコード |
| apps[].creator.name | 文字列 | 作成者の表示名 |
| apps[].modifiedAt | 文字列 | 更新日時 |
| apps[].modifier.code | 文字列 | 更新者のユーザーコード |
| apps[].modifier.name | 文字列 | 更新者の表示名 |

### 必要な権限

レコード閲覧権限またはレコード追加権限

### 制限事項

- 1 回のリクエストで最大 100 件まで取得可能
- 運用環境に公開されているアプリのみ取得可能

### リクエスト例

```
GET /k/v1/apps.json?name=TEST&codes[0]=FOO&codes[1]=BAR
X-Cybozu-Authorization: QWRtaW5pc3RyYXRvcjpjeWJvenU=
```

### レスポンス例

```json
{
  "apps": [
    {
      "appId": "1",
      "code": "FOO",
      "name": "案件管理",
      "description": "案件ごとに、受注の確度や金額はもちろん、活動の履歴も記録できるアプリです。",
      "spaceId": "2",
      "threadId": "3",
      "createdAt": "2021-10-01T05:14:05.000Z",
      "creator": { "code": "tanaka", "name": "田中太郎" },
      "modifiedAt": "2021-10-02T05:22:05.000Z",
      "modifier": { "code": "tanaka", "name": "田中太郎" }
    }
  ]
}
```

---

## 1.3 アプリの作成

**POST** `/k/v1/preview/app.json`

動作テスト環境にアプリを作成する。運用環境に反映するにはデプロイ API を実行する必要がある。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| name | 文字列 | 必須 | アプリ名（最大64文字） |
| space | 数値 | 任意 | スペースID |
| thread | 数値 | 任意 | スレッドID |

### レスポンス

| プロパティ | 型 | 説明 |
|-----------|------|------|
| app | 文字列 | 作成されたアプリのID |
| revision | 文字列 | アプリのリビジョン番号 |

### 必要な権限

アプリ作成権限

### 制限事項

- API トークン認証は使用不可（パスワード認証、セッション認証、OAuth のみ）
- この API の呼び出しは API リクエスト数にカウントされない
- システムフィールド（レコード番号、作成者、更新者、作成日時、更新日時、ステータス、作業者、カテゴリー）はユーザーの表示言語設定に基づいて作成される
- 運用環境に反映するにはデプロイ API を実行する必要がある

### リクエスト例

```json
// POST /k/v1/preview/app.json
{
  "name": "案件管理",
  "space": 10,
  "thread": 11
}
```

### レスポンス例

```json
{
  "app": "23",
  "revision": "1"
}
```

---

## 1.4 アプリの使用状況取得

**GET** `/k/v1/apps/statistics.json`

アプリの使用状況を取得する。ワイドコース限定の API。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| offset | 数値または文字列 | 任意 | スキップする件数（デフォルト: 0） |
| limit | 数値または文字列 | 任意 | 取得件数（1-100、デフォルト: 100） |

### レスポンス

| プロパティ | 型 | 説明 |
|-----------|------|------|
| apps | 配列 | アプリ情報の配列 |
| apps[].id | 文字列 | アプリID |
| apps[].name | 文字列 | アプリ名 |
| apps[].space | オブジェクト | スペース情報（スペースに所属しない場合は null） |
| apps[].space.id | 文字列 | スペースID |
| apps[].space.name | 文字列 | スペース名 |
| apps[].appGroup | 文字列 | アプリグループの分類 |
| apps[].status | 文字列 | アプリの状態: `CHANGED`（変更あり）, `NOT_ACTIVATED`（未有効化）, `ACTIVATED`（有効） |
| apps[].recordUpdatedAt | 文字列 | レコードの最終更新日時 |
| apps[].recordCount | 文字列 | レコード数 |
| apps[].fieldCount | 文字列 | フィールド数 |
| apps[].dailyRequestCount | 文字列 | 1日あたりの API リクエスト数 |
| apps[].apiTokenCount | 文字列 | 設定された API トークン数 |
| apps[].webhookCount | 文字列 | 設定された Webhook 数 |
| apps[].storageUsage | 文字列 | 添付ファイルのストレージ使用量（バイト） |
| apps[].customized | 真偽値 | JS/CSSカスタマイズ、プラグイン、カスタムビューの有無 |
| apps[].creator.code | 文字列 | 作成者のログイン名 |
| apps[].creator.name | 文字列 | 作成者の表示名 |
| apps[].createdAt | 文字列 | 作成日時 |
| apps[].modifier.code | 文字列 | 更新者のログイン名 |
| apps[].modifier.name | 文字列 | 更新者の表示名 |
| apps[].modifiedAt | 文字列 | 更新日時 |

### 必要な権限

アプリ管理権限

### 制限事項

- 1 回のリクエストで最大 100 件まで取得可能
- パスワード認証またはセッション認証のみ対応
- ワイドコース限定

### リクエスト例

```
GET /k/v1/apps/statistics.json?offset=0&limit=10
X-Cybozu-Authorization: QWRtaW5pc3RyYXRvcjpjeWJvenU=
```

### レスポンス例

```json
{
  "apps": [
    {
      "id": "1",
      "name": "案件管理",
      "space": { "id": "1", "name": "営業管理" },
      "appGroup": "Public",
      "status": "ACTIVATED",
      "recordUpdatedAt": "2023-12-04T05:45:36.000Z",
      "recordCount": "100",
      "fieldCount": "10",
      "dailyRequestCount": "1",
      "apiTokenCount": "1",
      "webhookCount": "1",
      "storageUsage": "47000000",
      "customized": true,
      "creator": { "code": "tanaka", "name": "tanaka" },
      "createdAt": "2023-12-04T05:45:36.000Z",
      "modifier": { "code": "tanaka", "name": "tanaka" },
      "modifiedAt": "2023-12-04T05:45:36.000Z"
    }
  ]
}
```

---

## 1.5 管理者メモの取得

**GET** `/k/v1/app/adminNotes.json`

アプ��の管理者用メモを取得する。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| app | 数値または文字列 | 必須 | アプリID |

### レスポンス

| プロパティ | 型 | 説明 |
|-----------|------|------|
| content | 文字列 | 管理者メモの内容（未設定時は空文字列） |
| includeInTemplateAndDuplicates | 真偽値 | テンプレートや複製にメモを含めるかどうか |
| revision | 文字列 | アプリ設定のリビジョン番号 |

### 必要な権限

アプリ管理権限

### 制限事項

- パスワード認証、API トークン認証、セッション認証に対応

### リクエスト例

```
GET /k/v1/app/adminNotes.json?app=1
X-Cybozu-API-Token: API_TOKEN
```

### レスポンス例

```json
{
  "content": "<div>アプリの管���者用メモ</div>",
  "includeInTemplateAndDuplicates": true,
  "revision": "2"
}
```

---

## 1.6 管理者メモの変更

**PUT** `/k/v1/preview/app/adminNotes.json`

アプリの管理者用メモを変更する。動作テスト環境への変更となる。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| app | 数値または文字列 | 必須 | アプリID |
| content | 文字列 | 任意 | メモの内容（0〜10,000文字、省略時は変更なし） |
| includeInTemplateAndDuplicates | 真偽値または文字列 | 任意 | テンプレートや複製にメモを含めるかどうか（省略時は変更なし） |
| revision | 数値または文字列 | 任意 | 期待するリビジョン番号（-1 または省略でスキップ） |

### レスポンス

| プロパティ | 型 | 説明 |
|-----------|------|------|
| revision | 文字列 | 更新後のリビジョン番号 |

### 必要な権限

アプリ管理権限

### リクエスト例

```json
// PUT /k/v1/preview/app/adminNotes.json
{
  "app": 1,
  "content": "<div>管理��用メモ</div>",
  "includeInTemplateAndDuplicates": false,
  "revision": 2
}
```

### レスポンス例

```json
{
  "revision": "2"
}
```

---
