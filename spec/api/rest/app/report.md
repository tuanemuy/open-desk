# グラフ

## 4.1 グラフ設定の取得

**GET** `/k/v1/app/reports.json`

アプリのグラフ（レポート）設定を取得する。動作テスト環境用は `/k/v1/preview/app/reports.json`。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| app | 数値または文字列 | 必須 | アプリID |
| lang | 文字列 | 任意 | 取得する名前の言語（ja, en, zh, user, default） |

### レスポンス

| プロパティ | 型 | 説明 |
|-----------|------|------|
| reports | オブジェクト | グラフ設定（グラフ名をキーとする） |
| reports.{graphName}.id | 文字列 | グラフID |
| reports.{graphName}.name | 文字列 | グラフ名 |
| reports.{graphName}.chartType | 文字列 | グラフ種別: BAR, COLUMN, PIE, LINE, PIVOT_TABLE, TABLE, AREA, SPLINE, SPLINE_AREA |
| reports.{graphName}.chartMode | 文字列 | 表示モード: NORMAL, STACKED, PERCENTAGE |
| reports.{graphName}.index | 文字列 | 表示順（0始まり） |
| reports.{graphName}.groups | 配列 | 分類項目（code, per を含む） |
| reports.{graphName}.aggregations | 配列 | 集計方法（type, code を含む） |
| reports.{graphName}.filterCond | 文字列 | フィルター条件（クエリ形式） |
| reports.{graphName}.sorts | 配列 | ソート（by, order を含む） |
| reports.{graphName}.periodicReport | オブジェクト/null | 定期レポート設定 |
| revision | 文字列 | アプリ設定のリビジョン番号 |

### 必要な権限

- 運用環境: レコード閲覧権限またはレコード追加権限
- 動作テスト環境: アプリ管理権限

### 制限事項

- アプリ内で同名のグラフがある場合、API 実行に失敗する

### リクエスト例

```
GET /k/v1/app/reports.json?app=1&lang=ja
X-Cybozu-API-Token: API_TOKEN
```

### レスポンス例

```json
{
  "reports": {
    "SampleGraph": {
      "id": "7319",
      "chartType": "BAR",
      "name": "SampleGraph",
      "index": "0",
      "groups": [{ "code": "field_code" }],
      "aggregations": [{ "type": "COUNT" }],
      "filterCond": "",
      "sorts": [{ "by": "TOTAL", "order": "DESC" }],
      "periodicReport": null
    }
  },
  "revision": "77"
}
```

---

## 4.2 グラフ設定の変更

**PUT** `/k/v1/preview/app/reports.json`

動作テスト環境のアプリのグラフ設定を変更する。

### リクエストパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| app | 数値/文字列 | 必須 | アプリID |
| reports | オブジェクト | 必須 | グラフ設定（省略されたグラフは削除される） |
| reports.{graphName}.chartType | 文字列 | 条件付き | グラフ種別 |
| reports.{graphName}.chartMode | 文字列 | 条件付き | 表示モード（BAR/COLUMN/AREA/SPLINE_AREA で必須） |
| reports.{graphName}.name | 文字列 | 条件付き | グラフ名（最大64文字） |
| reports.{graphName}.index | 数値/文字列 | 条件付き | 表示順（重複不可） |
| reports.{graphName}.groups | 配列 | 条件付き | 分類項目（最大3、PIVOT_TABLE は最低2） |
| reports.{graphName}.groups[].code | 文字列 | 条件付き | 分類フィールドコード |
| reports.{graphName}.groups[].per | 文字列 | 条件付き | 時間単位: YEAR, QUARTER, MONTH, WEEK, DAY, HOUR, MINUTE |
| reports.{graphName}.aggregations | 配列 | 条件付き | 集計方法（最大10、PIVOT_TABLE は1） |
| reports.{graphName}.aggregations[].type | 文字列 | 条件付き | 集計タイプ: COUNT, SUM, AVERAGE, MAX, MIN |
| reports.{graphName}.aggregations[].code | 文字列 | 条件付き | 対象フィールドコード（COUNT 以外で必須） |
| reports.{graphName}.filterCond | 文字列 | 任意 | フィルター条件 |
| reports.{graphName}.sorts | 配列 | 条件付き | ソート（最大3） |
| reports.{graphName}.sorts[].by | 文字列 | 条件付き | ソート対象: TOTAL, GROUP1, GROUP2, GROUP3 |
| reports.{graphName}.sorts[].order | 文字列 | 条件付き | ソート順: ASC, DESC |
| reports.{graphName}.periodicReport | オブジェクト | 任意 | 定期レポート設定 |
| reports.{graphName}.periodicReport.active | 真偽値/文字列 | 任意 | 実行状態（デフォルト: true） |
| reports.{graphName}.periodicReport.period | オブジェクト | 条件付き | 集計間隔設定 |
| reports.{graphName}.periodicReport.period.every | 文字列 | 条件付き | 間隔: YEAR, QUARTER, MONTH, WEEK, DAY, HOUR |
| reports.{graphName}.periodicReport.period.month | 数値/文字列 | 条件付き | 月（1-12、YEAR で必須） |
| reports.{graphName}.periodicReport.period.time | 文字列 | 条件付き | 実行時刻（HH:mm） |
| reports.{graphName}.periodicReport.period.pattern | 文字列 | 条件付き | 四半期パターン |
| reports.{graphName}.periodicReport.period.dayOfMonth | 文字列 | 条件付き | 日（1-31 または END_OF_MONTH） |
| reports.{graphName}.periodicReport.period.dayOfWeek | 文字列 | 条件付き | 曜日 |
| reports.{graphName}.periodicReport.period.minute | 数値/文字列 | 条件付き | 分（0, 10, 20, 30, 40, 50） |
| revision | 数値/文字列 | 任意 | 期待するリビジョン番号 |

### レスポンス

| プロパティ | 型 | 説明 |
|-----------|------|------|
| revision | 文字列 | 更新後のリビジョン番号 |
| reports | オブジェクト | グラフ設定 |
| reports.{graphName}.id | 文字列 | グラフID |

### 必要な権限

アプリ管理権限

### 制限事項

- 同名のグラフや既存名との競合でエラー
- 定期レポートの更新時は name, index, active のみ変更可能

### リクエスト例

```json
// PUT /k/v1/preview/app/reports.json
{
  "app": "1",
  "reports": {
    "初期設定": {
      "chartType": "BAR",
      "chartMode": "NORMAL",
      "name": "初期設定",
      "index": "0",
      "groups": [{ "code": "ラジオボタン" }],
      "aggregations": [{ "type": "COUNT" }],
      "filterCond": "",
      "sorts": [{ "by": "TOTAL", "order": "DESC" }],
      "periodicReport": null
    }
  },
  "revision": "2"
}
```

### レスポンス例

```json
{
  "revision": "2",
  "reports": {
    "初期設定": { "id": "7319" }
  }
}
```

---
