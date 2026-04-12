# 組織間アクセス権追加 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 操作者が cybozu.com 共通管理者である、ソース組織とターゲット組織が存在する、同一組み合わせのルールが未登録 | accessLevel: FULL, isEnabled: true で組織間アクセス権を追加する | 組織間アクセス権が作成され、orgAccessRuleId・sourceOrganizationId・targetOrganizationId・accessLevel・isEnabled・createdAt・updatedAt を含む DTO が返る | |
| 操作者が cybozu.com 共通管理者である、ソース組織とターゲット組織が存在する | accessLevel: READ_ONLY で追加する | accessLevel が READ_ONLY のルールが作成される | |
| 操作者が cybozu.com 共通管理者である、ソース組織とターゲット組織が存在する | accessLevel: NONE で追加する | accessLevel が NONE のルールが作成される | |
| 操作者が cybozu.com 共通管理者である、ソース組織とターゲット組織が存在する | isEnabled: false で追加する | isEnabled が false のルールが作成される | |
| 操作者が cybozu.com 共通管理者である、A→B のルールが存在する | B→A のルールを追加する | 逆方向は別ルールとして正常に追加される | |
| 操作者が cybozu.com 共通管理者でない | 組織間アクセス権を追加する | CybozuAdminRequiredError が返る | |
| 操作者が cybozu.com 共通管理者である | sourceOrganizationId と targetOrganizationId に同一の組織 ID を指定する | SelfReferenceOrgAccessError が返る | |
| 操作者が cybozu.com 共通管理者である | 存在しない sourceOrganizationId を指定して追加する | OrgAccessOrganizationNotFoundError が返る | |
| 操作者が cybozu.com 共通管理者である、ソース組織が存在する | 存在しない targetOrganizationId を指定して追加する | OrgAccessOrganizationNotFoundError が返る | |
| 操作者が cybozu.com 共通管理者である、同一の sourceOrganizationId・targetOrganizationId のルールが既に存在する | 同じ組み合わせで組織間アクセス権を追加する | DuplicateOrgAccessRuleError が返る | |
