# アクセス制限設定の取得 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| access_restriction 設定が存在する（IP 制限有効、Basic 認証有効） | アクセス制限設定を取得する | ipRestrictionEnabled, allowedIps, basicAuthEnabled, basicAuthUsername が正しく返る | |
| access_restriction 設定が存在する（IP 制限無効、Basic 認証無効） | アクセス制限設定を取得する | ipRestrictionEnabled が false、basicAuthEnabled が false で返る | |
| access_restriction 設定が存在する（Basic 認証有効） | アクセス制限設定を取得する | basicAuthPasswordHash は出力 DTO に含まれない | |
| access_restriction 設定が存在する（allowedIps が複数件） | アクセス制限設定を取得する | allowedIps に全エントリが含まれて返る | |
| access_restriction 設定が存在する（allowedIps が空配列） | アクセス制限設定を取得する | allowedIps が空配列で返る | |
| access_restriction 設定が存在しない | アクセス制限設定を取得する | SettingNotFoundError が返る | |
