# アプリの共通設定の更新 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| shared_app_settings 設定が存在する | prohibitEveryoneAdmin を true にして更新する | 正常に更新され、prohibitEveryoneAdmin が true で返る | |
| shared_app_settings 設定が存在する | prohibitEveryoneAdmin を false にして更新する | 正常に更新され、prohibitEveryoneAdmin が false で返る | |
| shared_app_settings 設定が存在しない | 有効な値で更新する | SettingNotFoundError が返る | |
