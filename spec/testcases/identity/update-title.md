# 役職の更新 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 役職が存在する | name を新しい値に変更して役職を更新する | 役職が更新され、titleId・name・orderIndex・updatedAt が返却される | |
| - | titleId を空文字で送信する | バリデーションエラーが返される | |
| - | titleId に UUID 形式でない文字列を送信する | バリデーションエラーが返される | |
| - | name を空文字で送信する | EmptyTitleNameError が返される | |
| 指定した titleId の役職が存在しない | 役職を更新する | TitleNotFoundError が返される | |
| 他の役職が同じ name を持っている | その name に変更して役職を更新する | DuplicateTitleNameError が返される | |
| 役職が存在する | 現在と同じ name で更新する | 正常に更新される（updatedAt が更新される） | |
