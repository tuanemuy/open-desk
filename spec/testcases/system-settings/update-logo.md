# ロゴ設定の更新 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| logo 設定が存在する | 有効な imageFileId と linkUrl で更新する | 正常に更新され、更新後の DTO が返る | |
| logo 設定が存在する | imageFileId を null にして linkUrl を有効な値で更新する | 正常に更新され、imageFileId が null で返る | |
| logo 設定が存在する | linkUrl を空文字で更新する | InvalidSettingValueError が返る | |
| logo 設定が存在しない | 有効な値で更新する | SettingNotFoundError が返る | |
