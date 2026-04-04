# ユーザー作成 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| システム管理者が認証済み | 必須フィールドすべてを正しく指定してユーザーを作成する | ユーザーが作成され、userId・loginName・displayName・email・timezone・language・isActive=true・createdAt が返却される | |
| システム管理者が認証済み | timezone・language を省略してユーザーを作成する | timezone が "Asia/Tokyo"、language が "ja" で作成される | |
| システム管理者が認証済み | timezone を "America/New_York"、language を "en" に指定して作成する | 指定した timezone と language で作成される | |
| - | loginName を空文字で送信する | バリデーションエラーが返される | |
| - | loginName にメールアドレス形式でない文字列を送信する | バリデーションエラーが返される | |
| - | displayName を空文字で送信する | バリデーションエラーが返される | |
| - | email を空文字で送信する | バリデーションエラーが返される | |
| - | email にメールアドレス形式でない文字列を送信する | バリデーションエラーが返される | |
| - | password がパスワードポリシーを満たさない文字列を送信する | バリデーションエラーが返される | |
| - | timezone に無効な IANA タイムゾーン識別子を送信する | バリデーションエラーが返される | |
| - | language にサポート対象外の言語コード（例: "fr"）を送信する | バリデーションエラーが返される | |
| 同一の loginName を持つユーザーが既に存在する | 同じ loginName でユーザーを作成する | DuplicateLoginNameError が返される | |
| 同一の email を持つユーザーが既に存在する | 同じ email でユーザーを作成する | DuplicateEmailError が返される | |
| - | language に "zh-CN" を指定して作成する | language が "zh-CN" で作成される | |
| - | language に "zh-TW" を指定して作成する | language が "zh-TW" で作成される | |
| - | language に "es" を指定して作成する | language が "es" で作成される | |
| - | language に "pt-BR" を指定して作成する | language が "pt-BR" で作成される | |
| - | language に "th" を指定して作成する | language が "th" で作成される | |
