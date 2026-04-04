# 全文検索 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 検索対象のデータが存在する | 有効な keyword で全文検索を実行する | アクセス権のある検索結果が返る | |
| 検索対象のデータが存在する | keyword, sourceTypes, dateFrom, dateTo, creatorId を指定して検索する | 全フィルタが適用された検索結果が返る | |
| 検索対象のデータが存在する | sourceTypes を空配列で検索する | 全6種別（RECORD, COMMENT, THREAD, PEOPLE, MESSAGE, FILE）が対象となる | |
| 検索対象のデータが存在する | sourceTypes に RECORD のみ指定して検索する | RECORD 種別のみの検索結果が返る | |
| 検索対象のデータが存在する | dateFrom と dateTo を指定して検索する | 指定期間内の検索結果のみが返る | |
| 検索対象のデータが存在する | creatorId を指定して検索する | 指定ユーザーが作成したもののみが返る | |
| 任意の状態 | keyword を空文字で検索する | EmptyKeywordError が返る | |
| 任意の状態 | dateFrom > dateTo で検索する | InvalidDateRangeError が返る | |
| 検索エンジンが障害中 | 全文検索を実行する | SearchExecutionError が返る | |
| 任意の状態 | offset: -1 で検索する | バリデーションエラーが返る | |
| 任意の状態 | limit: 0 で検索する | バリデーションエラーが返る | |
| 任意の状態 | limit: 101 で検索する | バリデーションエラーが返る | |
| 任意の状態 | offset: 0, limit: 1 で検索する（limit 最小値） | 最大1件の検索結果が返る | |
| 任意の状態 | offset: 0, limit: 100 で検索する（limit 最大値） | 最大100件の検索結果が返る | |
| 検索結果にアクセス権のない項目が含まれる | 全文検索を実行する | アクセス権のない項目がフィルタリングされた結果が返る | |
| 検索対象のデータが存在しない | 有効な keyword で検索する | 空配列と totalCount: 0 が返る | |
| dateFrom のみ指定（dateTo は未指定） | 検索する | dateFrom 以降の検索結果が返る | |
| dateTo のみ指定（dateFrom は未指定） | 検索する | dateTo 以前の検索結果が返る | |
| dateFrom と dateTo が同一日 | 検索する | 当該日の検索結果のみが返る | |
