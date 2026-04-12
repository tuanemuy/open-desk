# スペース復旧 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 操作者がシステム管理権限を持つ、スペースが削除後1日経過している | スペースを復旧する | スペースが復旧され、スペース情報（spaceId, name, isPrivate, useMultiThread, fixedMember, appCreationPermission, coverImage, defaultThreadId, createdAt）を含む DTO が返る | |
| 操作者が cybozu.com 共通管理者である（systemAdmin 権限なし）、スペースが削除済み | スペースを復旧する | cybozu.com 共通管理者でも復旧可能で、DTO が返る | |
| 操作者がシステム管理権限を持つ、スペースが削除後13日経過している | スペースを復旧する | 14日以内なので正常に復旧される（境界値: 期限内） | |
| 操作者がシステム管理権限を持つ、スペースが削除後ちょうど14日経過している | スペースを復旧する | 14日以内なので正常に復旧される（境界値: 期限ぎりぎり） | |
| 操作者がシステム管理権限を持つ、スペースが削除後14日1秒超過している | スペースを復旧する | SpaceRestoreExpiredError が返る（境界値: 期限超過） | |
| 操作者がシステム管理権限を持たない一般ユーザー | スペースを復旧する | SystemPermissionDeniedError が返る | |
| 操作者がシステム管理権限を持つ | 存在しない spaceId を指定して復旧する | SpaceNotFoundError が返る | |
| 操作者がシステム管理権限を持つ、スペースが削除されていない（アクティブ状態） | スペースを復旧する | SpaceNotDeletedError が返る | |
| 操作者がシステム管理権限を持つ、スペースが削除後30日経過している | スペースを復旧する | SpaceRestoreExpiredError が返る（deletedAt と expiredAt を含む） | |
