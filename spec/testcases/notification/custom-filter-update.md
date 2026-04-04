# カスタムフィルタ更新 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 操作者が所有するカスタムフィルタが存在する | name を変更する | フィルタ名が更新される | |
| 操作者が所有するカスタムフィルタが存在する | notificationType を変更する | 通知種別が更新される | |
| 操作者が所有するカスタムフィルタが存在する | locationMode と locationConditions を変更する | 場所条件が更新される | |
| 操作者が所有するカスタムフィルタが存在する | senderConditions を変更する | 送信者条件が更新される | |
| 操作者が所有するカスタムフィルタが存在する | 複数フィールドを同時に変更する | 指定された全フィールドが更新される | |
| 存在しない filterId を指定する | カスタムフィルタ更新を試みる | FilterNotFoundError が返る | |
| 他ユーザーが所有するフィルタIDを指定する | カスタムフィルタ更新を試みる | FilterAccessDeniedError が返る | |
| ビルトインフィルタのIDを指定する | カスタムフィルタ更新を試みる | CannotModifyBuiltInFilterError が返る | |
| 操作者が所有するカスタムフィルタが存在する | name を空文字に変更する | InvalidFilterNameError が返る | |
| 操作者が所有するカスタムフィルタが存在する | name を101文字に変更する | InvalidFilterNameError が返る | |
| 操作者が所有するカスタムフィルタが存在する | name を100文字に変更する | フィルタ名が正常に更新される（境界値） | |
| 操作者が所有するカスタムフィルタが存在する | name を1文字に変更する | フィルタ名が正常に更新される（境界値） | |
| 操作者が所有するカスタムフィルタが存在する | locationMode="INCLUDE" で locationConditions を空配列にする | EmptyLocationConditionsError が返る | |
| 操作者が所有するカスタムフィルタが存在する | locationMode="EXCLUDE" で locationConditions を空配列にする | EmptyLocationConditionsError が返る | |
| 操作者が所有するカスタムフィルタが存在する | 何もフィールドを指定せずに更新する | 変更なしで現在の設定がそのまま返る | |
