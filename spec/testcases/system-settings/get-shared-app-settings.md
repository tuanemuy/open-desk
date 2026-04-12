# アプリの共通設定の取得 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| shared_app_settings 設定が存在する | アプリの共通設定を取得する | prohibitEveryoneAdmin が正しく返る | |
| shared_app_settings 設定が存在しない | アプリの共通設定を取得する | SettingNotFoundError が返る | |
