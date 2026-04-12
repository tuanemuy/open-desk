# SCIM グループの更新 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| プロビジョニングが有効でトークンが正しく、SCIM グループが存在する | displayName を新しい値に変更して更新する | グループの displayName が更新され、id・externalId・displayName・memberCount・updatedAt が返却される | |
| プロビジョニングが有効でトークンが正しく、SCIM グループにメンバーA・Bがいる | memberExternalIds に B・C を指定して更新する | メンバーAが削除され、メンバーCが追加される（完全同期） | |
| プロビジョニングが有効でトークンが正しく、SCIM グループにメンバーがいる | memberExternalIds に空配列を指定して更新する | 全メンバーが削除される | |
| プロビジョニングが有効でトークンが正しく、SCIM グループにメンバーがいない | memberExternalIds に新しいユーザーの externalId を指定して更新する | 指定されたユーザーがメンバーとして追加される | |
| プロビジョニングが有効でトークンが正しく、SCIM グループが存在する | displayName と memberExternalIds を同時に変更して更新する | グループ名とメンバー構成の両方が更新される | |
| プロビジョニングが有効でトークンが正しく、SCIM グループが存在する | displayName・memberExternalIds どちらも省略して更新する | グループの属性は変更されず、現在の状態が返却される | |
| プロビジョニングが有効でトークンが正しく、SCIM グループが存在する | memberExternalIds に存在しない externalId を含めて更新する | 存在しないメンバーはスキップされ、有効なメンバーのみで同期される | |
| - | bearerToken を空文字で送信する | バリデーションエラーが返される | |
| - | externalId を空文字で送信する | バリデーションエラーが返される | |
| - | displayName を空文字で送信する（指定時） | ScimValidationError が返される | |
| プロビジョニングが無効 | SCIM グループを更新する | ProvisioningDisabledError が返される | |
| プロビジョニングが有効だがトークンが不正 | SCIM グループを更新する | InvalidBearerTokenError が返される | |
| 指定した externalId に対応するマッピングが存在しない | SCIM グループを更新する | ScimResourceNotFoundError が返される | |
| externalId のマッピングは存在するが、マッピング先のグループが存在しない | SCIM グループを更新する | ScimResourceNotFoundError が返される | |
