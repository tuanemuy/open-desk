# 利用する機能の更新 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| feature_flags 設定が存在する | 全機能を有効にして更新する | 全機能が有効化され、更新後の DTO が返る | |
| feature_flags 設定が存在する | 全機能を無効にして更新する | 全機能が無効化され、更新後の DTO が返る | |
| feature_flags 設定が存在する | emailNotification の defaultReceive を "SELF_ONLY" にして更新する | defaultReceive が "SELF_ONLY" で返る | |
| feature_flags 設定が存在する | emailNotification の defaultReceive を "NONE" にして更新する | defaultReceive が "NONE" で返る | |
| feature_flags 設定が存在する | emailNotification の format を "HTML" にして更新する | format が "HTML" で返る | |
| feature_flags 設定が存在する | emailNotification の format を "TEXT" にして更新する | format が "TEXT" で返る | |
| feature_flags 設定が存在する | space.allowStandaloneApp を true にして更新する | allowStandaloneApp が true で返る | |
| feature_flags 設定が存在する | defaultReceive に不正な値を指定して更新する | InvalidSettingValueError が返る | |
| feature_flags 設定が存在する | format に不正な値を指定して更新する | InvalidSettingValueError が返る | |
| feature_flags 設定が存在しない | 有効な値で更新する | SettingNotFoundError が返る | |
