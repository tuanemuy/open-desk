# SCIM ユーザーの更新 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| プロビジョニングが有効でトークンが正しく、SCIM ユーザーが存在する | displayName を新しい値に変更して更新する | ユーザーの displayName が更新され、id・externalId・userName・displayName・email・active・updatedAt が返却される | |
| プロビジョニングが有効でトークンが正しく、SCIM ユーザーが存在する | email を新しい値に変更して更新する | ユーザーの email が更新される | |
| プロビジョニングが有効でトークンが正しく、SCIM ユーザーが存在する | displayName と email を同時に変更して更新する | 両方のフィールドが更新される | |
| プロビジョニングが有効でトークンが正しく、SCIM ユーザーが存在する | displayName・email どちらも省略して更新する | ユーザーの属性は変更されず、現在の状態が返却される | |
| - | bearerToken を空文字で送信する | バリデーションエラーが返される | |
| - | externalId を空文字で送信する | バリデーションエラーが返される | |
| - | displayName を空文字で送信する（指定時） | ScimValidationError が返される | |
| - | email にメールアドレス形式でない文字列を送信する（指定時） | ScimValidationError が返される | |
| プロビジョニングが無効 | SCIM ユーザーを更新する | ProvisioningDisabledError が返される | |
| プロビジョニングが有効だがトークンが不正 | SCIM ユーザーを更新する | InvalidBearerTokenError が返される | |
| 指定した externalId に対応するマッピングが存在しない | SCIM ユーザーを更新する | ScimResourceNotFoundError が返される | |
| externalId のマッピングは存在するが、マッピング先のユーザーが存在しない | SCIM ユーザーを更新する | ScimResourceNotFoundError が返される | |
| 変更後の email が既に他のユーザーに使用されている | その email で SCIM ユーザーを更新する | ScimConflictError が返される | |
