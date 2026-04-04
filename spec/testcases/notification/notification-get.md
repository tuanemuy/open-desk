# 通知詳細取得 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 操作者が受信者である通知が存在する | 通知詳細を取得する | 通知情報（notificationId, type, sourceType, sourceId, senderId, title, content, isRead, isReadLater, createdAt）と発生元情報（source）が返る | |
| 操作者が受信者で、sourceType=COMMENT の通知 | 通知詳細を取得する | コメントの発生元情報が source に含まれる | |
| 操作者が受信者で、sourceType=THREAD の通知 | 通知詳細を取得する | スレッドの発生元情報が source に含まれる | |
| 操作者が受信者で、senderId=null の通知（システム生成） | 通知詳細を取得する | senderId=null で通知情報が返る | |
| 操作者が受信者で、発生元が既に削除されている | 通知詳細を取得する | source=null で通知情報が返る | |
| 存在しない notificationId を指定する | 通知詳細取得を試みる | NotificationNotFoundError が返る | |
| 操作者が通知の受信者でない | 通知詳細取得を試みる | NotificationAccessDeniedError が返る | |
