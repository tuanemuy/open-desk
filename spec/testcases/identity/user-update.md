# ユーザー更新（プロフィール編集） テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 認証済みユーザーが存在する | displayName・timezone・language をすべて正しく指定して更新する | プロフィールが更新され、userId・displayName・timezone・language・updatedAt が返却される | |
| 認証済みユーザーが存在する | displayName のみ変更して更新する | displayName が変更される | |
| - | userId を空文字で送信する | バリデーションエラーが返される | |
| - | userId に UUID v4 形式でない文字列を送信する | バリデーションエラーが返される | |
| - | displayName を空文字で送信する | EmptyDisplayNameError が返される | |
| - | timezone に無効な IANA タイムゾーン識別子を送信する | バリデーションエラーが返される | |
| - | language にサポート対象外の言語コード（例: "de"）を送信する | バリデーションエラーが返される | |
| 指定した userId のユーザーが存在しない | プロフィール更新を実行する | UserNotFoundError が返される | |
| 認証済みユーザーが存在する | timezone を "UTC" に変更する | timezone が "UTC" に更新される | |
| 認証済みユーザーが存在する | language を "en" に変更する | language が "en" に更新される | |
