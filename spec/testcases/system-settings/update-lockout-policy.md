# ロックアウトポリシーの更新 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| lockout_policy 設定が存在する | 全フィールドに有効な値を指定して更新する | ロックアウトポリシーが更新され、更新後の DTO が返る | |
| lockout_policy 設定が存在する | maxFailedAttempts を 3（最小値）で更新する | 正常に更新され、maxFailedAttempts が 3 で返る | |
| lockout_policy 設定が存在する | maxFailedAttempts を 10（最大値）で更新する | 正常に更新され、maxFailedAttempts が 10 で返る | |
| lockout_policy 設定が存在する | maxFailedAttempts を null（ロックアウトしない）で更新する | 正常に更新され、maxFailedAttempts が null で返る | |
| lockout_policy 設定が存在する | maxFailedAttempts を 2（下限未満）で更新する | InvalidSettingValueError が返る | |
| lockout_policy 設定が存在する | maxFailedAttempts を 11（上限超過）で更新する | InvalidSettingValueError が返る | |
| lockout_policy 設定が存在する | lockoutDurationMinutes を 3 で更新する | 正常に更新される | |
| lockout_policy 設定が存在する | lockoutDurationMinutes を 15 で更新する | 正常に更新される | |
| lockout_policy 設定が存在する | lockoutDurationMinutes を 30 で更新する | 正常に更新される | |
| lockout_policy 設定が存在する | lockoutDurationMinutes を 60 で更新する | 正常に更新される | |
| lockout_policy 設定が存在する | lockoutDurationMinutes を null（自動解除しない）で更新する | 正常に更新される | |
| lockout_policy 設定が存在する | lockoutDurationMinutes を 10（許可値以外）で更新する | InvalidSettingValueError が返る | |
| lockout_policy 設定が存在する | lockoutDurationMinutes を 0（許可値以外）で更新する | InvalidSettingValueError が返る | |
| lockout_policy 設定が存在する | failedLoginMessage に有効な言語コードとメッセージを指定して更新する | 正常に更新される | |
| lockout_policy 設定が存在しない | 有効な値で更新する | SettingNotFoundError が返る | |
