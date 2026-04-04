# カスタムフィルタ作成 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 操作者が認証済みユーザー | 有効な名前・条件でカスタムフィルタを作成する | フィルタが作成され、filterId, name, notificationType, locationMode, locationConditions, senderConditions, createdAt が返る | |
| 操作者が認証済みユーザー | notificationType="ALL" で作成する | 全通知種別を対象とするフィルタが作成される | |
| 操作者が認証済みユーザー | notificationType="MENTION" で作成する | メンション通知のみを対象とするフィルタが作成される | |
| 操作者が認証済みユーザー | locationMode="ALL" で作成する | 全場所を対象とするフィルタが作成される | |
| 操作者が認証済みユーザー | locationMode="INCLUDE", locationConditions を1件以上指定して作成する | 指定場所を含むフィルタが作成される | |
| 操作者が認証済みユーザー | locationMode="EXCLUDE", locationConditions を1件以上指定して作成する | 指定場所を除外するフィルタが作成される | |
| 操作者が認証済みユーザー | senderConditions を1件以上指定して作成する | 送信者条件付きフィルタが作成される | |
| 操作者が認証済みユーザー | senderConditions を空配列で作成する | 全送信者を対象とするフィルタが作成される | |
| 操作者が認証済みユーザー | name を空文字で作成する | InvalidFilterNameError が返る | |
| 操作者が認証済みユーザー | name を101文字で作成する | InvalidFilterNameError が返る | |
| 操作者が認証済みユーザー | name を100文字で作成する | フィルタが正常に作成される（境界値） | |
| 操作者が認証済みユーザー | name を1文字で作成する | フィルタが正常に作成される（境界値） | |
| 操作者が認証済みユーザー | locationMode="INCLUDE" で locationConditions を空配列にする | EmptyLocationConditionsError が返る | |
| 操作者が認証済みユーザー | locationMode="EXCLUDE" で locationConditions を空配列にする | EmptyLocationConditionsError が返る | |
| 操作者が認証済みユーザー | locationMode="ALL" で locationConditions を空配列にする | フィルタが正常に作成される | |
