# SCIM ユーザーの作成 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| プロビジョニングが有効でトークンが正しい | 必須フィールドすべてを正しく指定して SCIM ユーザーを作成する | ユーザーが作成され、id・externalId・userName・displayName・email・active=true・createdAt が返却される | |
| プロビジョニングが有効でトークンが正しい | active=false を指定して作成する | active=false でユーザーが作成される | |
| プロビジョニングが有効でトークンが正しい | active を省略して作成する | active=true（デフォルト値）でユーザーが作成される | |
| - | bearerToken を空文字で送信する | バリデーションエラーが返される | |
| - | externalId を空文字で送信する | バリデーションエラーが返される | |
| - | userName を空文字で送信する | ScimValidationError が返される | |
| - | userName にメールアドレス形式でない文字列を送信する | ScimValidationError が返される | |
| - | displayName を空文字で送信する | ScimValidationError が返される | |
| - | email を空文字で送信する | ScimValidationError が返される | |
| - | email にメールアドレス形式でない文字列を送信する | ScimValidationError が返される | |
| プロビジョニングが無効 | SCIM ユーザーを作成する | ProvisioningDisabledError が返される | |
| プロビジョニングが有効だがトークンが不正 | SCIM ユーザーを作成する | InvalidBearerTokenError が返される | |
| 同一の externalId に対応するマッピングが既に存在する（resourceType="User"） | 同じ externalId で SCIM ユーザーを作成する | ScimConflictError が返される | |
| 同一の userName（ログイン名）を持つユーザーが既に存在する | その userName で SCIM ユーザーを作成する | ScimConflictError が返される | |
| 同一の email を持つユーザーが既に存在する | その email で SCIM ユーザーを作成する | ScimConflictError が返される | |
| プロビジョニングが有効でトークンが正しい | SCIM ユーザーを作成する | 外部マッピング（externalId, resourceType="User", internalId=userId）が作成される | |
| プロビジョニングが有効でトークンが正しい | SCIM ユーザーを作成する | ランダムなパスワードが生成・ハッシュ化されて永続化される | |
