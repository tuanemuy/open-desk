# SAML 認証設定の更新 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| saml_auth 設定が存在する | enabled を true にして更新する | 設定が更新され、enabled が true で返る | |
| saml_auth 設定が存在する | enabled を false にして更新する | 設定が更新され、enabled が false で返る | |
| saml_auth 設定が存在しない | enabled を true で更新する | SettingNotFoundError が返る | |
