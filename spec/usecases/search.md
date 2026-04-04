# Search ユースケース定義

## 1. 全文検索

### 概要

OpenDesk 全体を対象にキーワードで全文検索する。ソース種別（レコード・コメント・スレッド・ピープル・メッセージ・添付ファイル）、作成日範囲、作成者によるフィルタリングが可能。スコープは GLOBAL。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| keyword | string | 必須 | 空文字でないこと |
| sourceTypes | SourceType[] | 任意 | 各要素が有効な SourceType であること（空配列の場合は全種別対象）。GLOBAL スコープでは全6種別（RECORD, COMMENT, THREAD, PEOPLE, MESSAGE, FILE）が利用可能 |
| dateFrom | Date | 任意 | dateFrom と dateTo が両方指定されている場合、dateFrom <= dateTo であること |
| dateTo | Date | 任意 | dateFrom と dateTo が両方指定されている場合、dateFrom <= dateTo であること |
| creatorId | UserId | 任意 | 有効な UserId 形式であること |
| offset | number | 必須 | 0 以上の整数であること |
| limit | number | 必須 | 1 以上 100 以下の整数であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| items | SearchResultItem[] |
| totalCount | number |
| offset | number |
| limit | number |

### 処理フロー

1. keyword が空文字でないことを検証する。空の場合は EmptyKeywordError を返す
2. dateFrom と dateTo が両方指定されている場合、dateFrom <= dateTo であることを検証する。違反する場合は InvalidDateRangeError を返す
3. SearchQuery を構築する（scope: { type: "GLOBAL" }, keyword, filters: { sourceTypes, dateRange: { from: dateFrom, to: dateTo }, creatorId }, offset, limit）
4. `SearchIndexProvider.search(query)` で全文検索を実行する
5. AccessControl ドメインのポートを通じて、operatorId がアクセス権を持たない検索結果項目をフィルタリングする
6. フィルタリング後の検索結果を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| keyword が空文字 | EmptyKeywordError |
| dateFrom > dateTo | InvalidDateRangeError |
| 検索エンジンの実行に失敗 | SearchExecutionError |

---

## 2. アプリ内検索

### 概要

指定アプリ内のレコード・コメント・添付ファイルを対象にキーワードで検索する。スコープは APP。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| appId | AppId | 必須 | 有効な AppId 形式であること |
| keyword | string | 必須 | 空文字でないこと |
| sourceTypes | SourceType[] | 任意 | 各要素が RECORD, COMMENT, FILE のいずれかであること（APP スコープでは3種別のみ利用可能）。空配列の場合は3種別すべてを対象とする |
| dateFrom | Date | 任意 | dateFrom と dateTo が両方指定されている場合、dateFrom <= dateTo であること |
| dateTo | Date | 任意 | dateFrom と dateTo が両方指定されている場合、dateFrom <= dateTo であること |
| creatorId | UserId | 任意 | 有効な UserId 形式であること |
| offset | number | 必須 | 0 以上の整数であること |
| limit | number | 必須 | 1 以上 100 以下の整数であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| items | SearchResultItem[] |
| totalCount | number |
| offset | number |
| limit | number |

### 処理フロー

1. keyword が空文字でないことを検証する。空の場合は EmptyKeywordError を返す
2. sourceTypes に APP スコープで利用不可の種別（THREAD, PEOPLE, MESSAGE）が含まれている場合は UnavailableSourceTypeError を返す
3. dateFrom と dateTo が両方指定されている場合、dateFrom <= dateTo であることを検証する。違反する場合は InvalidDateRangeError を返す
4. SearchQuery を構築する（scope: { type: "APP", appId }, keyword, filters: { sourceTypes, dateRange: { from: dateFrom, to: dateTo }, creatorId }, offset, limit）
5. `SearchIndexProvider.search(query)` でアプリ内検索を実行する
6. AccessControl ドメインのポートを通じて、operatorId がアクセス権を持たない検索結果項目をフィルタリングする
7. フィルタリング後の検索結果を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| keyword が空文字 | EmptyKeywordError |
| sourceTypes に APP スコープで利用不可の種別が含まれる | UnavailableSourceTypeError |
| dateFrom > dateTo | InvalidDateRangeError |
| 検索エンジンの実行に失敗 | SearchExecutionError |

---

## 3. スペース内検索

### 概要

指定スペース内のレコード・コメント・スレッド・添付ファイルを対象にキーワードで検索する。スコープは SPACE。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| spaceId | SpaceId | 必須 | 有効な SpaceId 形式であること |
| keyword | string | 必須 | 空文字でないこと |
| sourceTypes | SourceType[] | 任意 | 各要素が RECORD, COMMENT, THREAD, FILE のいずれかであること（SPACE スコープでは4種別のみ利用可能）。空配列の場合は4種別すべてを対象とする |
| dateFrom | Date | 任意 | dateFrom と dateTo が両方指定されている場合、dateFrom <= dateTo であること |
| dateTo | Date | 任意 | dateFrom と dateTo が両方指定されている場合、dateFrom <= dateTo であること |
| creatorId | UserId | 任意 | 有効な UserId 形式であること |
| offset | number | 必須 | 0 以上の整数であること |
| limit | number | 必須 | 1 以上 100 以下の整数であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| items | SearchResultItem[] |
| totalCount | number |
| offset | number |
| limit | number |

### 処理フロー

1. keyword が空文字でないことを検証する。空の場合は EmptyKeywordError を返す
2. sourceTypes に SPACE スコープで利用不可の種別（PEOPLE, MESSAGE）が含まれている場合は UnavailableSourceTypeError を返す
3. dateFrom と dateTo が両方指定されている場合、dateFrom <= dateTo であることを検証する。違反する場合は InvalidDateRangeError を返す
4. SearchQuery を構築する（scope: { type: "SPACE", spaceId }, keyword, filters: { sourceTypes, dateRange: { from: dateFrom, to: dateTo }, creatorId }, offset, limit）
5. `SearchIndexProvider.search(query)` でスペース内検索を実行する
6. AccessControl ドメインのポートを通じて、operatorId がアクセス権を持たない検索結果項目をフィルタリングする
7. フィルタリング後の検索結果を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| keyword が空文字 | EmptyKeywordError |
| sourceTypes に SPACE スコープで利用不可の種別が含まれる | UnavailableSourceTypeError |
| dateFrom > dateTo | InvalidDateRangeError |
| 検索エンジンの実行に失敗 | SearchExecutionError |
