# アクセス状況 CSV ダウンロード テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 複数ユーザーの UserAccessUsage が存在する | アクセス状況を CSV ダウンロードする | 全ユーザーのアクセス状況がユーザー名順で返る | |
| UserAccessUsage が0件（ユーザーなし） | アクセス状況を CSV ダウンロードする | usages が空配列で返る | |
| 1件のみ UserAccessUsage が存在する | アクセス状況を CSV ダウンロードする | 1件のアクセス状況が返る | |
| lastAccessDate が null のユーザーが含まれる | アクセス状況を CSV ダウンロードする | lastAccessDate が null のまま含まれて返る | |
| accessDaysLast30 が 0 のユーザーが含まれる | アクセス状況を CSV ダウンロードする | accessDaysLast30 が 0 のまま含まれて返る | |
| accessDaysLast30 が 30 のユーザーが含まれる | アクセス状況を CSV ダウンロードする | accessDaysLast30 が 30 のまま含まれて返る | |
| 大量のユーザーの UserAccessUsage が存在する | アクセス状況を CSV ダウンロードする | 全件がユーザー名順で返る | |
