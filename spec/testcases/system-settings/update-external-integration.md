# その他の設定（外部連携）の更新 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| external_integration 設定が存在する | allowIframe, referrerPolicySameOrigin, allowWebhook を各 true/false で更新する | 正常に更新され、更新後の DTO が返る | |
| external_integration 設定が存在しない | 有効な値で更新する | SettingNotFoundError が返る | |
