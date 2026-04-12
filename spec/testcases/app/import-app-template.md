# アプリテンプレートファイル読み込み テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 操作者がアプリ作成権限（appCreate）を持つ | 有効なテンプレートファイルと name を指定して読み込む | テンプレートが登録され、templateId・name・description・sourceAppId・creatorId・createdAt を含む DTO が返る | |
| 操作者がアプリ作成権限を持つ | name を1文字で読み込む | 正常に登録される（下限境界値） | |
| 操作者がアプリ作成権限を持つ | name を128文字で読み込む | 正常に登録される（上限境界値） | |
| 操作者がアプリ作成権限を持たない一般ユーザー | テンプレートファイルを読み込む | SystemPermissionDeniedError が返る | |
| 操作者がアプリ作成権限を持つ | name を空文字で読み込む | EmptyAppTemplateNameError が返る | |
| 操作者がアプリ作成権限を持つ | name を129文字で読み込む | AppTemplateNameTooLongError が返る | |
| 操作者がアプリ作成権限を持つ | 不正な形式のファイルを指定して読み込む | AppTemplateImportError が返る | |
| 操作者がアプリ作成権限を持つ | 破損したファイルを指定して読み込む | AppTemplateImportError が返る | |
