# ステータス投稿 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 有効な authorId が存在する | 有効な content・mentions・attachmentFileKeys でステータスを投稿する | 投稿が作成され、メンション先に通知が送信され、作成後の DTO が返る | |
| 有効な authorId が存在する | content のみ（mentions 空配列、attachmentFileKeys 空配列）で投稿する | 投稿が作成され、通知は送信されず、作成後の DTO が返る | |
| 有効な authorId が存在する | メンションを含む content で投稿する | 投稿が作成され、メンション先のユーザーに通知が送信される | |
| 有効な authorId が存在する | 添付ファイル付きで投稿する | 投稿が作成され、attachmentFileKeys に指定したファイルキーが含まれる | |
| 有効な authorId が存在する | content を空文字で投稿する | EmptyPostContentError が返る | |
| 有効な authorId が存在する | mentions に type が "user" のメンションを含めて投稿する | 正常に投稿が作成される | |
| 有効な authorId が存在する | mentions に type が "group" のメンションを含めて投稿する | 正常に投稿が作成される | |
| 有効な authorId が存在する | mentions に type が "organization" のメンションを含めて投稿する | 正常に投稿が作成される | |
| 有効な authorId が存在する | 複数のメンションと複数の添付ファイルを含めて投稿する | 正常に投稿が作成され、すべてのメンション・添付ファイルが反映される | |
