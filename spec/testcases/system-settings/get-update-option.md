# アップデートオプションの取得 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| update_option 設定が存在する | アップデートオプションを取得する | channel, disabledFeatures, disabledLatestOnlyFeatures, earlyAccessFeatures, experimentalFeatures, apiLabFeatures が正しく返る | |
| update_option 設定が存在しない | アップデートオプションを取得する | SettingNotFoundError が返る | |
