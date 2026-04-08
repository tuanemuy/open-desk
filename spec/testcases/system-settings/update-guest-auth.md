# ゲストユーザー認証設定の更新 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| guest_auth 設定が存在する | twoFactorEnabled を true にして更新する | 設定が更新され、twoFactorEnabled が true で返る | |
| guest_auth 設定が存在する | twoFactorEnabled を false にして更新する | 設定が更新され、twoFactorEnabled が false で返る | |
| guest_auth 設定が存在しない | twoFactorEnabled を true で更新する | SettingNotFoundError が返る | |
