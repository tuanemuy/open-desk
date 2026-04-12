# スマートフォン表示設定の更新 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| mobile_display 設定が存在する | displayMode を "MOBILE"、allowUserToggle を true で更新する | 正常に更新され、更新後の DTO が返る | |
| mobile_display 設定が存在する | displayMode を "PC"、allowUserToggle を false で更新する | 正常に更新される | |
| mobile_display 設定が存在する | displayMode に不正な値を指定して更新する | InvalidSettingValueError が返る | |
| mobile_display 設定が存在しない | 有効な値で更新する | SettingNotFoundError が返る | |
