# アプリテンプレート作成 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 操作者がアプリ管理権限（appEditable）を持つ、ソースアプリが存在しアクティブ状態 | 有効な sourceAppId, name, description でテンプレートを作成する | テンプレートが作成され、templateId・name・description・sourceAppId・creatorId・createdAt を含む DTO が返る | |
| 操作者がアプリ管理権限を持つ、ソースアプリが存在しアクティブ状態 | description を null にしてテンプレートを作成する | description が null のテンプレートが正常に作成される | |
| 操作者がアプリ管理権限を持つ、ソースアプリが存在しアクティブ状態 | name を1文字で作成する | 正常に作成される（下限境界値） | |
| 操作者がアプリ管理権限を持つ、ソースアプリが存在しアクティブ状態 | name を128文字で作成する | 正常に作成される（上限境界値） | |
| 操作者がアプリ管理権限を持たない | テンプレートを作成する | AppPermissionDeniedError が返る | |
| 操作者がアプリ管理権限を持つ | 存在しない sourceAppId を指定して作成する | AppNotFoundError が返る | |
| 操作者がアプリ管理権限を持つ、ソースアプリが DELETED 状態 | テンプレートを作成する | ビジネスルール違反エラーが返る | |
| 操作者がアプリ管理権限を持つ、ソースアプリが存在しアクティブ状態 | name を空文字で作成する | EmptyAppTemplateNameError が返る | |
| 操作者がアプリ管理権限を持つ、ソースアプリが存在しアクティブ状態 | name を129文字で作成する | AppTemplateNameTooLongError が返る | |
