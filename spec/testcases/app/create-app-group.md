# アプリグループ作成 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 操作者がアプリグループ管理権限（appGroupManageable）を持つ | 有効な name でアプリグループを作成する | アプリグループが作成され、appGroupId・name・isDefault: false・appIds: 空配列・createdAt・updatedAt を含む DTO が返る | |
| 操作者がアプリグループ管理権限を持つ | name を1文字で作成する | 正常に作成される（下限境界値） | |
| 操作者がアプリグループ管理権限を持つ | name を128文字で作成する | 正常に作成される（上限境界値） | |
| 操作者がアプリグループ管理権限を持たない一般ユーザー | アプリグループを作成する | SystemPermissionDeniedError が返る | |
| 操作者がアプリグループ管理権限を持つ | name を空文字で作成する | EmptyAppGroupNameError が返る | |
| 操作者がアプリグループ管理権限を持つ | name を129文字で作成する | AppGroupNameTooLongError が返る | |
