# プラグイン読み込み テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 操作者がシステム管理権限を持つ | 有効なプラグインファイル（50MB以下）を読み込む | プラグインが登録され、pluginId・name・description・isActive・isPreinstalled・createdAt・updatedAt を含む DTO が返る | |
| 操作者が cybozu.com 共通管理者である（systemAdmin 権限なし） | プラグインファイルを読み込む | cybozu.com 共通管理者でも読み込み可能で、DTO が返る | |
| 操作者がシステム管理権限を持つ | description が含まれるプラグインファイルを読み込む | description が設定されたプラグインが登録される | |
| 操作者がシステム管理権限を持つ | description が含まれないプラグインファイルを読み込む | description が null のプラグインが登録される | |
| 操作者がシステム管理権限を持たない一般ユーザー | プラグインファイルを読み込む | SystemPermissionDeniedError が返る | |
| 操作者がシステム管理権限を持つ | 不正な形式のファイルを読み込む | PluginImportError が返る | |
| 操作者がシステム管理権限を持つ | 破損したファイルを読み込む | PluginImportError が返る | |
