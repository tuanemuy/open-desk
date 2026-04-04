# 通知設定取得 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 操作者の通知設定が存在する | 通知設定を取得する | emailEnabled, emailScope, emailFormat, desktopEnabled が返る | |
| 操作者の通知設定がデフォルト値で初期化済み | 通知設定を取得する | emailEnabled=true, emailScope=MENTION_ONLY, emailFormat=HTML, desktopEnabled=false が返る | |
| 操作者の通知設定がカスタマイズ済み | 通知設定を取得する | カスタマイズされた設定値が正しく返る | |
| 操作者の通知設定が存在しない（通常発生しない） | 通知設定取得を試みる | PreferenceNotFoundError が返る | |
