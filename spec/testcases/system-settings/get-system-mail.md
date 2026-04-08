# システムメール設定の取得 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| system_mail 設定が存在する（serverType: "BUILTIN"） | システムメール設定を取得する | fromAddress, serverType が正しく返り、externalServer が null で返る | |
| system_mail 設定が存在する（serverType: "EXTERNAL"） | システムメール設定を取得する | fromAddress, serverType, externalServer が正しく返る | |
| system_mail 設定が存在しない | システムメール設定を取得する | SettingNotFoundError が返る | |
