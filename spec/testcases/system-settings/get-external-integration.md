# その他の設定（外部連携）の取得 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| external_integration 設定が存在する | 外部連携設定を取得する | allowIframe, referrerPolicySameOrigin, allowWebhook が正しく返る | |
| external_integration 設定が存在しない | 外部連携設定を取得する | SettingNotFoundError が返る | |
