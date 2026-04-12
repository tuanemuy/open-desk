# アクセス記録 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| ユーザーの UserAccessUsage が存在しない（初回アクセス） | 有効な userId と accessDate でアクセスを記録する | UserAccessUsage が新規作成され、lastAccessDate と accessDaysLast30 が設定されて返る | |
| ユーザーの UserAccessUsage が既に存在する | 有効な userId と accessDate でアクセスを記録する | lastAccessDate が更新され、accessDaysLast30 が再計算されて返る | |
| ユーザーの lastAccessDate が昨日 | 本日の accessDate でアクセスを記録する | lastAccessDate が本日に更新され、accessDaysLast30 が 1 増加する | |
| ユーザーの lastAccessDate が本日（同日の再アクセス） | 本日の accessDate でアクセスを記録する | lastAccessDate はそのまま、accessDaysLast30 は変化しない（同日は重複カウントしない） | |
| ユーザーの accessDaysLast30 が 0（30日以上アクセスなし） | 本日の accessDate でアクセスを記録する | lastAccessDate が更新され、accessDaysLast30 が 1 になる | |
| ユーザーの accessDaysLast30 が 30（毎日アクセス） | 本日の accessDate でアクセスを記録する | accessDaysLast30 が 30 のまま維持される（上限30） | |
| 有効な入力パラメータが揃っている | accessDate に未来の日付を指定してアクセスを記録する | InvalidAccessDaysError が返る | |
| 有効な入力パラメータが揃っている | accessDate に本日の日付を指定してアクセスを記録する | 正常に記録される（境界値：本日は未来ではない） | |
| 複数ユーザーの UserAccessUsage が存在する | 特定の userId でアクセスを記録する | 指定ユーザーの UserAccessUsage のみ更新され、他ユーザーに影響しない | |
