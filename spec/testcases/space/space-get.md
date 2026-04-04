# スペース情報取得 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 公開スペースが存在し、操作者が認証済みユーザー | スペース情報を取得する | スペースの詳細情報（name, isPrivate, isGuest, useMultiThread, fixedMember, appCreationPermission, coverImage, portalDisplay, defaultThreadId, creatorId, createdAt, updatedAt）が返る | |
| 公開スペースが存在し、操作者がメンバーでない認証済みユーザー | スペース情報を取得する | スペースの詳細情報が正常に返る | |
| 非公開スペースが存在し、操作者がスペースメンバー | スペース情報を取得する | スペースの詳細情報が返る | |
| 非公開スペースが存在し、操作者がスペース管理者 | スペース情報を取得する | スペースの詳細情報が返る | |
| 存在しないスペースIDを指定する | スペース情報取得を試みる | SpaceNotFoundError が返る | |
| 非公開スペースが存在し、操作者がメンバーでない | スペース情報取得を試みる | SpaceAccessDeniedError が返る | |
| ゲストスペース（非公開）で操作者がメンバー | スペース情報を取得する | ゲストスペースの詳細情報が返る（isGuest=true） | |
| ゲストスペース（非公開）で操作者がメンバーでない | スペース情報取得を試みる | SpaceAccessDeniedError が返る | |
