# SCIM ユーザーの無効化 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| プロビジョニングが有効でトークンが正しく、SCIM ユーザーが有効状態（active=true） | SCIM ユーザーを無効化する | ユーザーが無効化され、id・externalId・active=false・updatedAt が返却される | |
| プロビジョニングが有効でトークンが正しく、SCIM ユーザーが有効状態でセッションを持つ | SCIM ユーザーを無効化する | ユーザーの全セッションが強制終了される | |
| - | bearerToken を空文字で送信する | バリデーションエラーが返される | |
| - | externalId を空文字で送信する | バリデーションエラーが返される | |
| プロビジョニングが無効 | SCIM ユーザーを無効化する | ProvisioningDisabledError が返される | |
| プロビジョニングが有効だがトークンが不正 | SCIM ユーザーを無効化する | InvalidBearerTokenError が返される | |
| 指定した externalId に対応するマッピングが存在しない | SCIM ユーザーを無効化する | ScimResourceNotFoundError が返される | |
| externalId のマッピングは存在するが、マッピング先のユーザーが存在しない | SCIM ユーザーを無効化する | ScimResourceNotFoundError が返される | |
| SCIM ユーザーが既に無効状態（active=false） | SCIM ユーザーを無効化する | AlreadyInactiveError が返される | |
