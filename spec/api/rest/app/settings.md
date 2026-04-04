# アプリ設定

## 5.1 一般設定の取得

**GET** `/k/v1/app/settings.json`

アプリの一般設定を取得する。動作テスト環境用は `/k/v1/preview/app/settings.json`。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| app | 数値または文字列 | 必須 | アプリID |
| lang | 文字列 | 任意 | 取得する名前の言語（ja, en, zh, user, default） |

### レスポンス

| プロパティ | 型 | 説明 |
|-----------|------|------|
| name | 文字列 | アプリ名 |
| description | 文字列 | アプリの説明（HTML 形式） |
| icon.type | 文字列 | アイコン種別: PRESET（組み込み）, FILE（アップロード画像） |
| icon.key | 文字列 | アイコン識別子（PRESET のみ） |
| icon.file | オブジェクト | ファイル情報（FILE のみ） |
| theme | 文字列 | デザインテーマ: WHITE, RED, GREEN, BLUE, YELLOW, BLACK |
| titleField.selectionMode | 文字列 | タイトルフィールド選択方式: AUTO, MANUAL |
| titleField.code | 文字列 | タイトルフィールドのフィールドコード |
| enableThumbnails | 真偽値 | サムネイル表示の有効化 |
| enableBulkDeletion | 真偽値 | 一括削除の有効化 |
| enableComments | 真偽値 | コメント機能の有効化 |
| enableDuplicateRecord | 真偽値 | レコード複製の有効化 |
| enableInlineRecordEditing | 真偽値 | 一覧でのインライン編集の有効化 |
| numberPrecision.digits | 文字列 | 総桁数（1-30） |
| numberPrecision.decimalPlaces | 文字列 | 小数点以下桁数（0-10） |
| numberPrecision.roundingMode | 文字列 | 丸めモード: HALF_EVEN, UP, DOWN |
| firstMonthOfFiscalYear | 文字列 | 年度開始月（1-12） |
| revision | 文字列 | 設定のリビジョン番号 |

### 必要な権限

- 運用環境: レコード閲覧権限またはレコード追加権限
- 動作テスト環境: アプリ管理権限

### リクエスト例

```
GET /k/v1/app/settings.json?app=8&lang=ja
X-Cybozu-API-Token: API_TOKEN
```

### レスポンス例

```json
{
  "name": "案件管理",
  "description": "営業部の案件管理に使用します。",
  "icon": { "type": "PRESET", "key": "APP60" },
  "theme": "WHITE",
  "titleField": { "selectionMode": "MANUAL", "code": "文字列1行_0" },
  "enableThumbnails": true,
  "enableBulkDeletion": false,
  "enableComments": true,
  "enableDuplicateRecord": true,
  "enableInlineRecordEditing": true,
  "numberPrecision": {
    "digits": "16",
    "decimalPlaces": "4",
    "roundingMode": "HALF_EVEN"
  },
  "firstMonthOfFiscalYear": "4",
  "revision": "24"
}
```

---

## 5.2 一般設定の変更

**PUT** `/k/v1/preview/app/settings.json`

動作テスト環境のアプリの一般設定を変更する。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| app | 数値/文字列 | 必須 | アプリID |
| name | 文字列 | 任意 | アプリ名（1-64文字） |
| description | 文字列 | 任意 | アプリの説明（最大10,000文字、HTML タグ対応） |
| icon.type | 文字列 | 条件付き | アイコン種別: PRESET, FILE |
| icon.key | 文字列 | 条件付き | アイコン識別子（type=PRESET 時に必須） |
| icon.file.fileKey | 文字列 | 条件付き | アップロードファイルキー（type=FILE 時に必須、最大800KB） |
| theme | 文字列 | 任意 | デザインテーマ |
| titleField.selectionMode | 文字列 | 条件付き | AUTO, MANUAL |
| titleField.code | 文字列 | 条件付き | フィールドコード（MANUAL 時に必須） |
| enableThumbnails | 真偽値/文字列 | 任意 | サムネイル表示 |
| enableBulkDeletion | 真偽値/文字列 | 任意 | 一括削除 |
| enableComments | 真偽値/文字列 | 任意 | コメント機能 |
| enableDuplicateRecord | 真偽値/文字列 | 任意 | レコード複製 |
| enableInlineRecordEditing | 真偽値/文字列 | 任意 | インライン編集 |
| numberPrecision.digits | 真偽値/文字列 | 任意 | 総桁数（1-30） |
| numberPrecision.decimalPlaces | 真偽値/文字列 | 任意 | 小数点以下桁数（0-10） |
| numberPrecision.roundingMode | 文字列 | 任意 | 丸めモード |
| firstMonthOfFiscalYear | 真偽値/文字列 | 任意 | 年度開始月（1-12） |
| revision | 数値/文字列 | 任意 | 期待するリビジョン番号 |

### レスポンス

| プロパティ | 型 | 説明 |
|-----------|------|------|
| revision | 文字列 | 更新後のリビジョン番号 |

### 必要な権限

アプリ管理権限

### 制限事項

- 省略されたパラメータは既存の値を維持

### リクエスト例

```json
// PUT /k/v1/preview/app/settings.json
{
  "app": 21,
  "name": "案件管理",
  "description": "案件の管理に使用するアプリです。",
  "icon": { "type": "PRESET", "key": "APP72" },
  "theme": "WHITE"
}
```

### レスポンス例

```json
{
  "revision": "2"
}
```

---

## 5.3 プロセス管理設定の取得

**GET** `/k/v1/app/status.json`

アプリのプロセス管理設定を取得する。動作テスト環境用は `/k/v1/preview/app/status.json`。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| app | 数値または文字列 | 必須 | アプリID |
| lang | 文字列 | 任意 | 取得する名前の言語（ja, en, zh, user, default） |

### レスポンス

| プロパティ | 型 | 説明 |
|-----------|------|------|
| enable | 真偽値 | プロセス管理の有効状態 |
| states | オブジェクト | ステータス情報（未設定時は null） |
| states.{status}.name | 文字列 | ステータス名 |
| states.{status}.index | 文字列 | ステータスの順序（0始まり） |
| states.{status}.assignee.type | 文字列 | 作業者タイプ: ONE, ALL, ANY |
| states.{status}.assignee.entities | 配列 | 作業者リスト |
| states.{status}.assignee.entities[].entity.type | 文字列 | エンティティタイプ: USER, GROUP, ORGANIZATION, FIELD_ENTITY, CREATOR, CUSTOM_FIELD |
| states.{status}.assignee.entities[].entity.code | 文字列 | エンティティコード |
| states.{status}.assignee.entities[].includeSubs | 真偽値 | 下位組織への継承 |
| actions | 配列 | アクション情報リスト（未設定時は null） |
| actions[].name | 文字列 | アクション名 |
| actions[].from | 文字列 | 実行前のステータス |
| actions[].to | 文字列 | 実行後のステータス |
| actions[].filterCond | 文字列 | 実行条件 |
| actions[].type | 文字列 | アクションタイプ: PRIMARY, SECONDARY |
| actions[].executableUser | オブジェクト | 実行可能ユーザー（SECONDARY のみ） |
| revision | 文字列 | 設定のリビジョン番号 |

### 必要な権限

- 運用環境: レコード閲覧権限またはレコード追加権限
- 動作テスト環境: アプリ管理権限

### リクエスト例

```
GET /k/v1/app/status.json?app=1&lang=ja
X-Cybozu-API-Token: API_TOKEN
```

### レスポンス例

```json
{
  "enable": true,
  "states": {
    "未処理": {
      "name": "未処理",
      "index": "0",
      "assignee": { "type": "ONE", "entities": [] }
    }
  },
  "actions": [],
  "revision": "3"
}
```

---

## 5.4 プロセス管理設定の変更

**PUT** `/k/v1/preview/app/status.json`

動作テスト環境のアプリのプロセス管理設定を変更する。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| app | 数値/文字列 | 必須 | アプリID |
| enable | 真偽値/文字列 | ���意 | プロセス管理の有効/無効 |
| states | オブジェクト | 任意 | ステータス設定 |
| states.{statusName}.name | 文字列 | 条件付き | ステータス名（最大64文字） |
| states.{statusName}.index | 数値/文字列 | 条件付き | ステータスの順序（0以上） |
| states.{statusName}.assignee.type | ���字列 | 条件付き | 作業者タイプ: ONE, ALL, ANY |
| states.{statusName}.assignee.entities | 配列 | 条件付き | 作業者情報リスト |
| states.{statusName}.assignee.entities[].entity.type | 文字列 | 条件付き | USER, GROUP, ORGANIZATION, FIELD_ENTITY, CREATOR, CUSTOM_FIELD |
| states.{statusName}.assignee.entities[].entity.code | 文字列 | 条件付き | ログイン名、グループコード、組織コード、フィールドコード |
| states.{statusName}.assignee.entities[].includeSubs | 真偽値/文字列 | 任意 | 下位組織への継承 |
| actions | 配列 | 任意 | アクション設定 |
| actions[].name | 文字列 | 条件付き | アクション名（最大64文字） |
| actions[].from | 文字列 | 条件付き | 遷移元ステータス名 |
| actions[].to | 文字列 | 条件付き | 遷移先ステータス名 |
| actions[].filterCond | 文字列 | 任意 | 実行条件（クエリ形式） |
| actions[].type | 文字列 | 任意 | PRIMARY（デフォルト）, SECONDARY |
| actions[].executableUser | オブジェクト | 条件付き | SECONDARY で必須 |
| revision | 数値/文字列 | 任意 | 期待するリビジョン番号 |

### レスポンス

| プロパティ | 型 | 説明 |
|-----------|------|------|
| revision | 文字列 | 更新後のリビジョン番号 |

### 必要な権限

アプリ管理権限

### 制限事項

- PRIMARY アクションは指定された作業者が実行。作業者未指定の場合、レコード閲覧権限を持つ全ユーザーが実行可能
- SECONDARY アクションは明示的に実行可能ユーザーの指定が必要
- FIELD_ENTITY には特定のフィールドタイプのみ使用可能（作成者、更新者、ユーザー選択、組織選択、グループ選択）
- ステータスフィールドはアクションのフィルター条件に使用不可
- ゲストスペースアプリでは ORGANIZATION タイプの指定不可

### リクエスト例

```json
// PUT /k/v1/preview/app/status.json
{
  "app": "5",
  "enable": true,
  "states": {
    "未処理": {
      "name": "未処理",
      "index": "0",
      "assignee": { "type": "ONE", "entities": [] }
    },
    "処理中": {
      "name": "処理中",
      "index": "1",
      "assignee": {
        "type": "ALL",
        "entities": [
          { "entity": { "type": "USER", "code": "user1" } },
          { "entity": { "type": "FIELD_ENTITY", "code": "creator" }, "includeSubs": false }
        ]
      }
    }
  },
  "actions": [
    { "name": "処理開始", "from": "未処理", "to": "処理中", "type": "PRIMARY" }
  ],
  "revision": "3"
}
```

### レスポンス例

```json
{
  "revision": "3"
}
```

---

## 5.5 アプリのデプロイ（運用環境への反映）

**POST** `/k/v1/preview/app/deploy.json`

動作テスト環境のアプリ設定を運用環境に反映する。OpenDesk のアプリ設定画面で「アプリを更新」をクリックすることに相当する。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| apps | 配列 | 必須 | アプリ一覧（最大300件） |
| apps[].app | 数値/文字列 | 必須 | アプリID |
| apps[].revision | 数値/文字列 | 任意 | 期待するリビジョン番号 |
| revert | 真偽値/文字列 | 任意 | 変更を取り消すかどうか（true で取り消し、false でデプロイ。デフォルト: false） |

### レスポンス

レスポンスボディなし。

### 必要な権限

アプリ管理権限

### 制限事項

- 非同期 API のため、デプロイ状況確認 API を使って進捗を監視する
- 最大 300 アプリまで一括処理可能
- いずれか 1 つのアプリでもデプロイに失敗すると、全アプリがロールバックされる
- デプロイ実行中は設定変更 API を実行できない
- 権限変更の反映は完了後段階的に行われる

### リクエスト例

```json
// POST /k/v1/preview/app/deploy.json
{
  "apps": [
    { "app": 1, "revision": 57 },
    { "app": 1001, "revision": 22 }
  ],
  "revert": false
}
```

---

## 5.6 デプロイ状況の確認

**GET** `/k/v1/preview/app/deploy.json`

アプリ設定のデプロイ状況を確認する。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| apps | 配列（数値/文字列） | 必須 | アプリIDリスト（最大300件） |

### レスポンス

| プロパティ | 型 | 説明 |
|-----------|------|------|
| apps | 配列 | ステータスオブジェクトの配列 |
| apps[].app | 文字列 | アプリID |
| apps[].status | 文字列 | 進捗状態: `PROCESSING`（処理中）, `SUCCESS`（完了）, `FAIL`（失敗）, `CANCEL`（他のアプリの失敗によりキャンセル） |

### 必要な権限

アプリ管理権限

### リクエスト例

```
GET /k/v1/preview/app/deploy.json?apps[0]=8&apps[1]=9&apps[2]=10
X-Cybozu-API-Token: API_TOKEN
```

### レスポンス例

```json
{
  "apps": [
    { "app": "8", "status": "SUCCESS" },
    { "app": "9", "status": "PROCESSING" },
    { "app": "10", "status": "PROCESSING" }
  ]
}
```

---

## 5.7 プラグイン一覧の取得

**GET** `/k/v1/app/plugins.json`

アプリに追加されているプラグインの一覧を取得する。動作テスト環境用は `/k/v1/preview/app/plugins.json`。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| app | 数値または文字列 | 必須 | アプリID |
| lang | 文字列 | 任意 | プラグイン名のロケール（ja, en, zh, es） |

### レスポンス

| プロパティ | 型 | 説明 |
|-----------|------|------|
| plugins | 配列 | プラグイン情報の配列 |
| plugins[].id | 文字列 | プラグインID |
| plugins[].name | 文字列 | プラグイン名 |
| plugins[].enabled | 真偽値 | プラグインの有効状態 |
| revision | 文字列 | アプリ設定のリビジョン番号 |

### 必要な権限

アプリ管理権限

### リクエスト例

```
GET /k/v1/app/plugins.json?app=1&lang=ja
X-Cybozu-API-Token: API_TOKEN
```

### レスポンス例

```json
{
  "plugins": [
    {
      "id": "djmhffjhfgmebgnmcggopedaofckljlj",
      "name": "Plugin Name",
      "enabled": true
    }
  ],
  "revision": "2"
}
```

---

## 5.8 プラグインの追加

**POST** `/k/v1/preview/app/plugins.json`

動作テスト環境のアプリにプラグインを追加する。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| app | 数値または文字列 | 必須 | アプリID |
| ids | 文字列配列 | 必須 | 追加するプラグインIDの配列（OpenDesk システム管理で読み込んだプラグイン） |
| revision | 数値または文字列 | 任意 | 期待するリビジョン番号 |

### レスポンス

| プロパティ | 型 | 説明 |
|-----------|------|------|
| revision | 文字列 | 更新後のリビジョン番号 |

### 必要な権限

アプリ管理権限

### 制限事項

- 利用を許可していないプラグインでもこの API でアプリに追加できる

### リクエスト例

```json
// POST /k/v1/preview/app/plugins.json
{
  "app": 2,
  "ids": ["djmhffjhfgmebgnmcggopedaofckljlj"]
}
```

### レスポンス例

```json
{
  "revision": "2"
}
```

---

## 5.9 JavaScript/CSS カスタマイズ設定の取得

**GET** `/k/v1/app/customize.json`

アプリの JavaScript/CSS カスタマイズ設定を取得する。動作テスト環境用は `/k/v1/preview/app/customize.json`。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| app | 数値または文字列 | 必須 | アプリID |

### レスポンス

| プロパティ | 型 | 説明 |
|-----------|------|------|
| scope | 文字列 | カスタマイズの適用範囲: ALL（全ユーザー）, ADMIN（管理者のみ）, NONE（適用しない） |
| desktop | オブジェクト | PC 環境のファイル情報 |
| desktop.js | 配列 | JavaScript ファイル |
| desktop.css | 配列 | CSS フ���イル |
| mobile | オブジェクト | モバイル環境のファイル情報 |
| mobile.js | 配列 | JavaScript ファイル |
| mobile.css | 配列 | CSS ファイル |
| {env}.{type}[].type | 文字列 | ファイル種別: URL（外部URL）, FILE（アップロードファイル） |
| {env}.{type}[].url | 文字列 | ファイルURL（URL タイプ時） |
| {env}.{type}[].file | オブジェクト | ファイル情報（FILE タイプ時） |
| {env}.{type}[].file.contentType | 文字列 | MIME タイプ |
| {env}.{type}[].file.fileKey | 文字列 | ファイルキー |
| {env}.{type}[].file.name | 文字列 | ファイル名 |
| {env}.{type}[].file.size | 文字列 | ファイルサイズ（バイト） |
| revision | 文字列 | アプリ設定のリビジョン番号 |

### 必要な権限

アプリ管理権限

### 制限事項

- API トークン認証は使用不可（パスワード認証、セッション認証、OAuth のみ）

### リクエスト例

```
GET /k/v1/app/customize.json?app=8
X-Cybozu-Authorization: QWRtaW5pc3RyYXRvcjpjeWJvenU=
```

### レスポンス例

```json
{
  "scope": "ALL",
  "desktop": {
    "js": [
      { "type": "URL", "url": "https://sample.com/example.js" },
      {
        "type": "FILE",
        "file": {
          "contentType": "application/javascript",
          "fileKey": "20150519023802B3EB762E870645F889B22F9D4F1F3059023",
          "name": "sample.js",
          "size": "12345"
        }
      }
    ],
    "css": []
  },
  "mobile": {
    "js": [],
    "css": []
  },
  "revision": "15"
}
```

---

## 5.10 JavaScript/CSS カスタマイズ設定の変更

**PUT** `/k/v1/preview/app/customize.json`

動作テスト環境のアプリの JavaScript/CSS カスタマイズ設定を変更する。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| app | 数値/文字列 | 必須 | アプリID |
| scope | 文字列 | 任意 | 適用範囲: ALL, ADMIN, NONE |
| desktop | オブジェクト | 任意 | PC 環境のファイル設定 |
| desktop.js | 配列 | 任意 | JavaScript ファイル（CSS と合わせて最大30件） |
| desktop.js[].type | 文字列 | 任意 | URL または FILE |
| desktop.js[].url | 文字列 | 任意 | ファイルURL（type=URL 時に必須） |
| desktop.js[].file.fileKey | 文字列 | 任意 | ファイルキー（type=FILE 時に必須） |
| desktop.css | 配列 | 任意 | CSS ファイル |
| mobile | オブジェクト | 任意 | モバイル環境のファイル設定 |
| mobile.js | 配列 | 任意 | JavaScript ファイル（CSS と合わせて最大30件） |
| mobile.css | 配列 | 任意 | CSS ファイル |
| revision | 数値/文字列 | 任意 | 期待するリビジョン番号 |

### レスポンス

| プロパティ | 型 | 説明 |
|-----------|------|------|
| revision | 文字列 | 更新後のリビジョン番号 |

### 必要な権限

OpenDesk システム管理権限 + アプリ管理権限

### 制限事項

- API トークン認証は使用不可
- 環境ごとに JS + CSS 合計で最大 30 ファイル

### リクエスト例

```json
// PUT /k/v1/preview/app/customize.json
{
  "app": 21,
  "scope": "ALL",
  "desktop": {
    "js": [
      { "type": "URL", "url": "https://www.example.com/example.js" },
      { "type": "FILE", "file": { "fileKey": "ddfc8e89-7aa3-4350-b9ab-3a75c9cf46b3" } }
    ],
    "css": []
  },
  "mobile": {
    "js": [],
    "css": []
  },
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

## 5.11 ���クション設定の取得

**GET** `/k/v1/app/actions.json`

アプリのアクション設定を取得する。動作テスト環境用は `/k/v1/preview/app/actions.json`。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| app | 数値または文字列 | 必須 | アプリID |
| lang | 文字列 | 任意 | 取得する名前の言語（ja, en, zh, user, default） |

### レスポンス

| プロパティ | 型 | 説明 |
|-----------|------|------|
| actions | オブジェクト | アクション設定（アクション名をキーとする） |
| actions.{actionName}.name | 文字列 | アクション名 |
| actions.{actionName}.id | 文字列 | アクションID |
| actions.{actionName}.index | 文字列 | 表示順（0始まり） |
| actions.{actionName}.destApp | オブジェクト/null | コピー先アプリ情報（権限がない場合は null） |
| actions.{actionName}.destApp.app | 文字列 | コピー先アプリID |
| actions.{actionName}.destApp.code | 文字列 | コピー先アプリコード |
| actions.{actionName}.mappings | 配列 | フィールドマッピング |
| actions.{actionName}.mappings[].srcType | 文字列 | コピー元種別: FIELD, RECORD_URL |
| actions.{actionName}.mappings[].srcField | 文字列 | コピー元フィールドコード（FIELD タイプのみ） |
| actions.{actionName}.mappings[].destField | 文字列 | コピー先フィールドコード |
| actions.{actionName}.entities | 配列 | 実行可能なユーザー/グループ/組織 |
| actions.{actionName}.entities[].type | 文字列 | エンティティタイプ: USER, GROUP, ORGANIZATION |
| actions.{actionName}.entities[].code | 文字列 | エンティティコード |
| actions.{actionName}.filterCond | 文字列 | 実行条件（クエリ形式） |
| revision | 文字列 | 設定のリビジョン番号 |

### 必要な権限

アプリ管理権限

### 制���事項

- 同名のアクションがある場合はエラー

### リクエスト例

```
GET /k/v1/app/actions.json?app=8&lang=ja
X-Cybozu-API-Token: API_TOKEN
```

### レスポンス例

```json
{
  "actions": {
    "アクションA": {
      "name": "アクションA",
      "id": "1",
      "index": "0",
      "destApp": { "app": "2", "code": "APPB" },
      "mappings": [
        { "srcType": "FIELD", "srcField": "数値_0", "destField": "数値_0" },
        { "srcType": "RECORD_URL", "destField": "リンク_0" }
      ],
      "entities": [{ "type": "USER", "code": "userA" }],
      "filterCond": ""
    }
  },
  "revision": "2"
}
```

---

## 5.12 アクション設定の変更

**PUT** `/k/v1/preview/app/actions.json`

動作テスト環境のアプリのアクション設定を変更する。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| app | 数値/文字列 | 必須 | アプリID |
| actions | オブジェクト | 必須 | アクション設定（省略されたアクションは削除される） |
| actions.{actionName}.name | 文字列 | 条件付き | アクション名（1-32文字、新規追加時に必須） |
| actions.{actionName}.index | 数値/文字列 | 条件付き | 表示順 |
| actions.{actionName}.destApp | オブジェクト | 条件付き | コピー先アプリ（新規追加時に必須） |
| actions.{actionName}.destApp.app | 数値/文字列 | 条件付き | コピー先アプリID（app または code のいずれか必須） |
| actions.{actionName}.destApp.code | 文字列 | 条件付き | コピー先アプリコード |
| actions.{actionName}.mappings | 配列 | 条件付き | フィールドマッピング（新規追加時またはコピー先変更時に必須） |
| actions.{actionName}.mappings[].srcType | 文字列 | 条件付き | FIELD, RECORD_URL |
| actions.{actionName}.mappings[].srcField | 文字列 | 条件付き | コピー元フィールドコード（srcType=FIELD 時に必須） |
| actions.{actionName}.mappings[].destField | 文字列 | 条件付き | コピー先フィールドコード |
| actions.{actionName}.entities | 配列 | 条件付き | 実行可能ユーザー（新規追加時に必須） |
| actions.{actionName}.entities[].type | 文字列 | 条件付き | USER, GROUP, ORGANIZATION |
| actions.{actionName}.entities[].code | 文字列 | 条件付き | エンティティコード |
| actions.{actionName}.filterCond | 文字列 | 任意 | 実行条件 |
| revision | 数値/文字列 | 任意 | 期待するリビジョン番号 |

### レスポンス

| プロパティ | 型 | 説明 |
|-----------|------|------|
| actions | オブジェクト | 更新後のアクション情報 |
| actions.{actionName}.id | 文字列 | アクシ��ンID |
| revision | 文字列 | 更新後のリビジョン番号 |

### 必要な権限

アプリ管理権限

### 制限事項

- 同名のアクションや既存名との競合でエラー

### リクエスト例

```json
// PUT /k/v1/preview/app/actions.json
{
  "app": "1",
  "actions": {
    "注文管理に登録": {
      "name": "注文管理に登録",
      "index": "0",
      "destApp": { "code": "INVOICE" },
      "mappings": [
        { "srcType": "FIELD", "srcField": "CompanyName", "destField": "CompanyName" },
        { "srcType": "RECORD_URL", "destField": "URL" }
      ],
      "entities": [{ "type": "USER", "code": "userA" }]
    }
  },
  "revision": "2"
}
```

### レスポンス例

```json
{
  "revision": "2",
  "actions": {
    "注文管理に登録": { "id": "7319" }
  }
}
```

---

## 5.13 アプリのスペース変更

**POST** `/k/v1/app/move.json`

アプリが所属するスペースを変更する。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| app | 数値または文字列 | 必須 | アプリID |
| space | 数値または文字列 | 任意 | 移動先のスペースID（省略または null でスペースから外す） |

### レスポンス

空のオブジェクト `{}` が返される。

### 制限事項

- ゲストスペースには非対応
- パスワード認証またはセッション認証のみ対応

### リクエスト例

```json
// POST /k/v1/app/move.json
{
  "app": 1,
  "space": 5
}
```

### レスポンス例

```json
{}
```

---
