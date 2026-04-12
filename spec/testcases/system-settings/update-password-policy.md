# パスワードポリシーの更新 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| password_policy 設定が存在する | 全フィールドに有効な値を指定して更新する | パスワードポリシーが更新され、更新後の DTO が返る | |
| password_policy 設定が存在する | userMinLength を 3（最小値）で更新する | 正常に更新され、userMinLength が 3 で返る | |
| password_policy 設定が存在する | userMinLength を 15（最大値）で更新する | 正常に更新され、userMinLength が 15 で返る | |
| password_policy 設定が存在する | userMinLength を 2（下限未満）で更新する | PasswordPolicyOutOfRangeError が返る | |
| password_policy 設定が存在する | userMinLength を 16（上限超過）で更新する | PasswordPolicyOutOfRangeError が返る | |
| password_policy 設定が存在する | adminMinLength を 3（最小値）で更新する | 正常に更新され、adminMinLength が 3 で返る | |
| password_policy 設定が存在する | adminMinLength を 15（最大値）で更新する | 正常に更新され、adminMinLength が 15 で返る | |
| password_policy 設定が存在する | adminMinLength を 2（下限未満）で更新する | PasswordPolicyOutOfRangeError が返る | |
| password_policy 設定が存在する | adminMinLength を 16（上限超過）で更新する | PasswordPolicyOutOfRangeError が返る | |
| password_policy 設定が存在する | historyCount を 0（最小値）で更新する | 正常に更新され、historyCount が 0 で返る | |
| password_policy 設定が存在する | historyCount を 15（最大値）で更新する | 正常に更新され、historyCount が 15 で返る | |
| password_policy 設定が存在する | historyCount を -1（下限未満）で更新する | PasswordPolicyOutOfRangeError が返る | |
| password_policy 設定が存在する | historyCount を 16（上限超過）で更新する | PasswordPolicyOutOfRangeError が返る | |
| password_policy 設定が存在する | complexity を "NONE" で更新する | 正常に更新され、complexity が "NONE" で返る | |
| password_policy 設定が存在する | complexity を "ALPHANUMERIC" で更新する | 正常に更新され、complexity が "ALPHANUMERIC" で返る | |
| password_policy 設定が存在する | complexity を "ALPHANUMERIC_SPECIAL" で更新する | 正常に更新され、complexity が "ALPHANUMERIC_SPECIAL" で返る | |
| password_policy 設定が存在する | expirationDays を null（無期限）で更新する | 正常に更新され、expirationDays が null で返る | |
| password_policy 設定が存在する | expirationDays を正の整数（例: 90）で更新する | 正常に更新され、expirationDays が 90 で返る | |
| password_policy 設定が存在する | allowSameAsLoginName を true で更新する | 正常に更新される | |
| password_policy 設定が存在する | allowSameAsLoginName を false で更新する | 正常に更新される | |
| password_policy 設定が存在しない | 有効な値で更新する | SettingNotFoundError が返る | |
