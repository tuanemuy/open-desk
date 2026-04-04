# あとで読むトグル テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 操作者が受信者で、isReadLater=false の通知が存在する | あとで読むをトグルする | isReadLater=true になり、notificationId と isReadLater が返る | |
| 操作者が受信者で、isReadLater=true の通知が存在する | あとで読むをトグルする | isReadLater=false になり、notificationId と isReadLater が返る | |
| 操作者が受信者で、未読通知に対して操作 | あとで読むをトグルする | isReadLater が正常にトグルされる（既読状態に影響しない） | |
| 操作者が受信者で、既読通知に対して操作 | あとで読むをトグルする | isReadLater が正常にトグルされる（既読状態に影響しない） | |
| 存在しない notificationId を指定する | あとで読むトグルを試みる | NotificationNotFoundError が返る | |
| 操作者が通知の受信者でない | あとで読むトグルを試みる | NotificationAccessDeniedError が返る | |
