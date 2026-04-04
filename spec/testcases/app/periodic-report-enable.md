# 定期レポート��効化 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 定期レポートが無効なレポートが存在する | interval=DAILY, hourMinute, timezone を指定して有効化する | 定期レポートが有効化され、isSettingsLocked=true となる | |
| 定期レポートが無効なレポートが存在する | interval=MONTHLY, dayOfMonth=15, hourMinute, timezone を指定して有効化する | 月次定期レポートが有効化される | |
| 定期レポートが無効なレポートが存在する | interval=WEEKLY, dayOfWeek=1, hourMinute, timezone を指定して有効化する | 週次定期レポートが有効化される | |
| 定期レポートが無効な��ポートが存在する | interval=HOURLY, minuteOfHour=30, timezone を指定して有効化する | 毎時定期レポートが有効化される | |
| 定期レポートが無効なレポ��トが存在する | interval=QUARTERLY, dayOfMonth=1, quarterMonth=1, hourMinute, timezone を指定して有効化する | 四半期定期レポートが有効化される | |
| 定期レポートが無効なレポートが存在する | interval=YEARLY, dayOfMonth=1, hourMinute, timezone を指定して有効化する | 年次定��レポートが有効化される | |
| MONTHLY | dayOfMonth=32（末日）を指定する | 末日に実行される定期レポートが有効化される | |
| HOURLY | minuteOfHour=0 を指定する | 毎時0分に実行される（境界値） | |
| HOURLY | minuteOfHour=50 を指定する | 毎時50分に実行される（境界値） | |
| - | 存在しない appId を指定する | ��リデーションエラーが��される | |
| - | 存在し��い reportId を指定する | バリデーションエラーが返される | |
| アプ��が DELETED 状態 | 定期レポートを有効化する | ビジネスルール違反エラ��が返される | |
| 既に定期レポートが有効 | 再度有効化する | ビジネスルール違反エラーが返��れる | |
| MONTHLY | dayOfMonth を未指定にする | バリデーシ��ンエラーが返される | |
| WEEKLY | dayOfWeek を未指定にする | バリデーションエ��ーが返される | |
| HOURLY | minuteOfHour を未指定にする | バリデーションエラーが返��れる | |
| - | timezone に無効な文字列を指定する | バリデーションエラー���返される | |
