# メール通知設定変更 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 操作者の通知設定が存在し、emailEnabled=false | emailEnabled=true に変更する | メール通知が有効になる | |
| 操作者の通知設定が存在し、emailEnabled=true | emailEnabled=false に変更する | メール通知が無効になる | |
| 操作者の通知設定が存在し、emailEnabled=true | emailScope="ALL" に変更する | メール通知の対象範囲が全通知に変更される | |
| 操作者の通知設定が存在し、emailEnabled=true | emailScope="MENTION_ONLY" に変更する | メール通知の対象範囲がメンションのみに変更される | |
| 操作者の通知設定が存在し、emailEnabled=true | emailFormat="TEXT" に変更する | メール通知のフォーマットがテキストに変更される | |
| 操作者の通知設定が存在し、emailEnabled=true | emailFormat="HTML" に変更する | メール通知のフォーマットが HTML に変更される | |
| 操作者の通知設定が存在する | 複数フィールドを同時に変更する | 指定された全フィールドが更新される（即時反映） | |
| 操作者の通知設定が存在しない | メール通知設定変更を試みる | PreferenceNotFoundError が返る | |
| 操作者の通知設定が存在し、emailEnabled=false | emailScope を変更する | EmailNotEnabledError が返る | |
| 操作者の通知設定が存在し、emailEnabled=false | emailFormat を変更する | EmailNotEnabledError が返る | |
| 操作者の通知設定が存在する | 何もフィールドを指定せずに更新する | 変更なしで現在の設定がそのまま返る | |
