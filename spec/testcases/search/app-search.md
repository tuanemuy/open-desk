# アプリ内検索 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| アプリ内に検索対象のデータが存在する | 有効な appId と keyword でアプリ内検索を実行する | アクセス権のある検索結果が返る | |
| アプリ内に検索対象のデータが存在する | sourceTypes を空配列で検索する | 3種別（RECORD, COMMENT, FILE）すべてが対象となる | |
| アプリ内に検索対象のデータが存在する | sourceTypes に RECORD のみ指定して検索する | RECORD 種別のみの検索結果が返る | |
| アプリ内に検索対象のデータが存在する | sourceTypes に COMMENT のみ指定して検索する | COMMENT 種別のみの検索結果が返る | |
| アプリ内に検索対象のデータが存在する | sourceTypes に FILE のみ指定して検索する | FILE 種別のみの検索結果が返る | |
| 任意の状態 | sourceTypes に THREAD を含めて検索する | UnavailableSourceTypeError が返る | |
| 任意の状態 | sourceTypes に PEOPLE を含めて検索する | UnavailableSourceTypeError が返る | |
| 任意の状態 | sourceTypes に MESSAGE を含めて検索する | UnavailableSourceTypeError が返る | |
| 任意の状態 | keyword を空文字で検索する | EmptyKeywordError が返る | |
| 任意の状態 | dateFrom > dateTo で検索する | InvalidDateRangeError が返る | |
| 検索エンジンが障害中 | アプリ内検索を実行する | SearchExecutionError が返る | |
| 任意の状態 | offset: -1 で検索する | バリデーションエラーが返る | |
| 任意の状態 | limit: 0 で検索する | バリデーションエラーが返る | |
| 任意の状態 | limit: 101 で検索する | バリデーションエラーが返る | |
| 任意の状態 | offset: 0, limit: 1 で検索する（limit 最小値） | 最大1件の検索結果が返る | |
| 任意の状態 | offset: 0, limit: 100 で検索する（limit 最大値） | 最大100件の検索結果が返る | |
| 検索結果にアクセス権のない項目が含まれる | アプリ内検索を実行する | アクセス権のない項目がフィルタリングされた結果が返る | |
| アプリ内に検索対象のデータが存在しない | 有効な keyword で検索する | 空配列と totalCount: 0 が返る | |
| dateFrom と dateTo が同一日 | 検索する | 当該日の検索結果のみが返る | |
