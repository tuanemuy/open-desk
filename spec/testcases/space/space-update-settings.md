# スペース設定変更 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 操作者がスペース管理者である | name を有効な値に変更する | スペース名が更新される | |
| 操作者がスペース管理者である | isPrivate を true に変更する | スペースが非公開に変更される | |
| 操作者がスペース管理者である | isPrivate を false に変更する | スペースが公開に変更される | |
| 操作者がスペース管理者、useMultiThread=false | useMultiThread=true に変更する | マルチスレッドが有効になる | |
| 操作者がスペース管理者である | fixedMember を変更する | 固定メンバー設定が更新される | |
| 操作者がスペース管理者である | coverImage を PRESET に変更する | カバー画像が更新される | |
| 操作者がスペース管理者である | coverImage を BLOB に変更する | カバー画像が更新される | |
| 操作者がスペース管理者である | portalDisplay を変更する | ポータル表示設定が更新される | |
| 操作者がスペース管理者である | appCreationPermission を "ADMIN" に変更する | アプリ作成権限が更新される | |
| 操作者がスペース管理者である | 複数のフィールドを同時に変更する | 指定された全フィールドが更新される | |
| 存在しないスペースIDを指定する | 設定変更を試みる | SpaceNotFoundError が返る | |
| 操作者がスペース管理者でない（一般メンバー） | 設定変更を試みる | SpaceAdminRequiredError が返る | |
| 操作者がスペースメンバーでない | 設定変更を試みる | SpaceAdminRequiredError が返る | |
| 操作者がスペース管理者である | name を空文字に変更する | EmptySpaceNameError が返る | |
| 操作者がスペース管理者である | name を129文字に変更する | SpaceNameTooLongError が返る | |
| 操作者がスペース管理者である | name を128文字に変更する | スペース名が正常に更新される（境界値） | |
| 操作者がスペース管理者である | name を1文字に変更する | スペース名が正常に更新される（境界値） | |
| ゲストスペースで操作者がスペース管理者 | isPrivate を false に変更する | GuestSpacePrivacyError が返る | |
| useMultiThread=true のスペースで操作者がスペース管理者 | useMultiThread=true を再度設定する | MultiThreadIrreversibleError が返る（既に有効） | |
| 操作者がスペース管理者である | 不正な coverImage を指定する | InvalidCoverImageError が返る | |
| 操作者がスペース管理者である | 何もフィールドを指定せずに更新する | 変更なしで現在の設定がそのまま返る | |
