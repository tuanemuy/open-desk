# ロゴ設定の取得 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| logo 設定が存在する（imageFileId あり） | ロゴ設定を取得する | imageFileId と linkUrl が正しく返る | |
| logo 設定が存在する（imageFileId が null） | ロゴ設定を取得する | imageFileId が null、linkUrl が正しく返る | |
| logo 設定が存在しない | ロゴ設定を取得する | SettingNotFoundError が返る | |
