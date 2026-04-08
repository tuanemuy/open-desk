# ログインセキュリティ設定の一括取得 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| password_policy, lockout_policy, session_policy, saml_auth, two_factor_auth の全設定が存在する | ログインセキュリティ設定を取得する | passwordPolicy, lockoutPolicy, sessionPolicy, samlAuth, twoFactorAuth の全フィールドが正しく返る | |
| password_policy 設定が存在しない（他は存在する） | ログインセキュリティ設定を取得する | SettingNotFoundError が返る | |
| lockout_policy 設定が存在しない（他は存在する） | ログインセキュリティ設定を取得する | SettingNotFoundError が返る | |
| session_policy 設定が存在しない（他は存在する） | ログインセキュリティ設定を取得する | SettingNotFoundError が返る | |
| saml_auth 設定が存在しない（他は存在する） | ログインセキュリティ設定を取得する | SettingNotFoundError が返る | |
| two_factor_auth 設定が存在しない（他は存在する） | ログインセキュリティ設定を取得する | SettingNotFoundError が返る | |
| 全設定が存在しない | ログインセキュリティ設定を取得する | SettingNotFoundError が返る | |
