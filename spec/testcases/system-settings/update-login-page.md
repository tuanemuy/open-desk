# ログインページ設定の更新 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| login_page 設定が存在する | 有効な title と backgroundImageFileId で更新する | 正常に更新され、更新後の DTO が返る | |
| login_page 設定が存在する | title を有効な値、backgroundImageFileId を null にして更新する | 正常に更新され、backgroundImageFileId が null で返る | |
| login_page 設定が存在する | title を空文字で更新する | InvalidSettingValueError が返る | |
| login_page 設定が存在しない | 有効な値で更新する | SettingNotFoundError が返る | |
