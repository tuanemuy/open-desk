# スレッドアクション作成 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 操作者がシステム管理権限を持つ、有効なコピー先アプリが存在する | 有効な actionName, destinationAppId, fieldMappings（1件）でスレッドアクションを作成する | スレッドアクションが作成され、threadActionId・modifierId・modifiedAt・createdAt を含む DTO が返る | |
| 操作者が cybozu.com 共通管理者である（systemAdmin 権限なし） | スレッドアクションを作成する | cybozu.com 共通管理者でも作成可能で、DTO が返る | |
| 操作者がシステム管理権限を持つ、有効なコピー先アプリが存在する | fieldMappings を100件指定してスレッドアクションを作成する | 正常に作成される（上限境界値） | |
| 操作者がシステム管理権限を持つ | actionName を1文字で作成する | 正常に作成される（下限境界値） | |
| 操作者がシステム管理権限を持つ | actionName を128文字で作成する | 正常に作成される（上限境界値） | |
| 操作者がシステム管理権限を持たない一般ユーザー | スレッドアクションを作成する | SystemPermissionDeniedError が返る | |
| 操作者がシステム管理権限を持つ | actionName を空文字で作成する | EmptyThreadActionNameError が返る | |
| 操作者がシステム管理権限を持つ | actionName を129文字で作成する | ThreadActionNameTooLongError が返る | |
| 操作者がシステム管理権限を持つ | 存在しない destinationAppId を指定して作成する | InvalidDestinationAppError が返る | |
| 操作者がシステム管理権限を持つ | fieldMappings を0件（空配列）で作成する | EmptyFieldMappingsError が返る | |
| 操作者がシステム管理権限を持つ | fieldMappings を101件で作成する | TooManyFieldMappingsError が返る | |
