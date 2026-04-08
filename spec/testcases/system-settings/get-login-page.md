# ログインページ設定の取得 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| login_page 設定が存在する（backgroundImageFileId あり） | ログインページ設定を取得する | title と backgroundImageFileId が正しく返る | |
| login_page 設定が存在する（backgroundImageFileId が null） | ログインページ設定を取得する | title が正しく返り、backgroundImageFileId が null で返る | |
| login_page 設定が存在しない | ログインページ設定を取得する | SettingNotFoundError が返る | |
