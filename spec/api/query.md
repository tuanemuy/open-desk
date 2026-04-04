# クエリの書き方

OpenDesk REST APIでレコードを取得する際のクエリ構文を定義する。

参照: https://cybozu.dev/ja/OpenDesk/docs/overview/query/

## 基本構文

```
フィールドコード 演算子 値 [and|or フィールドコード 演算子 値 ...] [order by ...] [limit ...] [offset ...]
```

- 条件部分は `フィールドコード 演算子 値` の形式で記述する
- 複数条件は `and` / `or` で結合する
- 括弧 `()` でグルーピングが可能
- オプション（`order by`, `limit`, `offset`）は条件の後に指定する
- オプションの指定順序は `order by` → `limit` → `offset`（順序厳守）

## 演算子一覧

| 演算子 | 説明 | 使用例 |
|--------|------|--------|
| `=` | 値が一致する | `文字列_0 = "テスト"` |
| `!=` | 値が異なる | `文字列_0 != "テスト"` |
| `>` | より大きい | `数値_0 > 10` |
| `<` | より小さい | `数値_0 < 10` |
| `>=` | 以上 | `数値_0 >= 10` |
| `<=` | 以下 | `数値_0 <= 10` |
| `in` | 列挙値のいずれかと一致 | `ドロップダウン_0 in ("A", "B")` |
| `not in` | 列挙値のいずれとも一致しない | `ドロップダウン_0 not in ("A", "B")` |
| `like` | 値を含む（部分一致） | `文字列_0 like "テスト"` |
| `not like` | 値を含まない | `文字列_0 not like "テスト"` |
| `is empty` | 空である（空白文字・改行・タブのみも空と判定） | `文字列_複数行_0 is empty` |
| `is not empty` | 空でない | `文字列_複数行_0 is not empty` |
| `and` | 論理積（条件の結合） | `数値_0 >= 10 and 数値_0 <= 20` |
| `or` | 論理和（条件の結合） | `数値_0 < 10 or 数値_0 > 20` |

## 関数一覧

### ユーザー・組織関数

| 関数 | 説明 | 使用例 |
|------|------|--------|
| `LOGINUSER()` | APIを実行したユーザー | `作成者 in (LOGINUSER())` |
| `PRIMARY_ORGANIZATION()` | ユーザーの優先組織 | `組織 in (PRIMARY_ORGANIZATION())` |

**注意**: `PRIMARY_ORGANIZATION()` は優先組織が未設定の場合、その条件は無視される。

### 日時関数

| 関数 | 引数 | 説明 | 使用例 |
|------|------|------|--------|
| `NOW()` | なし | APIを実行した日時 | `作成日時 = NOW()` |
| `TODAY()` | なし | APIを実行した日 | `日付 = TODAY()` |
| `YESTERDAY()` | なし | 前日 | `日付 = YESTERDAY()` |
| `TOMORROW()` | なし | 翌日 | `日付 = TOMORROW()` |
| `FROM_TODAY(数字, 期間単位)` | 数字, DAYS/WEEKS/MONTHS/YEARS | 現在からの相対期間 | `作成日時 < FROM_TODAY(5, DAYS)` |
| `THIS_WEEK()` | 曜日（省略可） | 今週（曜日指定可: SUNDAY〜SATURDAY） | `作成日時 = THIS_WEEK()` |
| `LAST_WEEK()` | 曜日（省略可） | 前週 | `作成日時 = LAST_WEEK()` |
| `NEXT_WEEK()` | 曜日（省略可） | 翌週 | `日時 = NEXT_WEEK()` |
| `THIS_MONTH()` | 日付（省略可） | 今月（指定値: LAST または 1〜31） | `作成日時 = THIS_MONTH()` |
| `LAST_MONTH()` | 日付（省略可） | 前月 | `作成日時 = LAST_MONTH()` |
| `NEXT_MONTH()` | 日付（省略可） | 翌月 | `作成日時 = NEXT_MONTH()` |
| `THIS_YEAR()` | なし | 今年 | `作成日時 = THIS_YEAR()` |
| `LAST_YEAR()` | なし | 前年 | `作成日時 = LAST_YEAR()` |
| `NEXT_YEAR()` | なし | 翌年 | `日時 = NEXT_YEAR()` |

#### 月関数の引数

- `THIS_MONTH(15)`: 今月15日
- `THIS_MONTH(LAST)`: 今月末日
- `LAST_MONTH(1)`: 前月1日
- `NEXT_MONTH(LAST)`: 翌月末日

**注意**: 存在しない日付（例: 2月30日）を指定した場合、翌月1日として計算される。

#### 週関数の引数

- `THIS_WEEK(MONDAY)`: 今週の月曜日
- `LAST_WEEK(FRIDAY)`: 前週の金曜日
- 曜日: `SUNDAY`, `MONDAY`, `TUESDAY`, `WEDNESDAY`, `THURSDAY`, `FRIDAY`, `SATURDAY`

## フィールド・識別子ごとの利用可能な演算子と関数

| フィールド/識別子 | 利用可能な演算子 | 利用可能な関数 |
|------------------|-----------------|---------------|
| レコード番号 | `=` `!=` `>` `<` `>=` `<=` `in` `not in` | なし |
| `$id` | `=` `!=` `>` `<` `>=` `<=` `in` `not in` | なし |
| 作成者 | `in` `not in` | `LOGINUSER()` |
| 作成日時 | `=` `!=` `>` `<` `>=` `<=` | `NOW()` `TODAY()` `YESTERDAY()` `TOMORROW()` `FROM_TODAY()` `THIS_WEEK()` `LAST_WEEK()` `NEXT_WEEK()` `THIS_MONTH()` `LAST_MONTH()` `NEXT_MONTH()` `THIS_YEAR()` `LAST_YEAR()` `NEXT_YEAR()` |
| 更新者 | `in` `not in` | `LOGINUSER()` |
| 更新日時 | `=` `!=` `>` `<` `>=` `<=` | `NOW()` `TODAY()` `YESTERDAY()` `TOMORROW()` `FROM_TODAY()` `THIS_WEEK()` `LAST_WEEK()` `NEXT_WEEK()` `THIS_MONTH()` `LAST_MONTH()` `NEXT_MONTH()` `THIS_YEAR()` `LAST_YEAR()` `NEXT_YEAR()` |
| 文字列（1行） | `=` `!=` `in` `not in` `like` `not like` | なし |
| リンク | `=` `!=` `in` `not in` `like` `not like` | なし |
| 数値 | `=` `!=` `>` `<` `>=` `<=` `in` `not in` | なし |
| 計算 | `=` `!=` `>` `<` `>=` `<=` `in` `not in` | なし |
| 文字列（複数行） | `like` `not like` `is` `is not` | なし |
| リッチエディター | `like` `not like` | なし |
| チェックボックス | `in` `not in` | なし |
| ラジオボタン | `in` `not in` | なし |
| ドロップダウン | `in` `not in` | なし |
| 複数選択 | `in` `not in` | なし |
| 添付ファイル | `like` `not like` `is` `is not` | なし |
| 日付 | `=` `!=` `>` `<` `>=` `<=` | `TODAY()` `YESTERDAY()` `TOMORROW()` `FROM_TODAY()` `THIS_WEEK()` `LAST_WEEK()` `NEXT_WEEK()` `THIS_MONTH()` `LAST_MONTH()` `NEXT_MONTH()` `THIS_YEAR()` `LAST_YEAR()` `NEXT_YEAR()` |
| 時刻 | `=` `!=` `>` `<` `>=` `<=` | なし |
| 日時 | `=` `!=` `>` `<` `>=` `<=` | `NOW()` `TODAY()` `YESTERDAY()` `TOMORROW()` `FROM_TODAY()` `THIS_WEEK()` `LAST_WEEK()` `NEXT_WEEK()` `THIS_MONTH()` `LAST_MONTH()` `NEXT_MONTH()` `THIS_YEAR()` `LAST_YEAR()` `NEXT_YEAR()` |
| ユーザー選択 | `in` `not in` | `LOGINUSER()` |
| 組織選択 | `in` `not in` | `PRIMARY_ORGANIZATION()` |
| グループ選択 | `in` `not in` | なし |
| ステータス | `=` `!=` `in` `not in` | なし |
| ルックアップ | ルックアップ元フィールドの型に準ずる | ルックアップ元フィールドの型に準ずる |

## オプション

### order by

並び替えを指定する。昇順は `asc`、降順は `desc`。複数項目はカンマ区切り。

```
order by 更新日時 desc
order by ステータス asc, 作成日時 desc
```

### limit

取得件数を指定する。

```
limit 20
```

| API | 範囲 | デフォルト値 |
|-----|------|------------|
| 複数レコード取得 | 0〜500 | 100 |
| その他のAPI | 0〜100 | 100 |

### offset

取得開始位置をスキップする件数で指定する。

```
offset 30
```

- 範囲: 0〜10,000
- デフォルト値: 0

## クエリ例

### 基本的なクエリ

```
// 完全一致
Customer = "サイボウズ株式会社"

// 部分一致
Customer like "株式会社"

// 複数値マッチ
Status in ("対応中", "未対応")

// 複数値非マッチ
Status not in ("完了")

// 空判定
Detail is empty
Detail is not empty
```

### 数値・日付の範囲

```
// 数値の範囲
数値_0 >= 10 and 数値_0 <= 20

// 日付の範囲
LimitDay >= "2022-09-29" and LimitDay <= "2022-10-29"
```

### 関数を使ったクエリ

```
// 期限切れのレコード
LimitDay < TODAY() and Status not in ("完了")

// 自分が作成したレコード
作成者 in (LOGINUSER())

// 今月作成されたレコード
作成日時 = THIS_MONTH()

// 過去5日以内に作成されたレコード
作成日時 < FROM_TODAY(5, DAYS)
```

### 複合条件

```
// AND条件
LimitDay < TODAY() and Status not in ("完了")

// OR条件
数値_0 < 10 or 数値_0 > 20

// グルーピング
(QType in ("その他")) or (LimitDay >= "2022-09-29" and LimitDay <= "2022-10-29")
```

### ソート・ページネーション

```
// 期限切れを期限日の昇順で取得
LimitDay < TODAY() and Status not in ("完了") order by LimitDay asc

// 件数指定
order by 更新日時 desc limit 20

// ページネーション
order by レコード番号 asc limit 100 offset 200
```

### レコードIDでの検索

```
$id = 100
$id in (1, 2, 3, 4, 5)
```

### テーブル内フィールドの検索

テーブル内フィールドでは `=` / `!=` の代わりに `in` / `not in` を使用する。

```
// 日時フィールドはISO 8601形式
ResponseDate in ("2022-09-29T05:00:00Z")
```

## エスケープルール

文字列値にダブルクォート `"` やバックスラッシュ `\` を含む場合、エスケープが必要。

対象フィールド: 文字列（1行）、文字列（複数行）、リッチエディター、チェックボックス、ラジオボタン、ドロップダウン、複数選択、ステータス。

### クエリ文字列でのエスケープ

```
Checkbox in ("sample\"1\"")
Checkbox in ("sample\\2\\")
```

### JSON内でのエスケープ（二重エスケープが必要）

```javascript
query: 'Checkbox in ("sample\\"1\\"")'
query: 'Checkbox in ("sample\\\\2\\\\")'
```

## 制限事項

- `offset` の上限は 10,000。10,000件を超えるレコードのページネーションはできない
- `limit` の上限は複数レコード取得APIで500、その他で100
- `like` 演算子は単語単位での検索となる
- `like` 演算子で使用できない記号がある
- テーブル内フィールドおよび関連レコードフィールドでは `=` / `!=` が使用できず、`in` / `not in` を使用する
- `PRIMARY_ORGANIZATION()` は優先組織が未設定のユーザーが実行した場合、その条件は無視される
- 月関数で存在しない日付（例: 2月30日）を指定した場合、翌月1日として計算される
- カテゴリーとグループはクエリの条件に使用できない
