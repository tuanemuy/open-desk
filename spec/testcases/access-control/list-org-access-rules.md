# 組織間アクセス権一覧取得 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 操作者が cybozu.com 共通管理者である、組織間アクセス権が複数件存在する | 組織間アクセス権一覧を取得する | 全組織間アクセス権ルール一覧が返る（orgAccessRuleId・sourceOrganizationId・targetOrganizationId・accessLevel・isEnabled・createdAt・updatedAt を含む） | |
| 操作者が cybozu.com 共通管理者である、組織間アクセス権が0件 | 組織間アクセス権一覧を取得する | 空配列が返る | |
| 操作者が cybozu.com 共通管理者である、有効・無効の両方のルールが存在する | 組織間アクセス権一覧を取得する | isEnabled の値が正しく含まれたルール一覧が返る | |
| 操作者が cybozu.com 共通管理者である、各 accessLevel（FULL, READ_ONLY, NONE）のルールが存在する | 組織間アクセス権一覧を取得する | 各 accessLevel のルールがすべて返る | |
| 操作者が cybozu.com 共通管理者でない（システム管理者だが共通管理者でない） | 組織間アクセス権一覧を取得する | CybozuAdminRequiredError が返る | |
| 操作者が一般ユーザー | 組織間アクセス権一覧を取得する | CybozuAdminRequiredError が返る | |
