# ゲストユーザー認証設定の取得 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| guest_auth 設定が存在する（twoFactorEnabled: true） | ゲストユーザー認証設定を取得する | twoFactorEnabled が true で返る | |
| guest_auth 設定が存在する（twoFactorEnabled: false） | ゲストユーザー認証設定を取得する | twoFactorEnabled が false で返る | |
| guest_auth 設定が存在しない | ゲストユーザー認証設定を取得する | SettingNotFoundError が返る | |
