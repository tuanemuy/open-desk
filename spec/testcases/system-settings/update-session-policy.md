# セッションポリシーの更新 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| session_policy 設定が存在する | 全フィールドに有効な値を指定して更新する | セッションポリシーが更新され、更新後の DTO が返る | |
| session_policy 設定が存在する | sessionLifetimeMinutes を 1（最小の正の整数）で更新する | 正常に更新される | |
| session_policy 設定が存在する | sessionLifetimeMinutes を 0 で更新する | InvalidSettingValueError が返る | |
| session_policy 設定が存在する | sessionLifetimeMinutes を -1（負の値）で更新する | InvalidSettingValueError が返る | |
| session_policy 設定が存在する | allowAutoLogin を true、autoLoginExpiration を "1_DAY" で更新する | 正常に更新され、autoLoginExpiration が "1_DAY" で返る | |
| session_policy 設定が存在する | allowAutoLogin を true、autoLoginExpiration を "1_WEEK" で更新する | 正常に更新され、autoLoginExpiration が "1_WEEK" で返る | |
| session_policy 設定が存在する | allowAutoLogin を true、autoLoginExpiration を "1_MONTH" で更新する | 正常に更新され、autoLoginExpiration が "1_MONTH" で返る | |
| session_policy 設定が存在する | allowAutoLogin を true、autoLoginExpiration を不正な値で更新する | InvalidSettingValueError が返る | |
| session_policy 設定が存在する | allowAutoLogin を true、autoLoginExpiration を null で更新する | InvalidSettingValueError が返る | |
| session_policy 設定が存在する | allowAutoLogin を false、autoLoginExpiration を "1_DAY" で更新する | autoLoginExpiration が null に強制され、正常に更新される | |
| session_policy 設定が存在する | allowAutoLogin を false、autoLoginExpiration を null で更新する | 正常に更新される | |
| session_policy 設定が存在する | allowAutoComplete, allowBrowserSave, allowMismatchedApiAuth を各 true/false で更新する | 正常に更新される | |
| session_policy 設定が存在しない | 有効な値で更新する | SettingNotFoundError が返る | |
