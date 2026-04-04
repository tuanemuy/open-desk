# 通知未読化 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 操作者が受信者で、既読通知が存在する | 通知を未読にする | isRead=false になり、notificationId と isRead が返る | |
| 操作者が受信者で、既に未読の通知が存在する | 通知を未読にする | 何も変更されず isRead=false が返る（冪等） | |
| 存在しない notificationId を指定する | 通知未読化を試みる | NotificationNotFoundError が返る | |
| 操作者が通知の受信者でない | 通知未読化を試みる | NotificationAccessDeniedError が返る | |
