# スマートフォン表示設定の取得 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| mobile_display 設定が存在する（displayMode: "MOBILE"） | スマートフォン表示設定を取得する | displayMode が "MOBILE"、allowUserToggle が正しく返る | |
| mobile_display 設定が存在する（displayMode: "PC"） | スマートフォン表示設定を取得する | displayMode が "PC"、allowUserToggle が正しく返る | |
| mobile_display 設定が存在しない | スマートフォン表示設定を取得する | SettingNotFoundError が返る | |
