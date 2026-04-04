# フィールド形式

OpenDesk REST APIでレコードを操作する際の各フィールドの型名（type値）と値の形式（value）を定義する。

参照: https://cybozu.dev/ja/OpenDesk/docs/overview/field-types/

## フィールドの指定方法

- **フィールドコードで指定**: ほとんどのフィールド
- **フィールド名で指定**: カテゴリー、ステータス、作業者のみ

## フィールド一覧

### レコード情報フィールド（システムフィールド）

| フィールド | type値 | value形式 | 取得 | 登録 | 更新 |
|-----------|--------|-----------|:----:|:----:|:----:|
| レコード番号 | `RECORD_NUMBER` | `string`（数値またはアプリコード付き） | o | x | x |
| レコードID | `__ID__` | `string`（数値） | o | x | x |
| リビジョン | `__REVISION__` | `string`（数値） | o | x | x |
| 作成者 | `CREATOR` | `object`（code, name） | o | o | x |
| 作成日時 | `CREATED_TIME` | `string`（ISO 8601） | o | o | x |
| 更新者 | `MODIFIER` | `object`（code, name） | o | x | x |
| 更新日時 | `UPDATED_TIME` | `string`（ISO 8601） | o | x | x |

### テキスト系フィールド

| フィールド | type値 | value形式 | 取得 | 登録 | 更新 |
|-----------|--------|-----------|:----:|:----:|:----:|
| 文字列（1行） | `SINGLE_LINE_TEXT` | `string` | o | o | o |
| 文字列（複数行） | `MULTI_LINE_TEXT` | `string`（改行は`\n`） | o | o | o |
| リッチエディター | `RICH_TEXT` | `string`（HTML） | o | o | o |

### 数値系フィールド

| フィールド | type値 | value形式 | 取得 | 登録 | 更新 |
|-----------|--------|-----------|:----:|:----:|:----:|
| 数値 | `NUMBER` | `string`（数値文字列） | o | o | o |
| 計算 | `CALC` | `string`（計算結果） | o | x | x |

### 選択系フィールド

| フィールド | type値 | value形式 | 取得 | 登録 | 更新 |
|-----------|--------|-----------|:----:|:----:|:----:|
| チェックボックス | `CHECK_BOX` | `string[]`（選択肢の配列） | o | o | o |
| ラジオボタン | `RADIO_BUTTON` | `string`（選択肢） | o | o | o |
| 複数選択 | `MULTI_SELECT` | `string[]`（選択肢の配列） | o | o | o |
| ドロップダウン | `DROP_DOWN` | `string`（選択肢） | o | o | o |

### ユーザー・組織系フィールド

| フィールド | type値 | value形式 | 取得 | 登録 | 更新 |
|-----------|--------|-----------|:----:|:----:|:----:|
| ユーザー選択 | `USER_SELECT` | `object[]`（code, name の配列） | o | o | o |
| 組織選択 | `ORGANIZATION_SELECT` | `object[]`（code, name の配列） | o | o | o |
| グループ選択 | `GROUP_SELECT` | `object[]`（code, name の配列） | o | o | o |

### 日時系フィールド

| フィールド | type値 | value形式 | 取得 | 登録 | 更新 |
|-----------|--------|-----------|:----:|:----:|:----:|
| 日付 | `DATE` | `string`（`YYYY-MM-DD`） | o | o | o |
| 時刻 | `TIME` | `string`（`HH:mm`） | o | o | o |
| 日時 | `DATETIME` | `string`（`YYYY-MM-DDTHH:mm:ssZ`、UTC） | o | o | o |

### その他のフィールド

| フィールド | type値 | value形式 | 取得 | 登録 | 更新 |
|-----------|--------|-----------|:----:|:----:|:----:|
| リンク | `LINK` | `string`（URL/電話番号/メールアドレス） | o | o | o |
| 添付ファイル | `FILE` | `object[]`（fileKey, name, contentType, size） | o | o | o |

### 特殊フィールド

| フィールド | type値 | value形式 | 取得 | 登録 | 更新 |
|-----------|--------|-----------|:----:|:----:|:----:|
| テーブル（サブテーブル） | `SUBTABLE` | `object[]`（id, value のオブジェクト配列） | o | o | o |
| 関連レコード一覧 | `REFERENCE_TABLE` | - | x | x | x |
| カテゴリー | `CATEGORY` | `string[]`（カテゴリー名の配列） | o | x | x |
| ステータス | `STATUS` | `string`（ステータス名） | o | x | x |
| 作業者 | `STATUS_ASSIGNEE` | `object[]`（code, name の配列） | o | x | x |
| ルックアップ | *キー項目の型に準ずる* | キー項目の型に準ずる | o | o | o |

### 装飾フィールド（値なし）

| フィールド | type値 | 説明 |
|-----------|--------|------|
| ラベル | `LABEL` | 装飾用。値の取得・登録・更新不可 |
| スペース | `SPACER` | 装飾用。値の取得・登録・更新不可 |
| 罫線 | `HR` | 装飾用。値の取得・登録・更新不可 |
| グループ | `GROUP` | 装飾用。値の取得・登録・更新不可 |

## 各フィールドの値形式（詳細）

### 文字列（1行） - `SINGLE_LINE_TEXT`

```json
{
  "フィールドコード": {
    "type": "SINGLE_LINE_TEXT",
    "value": "テストです。"
  }
}
```

### 文字列（複数行） - `MULTI_LINE_TEXT`

```json
{
  "フィールドコード": {
    "type": "MULTI_LINE_TEXT",
    "value": "テスト\nです。"
  }
}
```

### リッチエディター - `RICH_TEXT`

```json
{
  "フィールドコード": {
    "type": "RICH_TEXT",
    "value": "<div><b>テスト</b></div>"
  }
}
```

### 数値 - `NUMBER`

```json
{
  "フィールドコード": {
    "type": "NUMBER",
    "value": "123"
  }
}
```

使用可能な値: 数値、符号（`+` / `-`）、小数点（`.`）、指数表記（`e` / `E`）、空文字列。

### 計算 - `CALC`

```json
{
  "フィールドコード": {
    "type": "CALC",
    "value": "123"
  }
}
```

表示書式により形式が異なる: 数値、カンマ区切り数値、日時、日付、時刻、時間量（時分）、時間量（日時分）。

**取得のみ。登録・更新不可。**

### チェックボックス - `CHECK_BOX`

```json
{
  "フィールドコード": {
    "type": "CHECK_BOX",
    "value": ["選択肢1", "選択肢2"]
  }
}
```

### ラジオボタン - `RADIO_BUTTON`

```json
{
  "フィールドコード": {
    "type": "RADIO_BUTTON",
    "value": "選択肢3"
  }
}
```

### 複数選択 - `MULTI_SELECT`

```json
{
  "フィールドコード": {
    "type": "MULTI_SELECT",
    "value": ["選択肢1", "選択肢2"]
  }
}
```

### ドロップダウン - `DROP_DOWN`

```json
{
  "フィールドコード": {
    "type": "DROP_DOWN",
    "value": "選択肢3"
  }
}
```

### ユーザー選択 - `USER_SELECT`

```json
{
  "フィールドコード": {
    "type": "USER_SELECT",
    "value": [
      {"code": "sato", "name": "Noboru Sato"},
      {"code": "guest/sato@example.com", "name": "Noboru Sato"}
    ]
  }
}
```

ゲストユーザーのcodeは `guest/メールアドレス` の形式。

### 組織選択 - `ORGANIZATION_SELECT`

```json
{
  "フィールドコード": {
    "type": "ORGANIZATION_SELECT",
    "value": [
      {"code": "kaihatsu", "name": "開発部"}
    ]
  }
}
```

### グループ選択 - `GROUP_SELECT`

```json
{
  "フィールドコード": {
    "type": "GROUP_SELECT",
    "value": [
      {"code": "project_manager", "name": "プロジェクトマネージャー"}
    ]
  }
}
```

### 日付 - `DATE`

```json
{
  "フィールドコード": {
    "type": "DATE",
    "value": "2012-01-11"
  }
}
```

### 時刻 - `TIME`

```json
{
  "フィールドコード": {
    "type": "TIME",
    "value": "11:30"
  }
}
```

### 日時 - `DATETIME`

```json
{
  "フィールドコード": {
    "type": "DATETIME",
    "value": "2012-01-11T11:30:00Z"
  }
}
```

タイムゾーンはUTC固定。

### リンク - `LINK`

```json
{
  "フィールドコード": {
    "type": "LINK",
    "value": "http://www.example.com/"
  }
}
```

リンクの種類に応じてURL、電話番号、メールアドレスのいずれか。

### 添付ファイル - `FILE`

取得時:

```json
{
  "フィールドコード": {
    "type": "FILE",
    "value": [
      {
        "contentType": "text/plain",
        "fileKey": "201202061155587E339F9067544F1A92C743460E3D12B3297",
        "name": "17to20_VerupLog.txt",
        "size": "23175"
      }
    ]
  }
}
```

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `contentType` | string | MIMEタイプ |
| `fileKey` | string | ファイル識別子（取得時のキーはダウンロード専用） |
| `name` | string | ファイル名 |
| `size` | string | ファイルサイズ（バイト） |

登録・更新時（ファイルアップロードAPIで取得したfileKeyを使用）:

```json
{
  "フィールドコード": {
    "value": [
      {"fileKey": "84a0e9be-c687-4ae6-82be-3b7edab82c21"}
    ]
  }
}
```

**注意**: 取得時のレスポンスに含まれるfileKeyは、ファイルダウンロードにのみ利用できる。登録・更新時のfileKeyはファイルアップロードAPIから取得したものを使用する。

### 作成者 - `CREATOR`

取得時:

```json
{
  "作成者": {
    "type": "CREATOR",
    "value": {
      "code": "sato",
      "name": "Noboru Sato"
    }
  }
}
```

登録時（登録のみ可。更新不可）:

```json
{
  "作成者": {
    "value": {"code": "sato"}
  }
}
```

### 更新者 - `MODIFIER`

取得時:

```json
{
  "更新者": {
    "type": "MODIFIER",
    "value": {
      "code": "sato",
      "name": "Noboru Sato"
    }
  }
}
```

**登録・更新不可。**

### 作成日時 - `CREATED_TIME`

取得時:

```json
{
  "作成日時": {
    "type": "CREATED_TIME",
    "value": "2012-01-11T11:30:00Z"
  }
}
```

登録時（登録のみ可。更新不可。未来日付は不可）:

```json
{
  "作成日時": {
    "value": "2012-01-11T11:30:00Z"
  }
}
```

### 更新日時 - `UPDATED_TIME`

取得時:

```json
{
  "更新日時": {
    "type": "UPDATED_TIME",
    "value": "2012-01-11T11:30:00Z"
  }
}
```

**登録・更新不可。**

### レコード番号 - `RECORD_NUMBER`

```json
{
  "レコード番号": {
    "type": "RECORD_NUMBER",
    "value": "1"
  }
}
```

アプリコードを設定している場合は `APP-1` のような形式になる。

### レコードID - `__ID__`

```json
{
  "$id": {
    "type": "__ID__",
    "value": "1"
  }
}
```

### リビジョン - `__REVISION__`

```json
{
  "$revision": {
    "type": "__REVISION__",
    "value": "5"
  }
}
```

## 特殊フィールドの構造

### テーブル（サブテーブル） - `SUBTABLE`

取得時:

```json
{
  "テーブル": {
    "type": "SUBTABLE",
    "value": [
      {
        "id": "48290",
        "value": {
          "文字列__1行__0": {
            "type": "SINGLE_LINE_TEXT",
            "value": "サンプル1"
          },
          "数値_0": {
            "type": "NUMBER",
            "value": "1"
          }
        }
      },
      {
        "id": "48291",
        "value": {
          "文字列__1行__0": {
            "type": "SINGLE_LINE_TEXT",
            "value": "サンプル2"
          },
          "数値_0": {
            "type": "NUMBER",
            "value": "2"
          }
        }
      }
    ]
  }
}
```

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `id` | string | 行のID。既存行の更新時に指定 |
| `value` | object | 行のフィールド値（各フィールドのtype/valueオブジェクト） |

登録・更新時:
- 既存の行を更新するには `id` を指定する
- `id` を省略すると新規行として追加される
- REST APIでの更新時は、送信した行のみが残り、送信しなかった行は削除される

**注意**: 1つのテーブルに大量の行を追加しないこと。アプリの構成によっては負荷がかかり、レコードの処理に影響する。

### ルックアップ

ルックアップフィールドの型はキー項目のフィールド型に依存する。

キー項目が文字列（1行）の場合:

```json
{
  "ルックアップ": {
    "type": "SINGLE_LINE_TEXT",
    "value": "Code001"
  }
}
```

キー項目が数値の場合:

```json
{
  "ルックアップ": {
    "type": "NUMBER",
    "value": "10"
  }
}
```

キー項目がリンクの場合:

```json
{
  "ルックアップ": {
    "type": "LINK",
    "value": "https://api.example.com"
  }
}
```

**注意**: 登録・更新する場合には、関連付けるアプリのコピー元フィールドを重複禁止に設定する必要がある。

### カテゴリー - `CATEGORY`

```json
{
  "カテゴリー": {
    "type": "CATEGORY",
    "value": ["category1", "category2"]
  }
}
```

**フィールド名で指定。取得のみ。登録・更新不可。**

### ステータス - `STATUS`

```json
{
  "ステータス": {
    "type": "STATUS",
    "value": "未処理"
  }
}
```

**フィールド名で指定。取得のみ。登録・更新不可。** ステータスの変更にはプロセス管理のAPIを使用する。

### 作業者 - `STATUS_ASSIGNEE`

```json
{
  "作業者": {
    "type": "STATUS_ASSIGNEE",
    "value": [
      {"code": "sato", "name": "Noboru Sato"}
    ]
  }
}
```

**フィールド名で指定。取得のみ。登録・更新不可。**

### 関連レコード一覧 - `REFERENCE_TABLE`

REST APIでは値の取得・登録・更新ができない。フォーム設定APIで操作する。

## 空値の扱い

### 取得時の空値

| フィールド形式 | REST API | JS API（詳細画面） |
|--------------|----------|-------------------|
| 文字列系（1行/複数行/日時/リンク/ルックアップ） | `""` | `undefined` |
| 日付・時刻 | `null` | `undefined` |
| ドロップダウン | `null` | `undefined` |
| ラジオボタン | `null` | `""` |
| 配列系（チェックボックス/複数選択/ユーザー選択等） | `[]` | `[]` |

### 登録・更新時の空値設定

| フィールド形式 | 設定する値 |
|--------------|-----------|
| 文字列系・ドロップダウン・日時・リンク・ルックアップ | `""` または `null` |
| 数値 | `""` または `undefined` または `null` |
| 日付・時刻 | `null` |
| 配列系（チェックボックス/複数選択/ユーザー選択等） | `[]` |
| ラジオボタン | 空値の設定不可 |
| カテゴリー・作業者 | 設定不可 |

## 選択肢フィールドの注意点

チェックボックス、ラジオボタン、複数選択、ドロップダウンでは、アプリ設定上で削除済みの選択肢もAPIで指定可能。
