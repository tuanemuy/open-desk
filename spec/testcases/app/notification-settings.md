# 通知条件設定 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| ACTIVE 状態のアプリが存在する | generalNotifications を設定する（recipients・events 指定） | アプリ条件通知が設定され、appId・revision が返却さ��る | |
| ACTIVE 状態のアプリが存在する | perRecordNotifications を設定する（filterCondition・recipients 指定） | レコ���ド条件通知が設定される | |
| アプリに日付型フィールドが存在する | reminderNotifications を設定する（dateFieldCode・offsetDays・recipients 指定） | リマインダー通知が設定される | |
| 通知条件が未設定のアプリ | 新規に通知条件を設定する | 新しい通知条件が作成される | |
| 既存の通知条件がある | generalNotifications に enableCommentTracking=true を含めて更新する | コメント追跡が有効になる | |
| リマインダー通知 | offsetDays に負の値（例: -3）を指定する | 日付の3日前にリマインダーが設定される | |
| リマ��ンダー通知 | offsetDays に正の値（例: 1）を指定する | 日付の1日後にリマインダーが設定される | |
| - | 存���しない appId を指定する | バリデーションエラーが返���れる | |
| アプリが DELETED 状態 | 通知条件を設定する | ビジネスルール違反エラーが返される | |
| revision が現在の値と一致しない | 通知条件を設定する | ビジネスルール違反エラー（���観的ロック競合）が返される | |
| - | recipients を空配列で送信する | バリデーションエ��ーが返���れる | |
| - | events を空配列で送信する | バリデーションエラーが返される | |
| - | リマインダーの dateFieldCode に日付/日時型でないフィールドを指定する | バリ��ーションエラーが返される | |
| - | リマインダーの dateFieldCode に存在しないフィールドを指定する | バリデーションエラーが返される | |
| - | timezone に無効な文字列を指定する | バリデーションエラーが返���れる | |
