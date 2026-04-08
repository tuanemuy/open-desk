# アップデートオプションの更新 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| update_option 設定が存在する | channel を "LATEST" にして有効な値で更新する | 正常に更新され、更新後の DTO が返る | |
| update_option 設定が存在する | channel を "MONTHLY" にして更新する | 正常に更新される | |
| update_option 設定が存在する | channel に不正な値を指定して更新する | InvalidSettingValueError が返る | |
| update_option 設定が存在しない | 有効な値で更新する | SettingNotFoundError が返る | |
