# 組織間アクセス権更新 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 操作者が cybozu.com 共通管理者である、組織間アクセス権が存在する | accessLevel のみ変更して更新する（FULL → READ_ONLY） | accessLevel が更新された DTO が返る | |
| 操作者が cybozu.com 共通管理者である、組織間アクセス権が存在する | accessLevel を NONE に変更する | accessLevel が NONE に更新された DTO が返る | |
| 操作者が cybozu.com 共通管理者である、組織間アクセス権が存在する（isEnabled: true） | isEnabled を false に変更して更新する | isEnabled が false に更新された DTO が返る | |
| 操作者が cybozu.com 共通管理者である、組織間アクセス権が存在する（isEnabled: false） | isEnabled を true に変更して更新する | isEnabled が true に更新された DTO が返る | |
| 操作者が cybozu.com 共通管理者である、組織間アクセス権が存在する | accessLevel と isEnabled の両方を変更して更新する | 両方が更新された DTO が返る | |
| 操作者が cybozu.com 共通管理者である、組織間アクセス権が存在する | 何も指定せずに更新する | 変更されず、現在のルールの DTO が返る | |
| 操作者が cybozu.com 共通管理者でない | 組織間アクセス権を更新する | CybozuAdminRequiredError が返る | |
| 操作者が cybozu.com 共通管理者である | 存在しない orgAccessRuleId を指定して更新する | OrgAccessRuleNotFoundError が返る | |
