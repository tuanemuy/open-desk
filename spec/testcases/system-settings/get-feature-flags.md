# 利用する機能の取得 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| feature_flags 設定が存在する（全機能有効） | 機能選択設定を取得する | emailNotification, space, guestSpace, peopleAndMessage, usageDashboard の各フィールドが正しく返る | |
| feature_flags 設定が存在する（全機能無効） | 機能選択設定を取得する | 各機能の enabled が false で返る | |
| feature_flags 設定が存在する | 機能選択設定を取得する | emailNotification の詳細設定（defaultReceive, format, allowUserFormatChange, notifyRestApi）が正しく返る | |
| feature_flags 設定が存在しない | 機能選択設定を取得する | SettingNotFoundError が返る | |
