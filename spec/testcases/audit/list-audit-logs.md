# 監査ログ一覧取得 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 保持期間内の監査ログが複数件存在する | フィルタ条件なし、limit: 10, offset: 0 で一覧取得する | 日時の降順で最大10件の監査ログと totalCount が返る | |
| 保持期間内の監査ログが0件 | フィルタ条件なしで一覧取得する | logs が空配列、totalCount が 0 で返る | |
| 保持期間内の監査ログが15件存在する | limit: 10, offset: 0 で一覧取得する | 先頭10件が返り、totalCount が 15 で返る | |
| 保持期間内の監査ログが15件存在する | limit: 10, offset: 10 で一覧取得する | 残り5件が返り、totalCount が 15 で返る | |
| 保持期間内の監査ログが15件存在する | limit: 10, offset: 15 で一覧取得する | logs が空配列、totalCount が 15 で返る | |
| CRITICAL と INFO のログが混在する | level: "CRITICAL" でフィルタして一覧取得する | CRITICAL のログのみが返る | |
| CRITICAL と INFO のログが混在する | level: "INFO" でフィルタして一覧取得する | 全件（CRITICAL + INFO）が返る（情報以上は全件） | |
| 複数ユーザーのログが存在する | 特定の userId でフィルタして一覧取得する | 該当ユーザーのログのみが返る | |
| 複数サービスのログが存在する | service: "OPEN_DESK" でフィルタして一覧取得する | OPEN_DESK のログのみが返る | |
| 複数モジュールのログが存在する | module: "App" でフィルタして一覧取得する（部分一致） | モジュール名に "App" を含むログのみが返る | |
| 複数アクションのログが存在する | action: "create" でフィルタして一覧取得する（部分一致） | アクション名に "create" を含むログのみが返る | |
| SUCCESS と FAILURE のログが混在する | result: "FAILURE" でフィルタして一覧取得する | FAILURE のログのみが返る | |
| 異なる日時のログが存在する | dateFrom と dateTo を指定してフィルタする | 指定範囲内のログのみが返る | |
| 異なる日時のログが存在する | dateFrom のみ指定してフィルタする | dateFrom 以降のログが返る | |
| 異なる日時のログが存在する | dateTo のみ指定してフィルタする | dateTo 以前かつ保持期間内のログが返る | |
| 異なる日時のログが存在する | dateFrom も dateTo も未指定でフィルタする | 保持期間（6週間前）以降のログが全件返る | |
| 複数のフィルタ条件に一致するログが存在する | level, service, result を組み合わせてフィルタする | 全条件に一致するログのみが返る | |
| dateFrom が dateTo より後の日時 | dateFrom > dateTo でフィルタして一覧取得する | InvalidAuditFilterError が返る | |
| dateFrom が保持期間（6週間前）より古い | 6週間より前の dateFrom を指定して一覧取得する | InvalidAuditFilterError が返る | |
| dateFrom が保持期間（6週間前）のちょうど境界値 | 保持期間ちょうどの dateFrom を指定して一覧取得する | 正常に取得できる（境界値は許容） | |
| dateFrom が未指定 | dateFrom を省略して一覧取得する | dateFrom が保持期間（6週間前）に自動設定され、正常に取得できる | |
| limit が 1（最小値） | limit: 1 で一覧取得する | 1件のみ返る | |
| offset が 0（最小値） | offset: 0 で一覧取得する | 先頭から返る | |
