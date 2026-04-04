# デスクトップ通知設定変更 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 操作者の通知設定が存在し、desktopEnabled=false | desktopEnabled=true に変更する | デスクトップ通知が有効になる | |
| 操作者の通知設定が存在し、desktopEnabled=true | desktopEnabled=false に変更する | デスクトップ通知が無効になる | |
| 操作者の通知設定が存在し、desktopEnabled=true | desktopEnabled=true に再度設定する | 変更なしで desktopEnabled=true が返る（冪等） | |
| 操作者の通知設定が存在しない | デスクトップ通知設定変更を試みる | PreferenceNotFoundError が返る | |
