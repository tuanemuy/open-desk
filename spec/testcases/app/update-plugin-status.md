# プラグインステータス変更 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 操作者がシステム管理権限を持つ、有効（isActive: true）なプラグインが存在する（プリインストール済みでない） | isActive を false に変更する | プラグインが無効化され、isActive: false の DTO が返る | |
| 操作者がシステム管理権限を持つ、無効（isActive: false）なプラグインが存在する | isActive を true に変更する | プラグインが有効化され、isActive: true の DTO が返る | |
| 操作者が cybozu.com 共通管理者である（systemAdmin 権限なし）、プラグインが存在する | ステータスを変更する | cybozu.com 共通管理者でも変更可能で、DTO が返る | |
| 操作者がシステム管理権限を持つ、既に有効なプラグインが存在する | isActive を true に変更する（変更なし） | 正常に処理され、isActive: true の DTO が返る | |
| 操作者がシステム管理権限を持つ、既に無効なプラグインが存在する | isActive を false に変更する（変更なし） | 正常に処理され、isActive: false の DTO が返る | |
| 操作者がシステム管理権限を持たない一般ユーザー | プラグインのステータスを変更する | SystemPermissionDeniedError が返る | |
| 操作者がシステム管理権限を持つ | 存在しない pluginId を指定してステータスを変更する | PluginNotFoundError が返る | |
| 操作者がシステム管理権限を持つ、プリインストール済みプラグイン（isPreinstalled: true）が存在する | isActive を false に変更する | PreinstalledPluginError が返る | |
| 操作者がシステム管理権限を持つ、プリインストール済みプラグインが存在する | isActive を true に変更する | プリインストール済みでも有効化は可能で、DTO が返る | |
