# フォーム

## 2.1 フィールドの取得

**GET** `/k/v1/app/form/fields.json`

アプリのフォームフィールドの設定情報を取得する。動作テスト環境用は `/k/v1/preview/app/form/fields.json`。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| app | 数値または文字列 | 必須 | アプリID |
| lang | 文字列 | 任意 | 取得する名前の言語（ja, en, zh, user, default） |

### レスポンス

| プロパティ | 型 | 説明 |
|-----------|------|------|
| properties | オブジェクト | フィールドコードをキーとしたフィールド設定情報 |
| properties.{fieldCode}.type | 文字列 | フィールドタイプ（SINGLE_LINE_TEXT, NUMBER, DATE 等） |
| properties.{fieldCode}.code | 文字列 | フィールドコード |
| properties.{fieldCode}.label | 文字列 | フィールド名 |
| properties.{fieldCode}.noLabel | 真偽値 | フィールド名の非表示 |
| properties.{fieldCode}.required | 真偽値 | 必須入力 |
| properties.{fieldCode}.unique | 真偽値 | 値の重複禁止 |
| properties.{fieldCode}.maxValue / minValue | 文字列 | 数値の最大値/最小値 |
| properties.{fieldCode}.maxLength / minLength | 文字列 | 文字数の最大値/最小値 |
| properties.{fieldCode}.defaultValue | 文字列/配列 | 初期値 |
| properties.{fieldCode}.defaultNowValue | 真偽値 | 現在日時を初期値にするか |
| properties.{fieldCode}.options | オブ���ェクト | 選択肢フィールドの選択肢（label, index） |
| properties.{fieldCode}.align | 文字列 | 選択肢の表示方向（HORIZONTAL / VERTICAL） |
| properties.{fieldCode}.expression | 文字列 | 計算式 |
| properties.{fieldCode}.digit | 真偽値 | 桁区切り表示 |
| properties.{fieldCode}.protocol | 文字列 | リンクタイプ（WEB, CALL, MAIL） |
| properties.{fieldCode}.referenceTable | オブジェクト | 関連レコード一覧の設定 |
| properties.{fieldCode}.lookup | オブジェクト | ルックアップの設定 |
| properties.{fieldCode}.fields | オブジェクト | テーブル/グループ内のフィールド |
| properties.{fieldCode}.enabled | 真偽値 | 機能の有効状態 |
| revision | 文字列 | アプリ設定のリビジョン番号 |

### 必要な権限

- 運用環境: レコード閲覧権限またはレコード追加権限
- 動作テスト環境: アプリ管理権限

### リクエスト例

```
GET /k/v1/app/form/fields.json?app=8
X-Cybozu-API-Token: API_TOKEN
```

### レスポンス例

```json
{
  "properties": {
    "文字列1行": {
      "type": "SINGLE_LINE_TEXT",
      "code": "文字列1行",
      "label": "文字列 (1行)",
      "required": true
    }
  },
  "revision": "2"
}
```

---

## 2.2 フィールドの追加

**POST** `/k/v1/preview/app/form/fields.json`

動作テスト環境のアプリにフィールドを追加する。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| app | 数値または文字列 | 必須 | アプリID |
| properties | オブジェクト | 必須 | フィールド設定（フィールドコードをキーとする） |
| properties.{fieldCode}.type | 文字列 | 必須 | フィールドタイプ（SINGLE_LINE_TEXT, MULTI_LINE_TEXT, NUMBER, CALC, RADIO_BUTTON, CHECK_BOX, MULTI_SELECT, DROP_DOWN, DATE, TIME, DATETIME, FILE, LINK, USER_SELECT, ORGANIZATION_SELECT, GROUP_SELECT, REFERENCE_TABLE, RICH_TEXT, SUBTABLE, GROUP） |
| properties.{fieldCode}.code | 文字列 | 必須 | フィールドコード（親キーと一致させる） |
| properties.{fieldCode}.label | 文字列 | 必須 | フィールド名 |
| properties.{fieldCode}.noLabel | 真偽値/文字列 | 任意 | フィールド名非表示（デフォルト: false） |
| properties.{fieldCode}.required | 真偽値/文字列 | ��意 | 必須入力（デフォルト: false） |
| properties.{fieldCode}.unique | 真偽値/文字列 | 任意 | 値の重複禁止（デフォルト: false） |
| properties.{fieldCode}.maxValue / minValue | 数値/文字列 | 任意 | 数値の最大値/最小値 |
| properties.{fieldCode}.maxLength / minLength | 数値/文字列 | 任意 | 文字数の最大値/最小値 |
| properties.{fieldCode}.defaultValue | 文字列/配列 | 任意 | 初期値 |
| properties.{fieldCode}.defaultNowValue | 真偽値/文字列 | ���意 | 現在日時を初期値にするか（デフォルト: false） |
| properties.{fieldCode}.options | オブジェクト | 条件付き | 選択肢（ラジオボタン、チェックボックス、ドロップダウン、複数選択で必須） |
| properties.{fieldCode}.align | 文字列 | 任意 | 選択肢方向: HORIZONTAL / VERTICAL（デフォルト: HORIZONTAL） |
| properties.{fieldCode}.expression | 文字列 | 条件付き | 計算式（CALC フィールドで必須） |
| properties.{fieldCode}.digit | 真偽値/文字列 | 任意 | 桁区切り表示（デフォルト: false） |
| properties.{fieldCode}.format | 文字列 | 任意 | 表示形式（NUMBER, NUMBER_DIGIT, DATETIME, DATE, TIME, HOUR_MINUTE, DAY_HOUR_MINUTE） |
| properties.{fieldCode}.displayScale | 数値/文字列 | 任意 | 小数点以下の桁数 |
| properties.{fieldCode}.unit | 文字列 | 任意 | 単位記号 |
| properties.{fieldCode}.unitPosition | 文字列 | 任意 | 単位の位置: BEFORE / AFTER（デフォルト: BEFORE） |
| properties.{fieldCode}.protocol | 文字列 | 条件付き | リンクタイプ: WEB, CALL, MAIL（LINK フィールドで必須） |
| properties.{fieldCode}.thumbnailSize | 数値/文字列 | 任意 | サムネイルサイズ（50, 150, 250, 500 px） |
| properties.{fieldCode}.entities | 配列 | 任意 | ユーザー/グループ/組織選択の選択肢 |
| properties.{fieldCode}.referenceTable | オブジェクト | 条件付き | 関連レコード一覧設定（REFERENCE_TABLE で必須） |
| properties.{fieldCode}.lookup | オブジェクト | 任意 | ルックアップ設定 |
| properties.{fieldCode}.openGroup | 真偽値/文字列 | 任意 | グループ展開表示（デフォルト: false） |
| properties.{fieldCode}.fields | オブジェクト | 条件付き | テーブル/グループ内フィールド（SUBTABLE で必須） |
| revision | 数値または文字列 | 任意 | 期待するリビジョン番号（競合検出用） |

### レスポンス

| プロパティ | 型 | 説明 |
|-----------|------|------|
| revision | 文字列 | 更新後のリビジョン番号 |

### 必要な権限

アプリ管理権限

### 制限事項

- ステータス、作業者、カテゴリーフィールドは追加不可
- 動作テスト環境のみ変更。運用環境への反映にはデプロイ API が必要

### リクエスト例

```json
// POST /k/v1/preview/app/form/fields.json
{
  "app": 1,
  "revision": 2,
  "properties": {
    "文字列1行": {
      "type": "SINGLE_LINE_TEXT",
      "code": "文字列1行",
      "label": "文字列 (1行)",
      "noLabel": false,
      "required": false,
      "unique": false,
      "defaultValue": ""
    }
  }
}
```

### レスポンス例

```json
{
  "revision": "1"
}
```

---

## 2.3 フィールドの変更

**PUT** `/k/v1/preview/app/form/fields.json`

動作テスト環境のアプリのフィールド設定を変更する。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| app | 数値または文字列 | 必須 | アプリID |
| properties | オブジェクト | 必須 | フィールド設定（現在のフィールドコードをキーとする） |
| properties.{fieldCode}.type | 文字列 | 必須 | フィールドタイプ |
| properties.{fieldCode}.code | 文字列 | 任意 | 新しいフィールドコード（変更時に指定） |
| properties.{fieldCode}.label | 文字列 | 任意 | フィールド名 |
| properties.{fieldCode}.required | 真偽値/文字列 | 任意 | 必須入力 |
| properties.{fieldCode}.unique | 真偽値/文字列 | 任意 | 値の重複禁止 |
| （その他パラメータはフィールド追加 API と同様） | | | |
| revision | 数値または文字列 | 任意 | 期待するリビジョン番号（-1 または省略でスキップ） |

### レスポンス

| プロパティ | 型 | 説明 |
|-----------|------|------|
| revision | 文字列 | 更新後のリビジョン番号 |

### 必要な権限

アプリ管理権限

### 制限事項

- ステータス、作業者、カテゴリーフィールドは変更不可
- 省略されたパラメータは既存の値を維持
- フィールドコードの変更は code パラメータで新しい値を指定

### リクエスト例

```json
// PUT /k/v1/preview/app/form/fields.json
{
  "app": 1,
  "revision": 2,
  "properties": {
    "text_field": {
      "type": "SINGLE_LINE_TEXT",
      "code": "text_field",
      "label": "更新されたフィールド名",
      "required": true
    }
  }
}
```

### レスポンス例

```json
{
  "revision": "3"
}
```

---

## 2.4 フィールドの削除

**DELETE** `/k/v1/preview/app/form/fields.json`

動作テスト環境のアプリからフィールドを削除する。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| app | 数値または文字列 | 必須 | アプリID |
| fields | 配列 | 必須 | 削除するフィールドコードの配列（最大100件） |
| revision | 数値または文字列 | 任意 | 期待するリビジョン番号（-1 または省略でスキップ） |

### レスポンス

| プロパティ | 型 | 説明 |
|-----------|------|------|
| revision | 文字列 | 更新後のリビジョン番号 |

### 必要な権限

アプリ管理権限

### 制限事項

- ステータス、作業者、カテゴリーフィールドは削除不可
- グループ/テーブルを削除すると、内部のフィールドも削除される
- システムフィールド（レコード番号、作成者、更新者、作成日時、更新日時）はフォームから削除されるが、データは保持される

### リクエスト例

```json
// DELETE /k/v1/preview/app/form/fields.json
{
  "app": 1,
  "revision": 2,
  "fields": ["field_code_1", "field_code_2"]
}
```

### レスポンス例

```json
{
  "revision": "3"
}
```

---

## 2.5 フォームレイアウトの取得

**GET** `/k/v1/app/form/layout.json`

アプリのフォームレイアウト情報を取得する。動作テスト環境用は `/k/v1/preview/app/form/layout.json`。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| app | 数値または文字列 | 必須 | アプリID |

### レスポンス

| プロパティ | 型 | 説明 |
|-----------|------|------|
| revision | 文字列 | 設定のリビジョン番号 |
| layout | 配列 | 行単位のフォーム構造 |
| layout[].type | 文字列 | 行タイプ: ROW（通常行）, SUBTABLE（テーブル）, GROUP（グループ） |
| layout[].code | 文字列 | テーブル/グループのフィールドコード（ROW の場合は省略） |
| layout[].fields | 配列 | 行内のフィールド |
| layout[].fields[].type | 文字列 | フィールドタイプ |
| layout[].fields[].code | 文字列 | フィールドコード |
| layout[].fields[].label | 文字列 | ラベルテキスト（LABEL タイプのみ） |
| layout[].fields[].elementId | 文字列 | 要素ID（ラベル、スペーサー、罫線用） |
| layout[].fields[].size.width | 文字列 | 幅（ピクセル） |
| layout[].fields[].size.height | 文字列 | 高さ（ラベル含むピクセル） |
| layout[].fields[].size.innerHeight | 文字列 | 内部高さ（ラベル除くピクセル） |
| layout[].layout | 配列 | グループ内のレイアウト（ネスト構造） |

### 必要な権限

- 運用環境: レコード閲覧権限またはレコード追加権限
- 動作テスト環境: アプリ管理権��

### 制限事項

- PC 表示のサイズのみ取得可能（モバイルサイズは取得不可）
- ルックアップフィールドは元のフィールドタイプで返される

### リクエスト例

```
GET /k/v1/app/form/layout.json?app=8
X-Cybozu-API-Token: API_TOKEN
```

### レスポンス例

```json
{
  "revision": "2",
  "layout": [
    {
      "type": "ROW",
      "fields": [
        {
          "type": "SINGLE_LINE_TEXT",
          "code": "textfield",
          "size": { "width": "200" }
        }
      ]
    },
    {
      "type": "SUBTABLE",
      "code": "table_name",
      "fields": []
    }
  ]
}
```

---

## 2.6 フォームレイアウトの変更

**PUT** `/k/v1/preview/app/form/layout.json`

動作テスト環境のアプリのフォームレイアウトを変更する。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| app | 数値または文字列 | 必須 | アプリID |
| layout | 配列 | 必須 | 行単位のレイアウト設定 |
| layout[].type | 文字列 | 必須 | 行タイプ: ROW, SUBTABLE, GROUP |
| layout[].code | 文字列 | 条件付き | フィールドコード（SUBTABLE, GROUP で必須） |
| layout[].fields | 配列 | 必須 | 行内のフィールド |
| layout[].fields[].type | 文字列 | 必須 | フィールドタイプ |
| layout[].fields[].code | 文字列 | 条件付き | フィールドコード（LABEL, SPACER, HR 以外で必須） |
| layout[].fields[].label | 文字列 | 任意 | ラベルテキスト（LABEL タイプのみ） |
| layout[].fields[].elementId | 文字列 | 任意 | 要素ID |
| layout[].fields[].size | オブジェクト | 任意 | サイズ設定 |
| layout[].fields[].size.width | 数値/文字列 | 任意 | 幅（ピクセル） |
| layout[].fields[].size.height | 数値/文字列 | 任意 | 高さ（ピクセル、SPACER のみ） |
| layout[].fields[].size.innerHeight | 数値/文字列 | 任意 | 内部高さ（複数行テキスト/リッチエディター用） |
| layout[].layout | 配列 | 任意 | グループ内レイアウト |
| revision | 数値または文字列 | 任意 | 期待するリビジョン番号 |

### レスポンス

| プロパティ | 型 | 説明 |
|-----------|------|------|
| revision | 文字列 | 更新後のリビジョン番号 |

### 必要な権限

アプリ管理権限

### 制限事項

- すべてのフォームフィールドのレイアウトを指定する必要がある
- 省略されたパラメータは既存の値を維持

### リクエスト例

```json
// PUT /k/v1/preview/app/form/layout.json
{
  "app": 1,
  "revision": 2,
  "layout": [
    {
      "type": "ROW",
      "fields": [
        {
          "type": "SINGLE_LINE_TEXT",
          "code": "text_field",
          "size": { "width": 200 }
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

---

## 2.7 フォーム設計情報の取得（旧 API）

**GET** `/k/v1/form.json`

フォームの設計情報を取得する旧 API。動作テスト環境用は `/k/v1/preview/form.json`。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| app | 数値または文字列 | 必須 | アプリID |

### レスポンス

| プロパティ | 型 | 説明 |
|-----------|------|------|
| properties | 配列 | フィールド定義の配列 |
| properties[].type | 文字列 | フィールドタイプ |
| properties[].label | 文字列 | フィールド名 |
| properties[].code | 文字列 | フィールドコード |
| properties[].noLabel | 文字列 | フィールド名非表示（"true"/"false"） |
| properties[].required | 文字列 | 必須入力（"true"/"false"） |

### 必要な権限

レコード閲覧権限またはレコード追加権限

### 制限事項

- カテゴリー、ステータス、グループ、グループ内の特定フィールド（レコード番号、作成者、作成日時、更新者、更新日時、スペーサー、ラベル、罫線）は取得不可

### リクエスト例

```
GET /k/v1/form.json?app=4
X-Cybozu-API-Token: API_TOKEN
```

### レスポンス例

```json
{
  "properties": [
    {
      "type": "SINGLE_LINE_TEXT",
      "label": "文字列フィールド",
      "code": "text_field",
      "required": "false",
      "maxLength": "64"
    },
    {
      "type": "NUMBER",
      "label": "数値フィールド",
      "code": "number_field",
      "digit": "false"
    }
  ]
}
```

---
