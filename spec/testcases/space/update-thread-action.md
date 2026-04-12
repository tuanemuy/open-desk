# スレッドアクション更新 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 操作者がシステム管理権限を持つ、スレッドアクションが存在する | actionName のみ変更して更新する | actionName が更新され、modifierId と modifiedAt が更新された DTO が返る | |
| 操作者がシステム管理権限を持つ、スレッドアクションが存在する | destinationAppId のみ変更して更新する（有効なアプリ） | destinationAppId が更新され、フィールドマッピングがクリアされた DTO が返る | |
| 操作者がシステム管理権限を持つ、スレッドアクションが存在する | fieldMappings のみ変更して更新する（1件以上100件以下） | fieldMappings が更新された DTO が返る | |
| 操作者がシステム管理権限を持つ、スレッドアクションが存在する | actionName, destinationAppId, fieldMappings をすべて指定して更新する | すべてのフィールドが更新された DTO が返る | |
| 操作者がシステム管理権限を持つ、スレッドアクションが存在する | 何も指定せずに更新する | modifierId と modifiedAt のみ更新され、他は変更されない DTO が返る | |
| 操作者が cybozu.com 共通管理者である（systemAdmin 権限なし） | スレッドアクションを更新する | cybozu.com 共通管理者でも更新可能で、DTO が返る | |
| 操作者がシステム管理権限を持つ | actionName を1文字に変更する | 正常に更新される（下限境界値） | |
| 操作者がシステム管理権限を持つ | actionName を128文字に変更する | 正常に更新される（上限境界値） | |
| 操作者がシステム管理権限を持つ | fieldMappings を100件に変更する | 正常に更新される（上限境界値） | |
| 操作者がシステム管理権限を持たない一般ユーザー | スレッドアクションを更新する | SystemPermissionDeniedError が返る | |
| 操作者がシステム管理権限を持つ | 存在しない threadActionId を指定して更新する | ThreadActionNotFoundError が返る | |
| 操作者がシステム管理権限を持つ、スレッドアクションが存在する | actionName を空文字に変更する | EmptyThreadActionNameError が返る | |
| 操作者がシステム管理権限を持つ、スレッドアクションが存在する | actionName を129文字に変更する | ThreadActionNameTooLongError が返る | |
| 操作者がシステム管理権限を持つ、スレッドアクションが存在する | 存在しない destinationAppId を指定して更新する | InvalidDestinationAppError が返る | |
| 操作者がシステム管理権限を持つ、スレッドアクションが存在する | fieldMappings を0件（空配列）に変更する | EmptyFieldMappingsError が返る | |
| 操作者がシステム管理権限を持つ、スレッドアクションが存在する | fieldMappings を101件に変更する | TooManyFieldMappingsError が返る | |
