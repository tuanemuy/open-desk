# SCIM グループの作成 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| プロビジョニングが有効でトークンが正しい | 必須フィールドを指定して SCIM グループを作成する | グループが作成され、id・externalId・displayName・memberCount・createdAt が返却される | |
| プロビジョニングが有効でトークンが正しい | memberExternalIds を省略して作成する | メンバーなし（memberCount=0）でグループが作成される | |
| プロビジョニングが有効でトークンが正しく、ユーザーの外部マッピングが存在する | memberExternalIds に有効なユーザーの externalId を指定して作成する | グループが作成され、指定されたユーザーがメンバーとして追加される | |
| プロビジョニングが有効でトークンが正しい | memberExternalIds に存在しない externalId を含めて作成する | グループは作成され、存在しないメンバーはスキップされる（部分的な成功を許容） | |
| プロビジョニングが有効でトークンが正しい | memberExternalIds に有効・無効混在の externalId を指定して作成する | グループが作成され、有効なユーザーのみメンバーとして追加される | |
| - | bearerToken を空文字で送信する | バリデーションエラーが返される | |
| - | externalId を空文字で送信する | バリデーションエラーが返される | |
| - | displayName を空文字で送信する | ScimValidationError が返される | |
| プロビジョニングが無効 | SCIM グループを作成する | ProvisioningDisabledError が返される | |
| プロビジョニングが有効だがトークンが不正 | SCIM グループを作成する | InvalidBearerTokenError が返される | |
| 同一の externalId に対応するマッピングが既に存在する（resourceType="Group"） | 同じ externalId で SCIM グループを作成する | ScimConflictError が返される | |
| displayName から生成されるグループコードが既に使用されている | そのグループコードと衝突する displayName で作成する | ScimConflictError が返される | |
| プロビジョニングが有効でトークンが正しい | SCIM グループを作成する | 外部マッピング（externalId, resourceType="Group", internalId=groupId）が作成される | |
