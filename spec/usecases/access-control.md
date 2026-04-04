# AccessControl ユースケース定義

## 1. アプリアクセス権の取得

### 概要

アプリ ID を指定してアプリアクセス権設定を取得する。アプリ管理権限（appEditable）が必要。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| appId | AppId | 必須 | 有効な AppId 形式であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| appId | AppId |
| rights | AppAclEntry[] |
| revision | number |

### 処理フロー

1. Identity ドメインのポートから operatorId のユーザーコンテキスト（UserAclContext）を取得する
2. `AppAclRepository.findByAppId(appId)` でアプリアクセス権を取得する
3. `AclEvaluationService.evaluateAppPermission(appAcl, userContext, isAppCreator)` で操作者のアプリ権限を評価する
4. `appEditable` が false の場合は AppPermissionDeniedError を返す
5. アプリアクセス権を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 操作者にアプリ管理権限（appEditable）がない | AppPermissionDeniedError |
| アプリが存在しない | AppNotFoundError |

---

## 2. アプリアクセス権の更新

### 概要

アプリのアクセス権ルールリストを一括更新する。リビジョンチェック付き楽観的ロック。アプリ管理権限が必要。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| appId | AppId | 必須 | 有効な AppId 形式であること |
| rights | AppAclEntry[] | 必須 | 1件以上のエントリを含むこと。各エントリは entity, includeSubs, 各権限フラグを含む |
| revision | number | 任意 | 省略時はリビジョンチェックをスキップ |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| appId | AppId |
| rights | AppAclEntry[] |
| revision | number |

### 処理フロー

1. Identity ドメインのポートから operatorId のユーザーコンテキスト（UserAclContext）を取得する
2. `AppAclRepository.findByAppId(appId)` で現在のアプリアクセス権を取得する
3. `AclEvaluationService.evaluateAppPermission(appAcl, userContext, isAppCreator)` で操作者のアプリ権限を評価する
4. `appEditable` が false の場合は AppPermissionDeniedError を返す
5. `appAcl.checkRevision(revision)` でリビジョンチェックを行う
6. `appAcl.updateRights(rights)` でルールリストを一括置換する（ドメインモデル内で Everyone 末尾移動・権限依存関係検証を実行）
7. `AppAclRepository.save(appAcl)` で永続化する
8. 更新後のアプリアクセス権を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 操作者にアプリ管理権限（appEditable）がない | AppPermissionDeniedError |
| アプリが存在しない | AppNotFoundError |
| リビジョンが一致しない | RevisionConflictError |
| entries が空 | EmptyRightsError（ドメインモデルから発生） |
| 同一エンティティが重複 | DuplicateEntityError（ドメインモデルから発生） |
| 編集/削除権限に閲覧権限がない | PermissionDependencyError（ドメインモデルから発生） |
| インポート権限に追加権限がない | ImportDependencyError（ドメインモデルから発生） |

---

## 3. レコードアクセス権の取得

### 概要

アプリ ID を指定してレコードアクセス権設定を取得する。アプリ管理権限が必要。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| appId | AppId | 必須 | 有効な AppId 形式であること |
| lang | string | 任意 | 言語コード（"ja", "en", "zh" 等）。フィールド名のローカライズに使用 |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| appId | AppId |
| rights | RecordAclRule[] |
| revision | number |

### 処理フロー

1. Identity ドメインのポートから operatorId のユーザーコンテキスト（UserAclContext）を取得する
2. `AppAclRepository.findByAppId(appId)` でアプリアクセス権を取得する
3. `AclEvaluationService.evaluateAppPermission(appAcl, userContext, isAppCreator)` で操作者のアプリ権限を評価する
4. `appEditable` が false の場合は AppPermissionDeniedError を返す
5. `RecordAclRepository.findByAppId(appId)` でレコードアクセス権を取得する
6. lang が指定されている場合、フィールド名をローカライズしてレスポンスに含める
7. レコードアクセス権を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 操作者にアプリ管理権限（appEditable）がない | AppPermissionDeniedError |
| アプリが存在しない | AppNotFoundError |

---

## 4. レコードアクセス権の更新

### 概要

レコードアクセス権のルールリストを一括更新する。filterCond のバリデーション付き。リビジョンチェック付き楽観的ロック。アプリ管理権限が必要。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| appId | AppId | 必須 | 有効な AppId 形式であること |
| rights | RecordAclRule[] | 必須 | 各ルールは filterCond（null 許容）と entities リストを含む |
| revision | number | 任意 | 省略時はリビジョンチェックをスキップ |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| appId | AppId |
| rights | RecordAclRule[] |
| revision | number |

### 処理フロー

1. Identity ドメインのポートから operatorId のユーザーコンテキスト（UserAclContext）を取得する
2. `AppAclRepository.findByAppId(appId)` でアプリアクセス権を取得する
3. `AclEvaluationService.evaluateAppPermission(appAcl, userContext, isAppCreator)` で操作者のアプリ権限を評価する
4. `appEditable` が false の場合は AppPermissionDeniedError を返す
5. `RecordAclRepository.findByAppId(appId)` で現在のレコードアクセス権を取得する
6. `recordAcl.checkRevision(revision)` でリビジョンチェックを行う
7. 各ルールの filterCond に対して `FilterCondValidator.validate(filterCond)` でバリデーションを実行する
8. `recordAcl.updateRights(rights)` でルールリストを一括置換する（ドメインモデル内で Everyone 末尾移動・権限依存関係検証を実行）
9. `RecordAclRepository.save(recordAcl)` で永続化する
10. 更新後のレコードアクセス権を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 操作者にアプリ管理権限（appEditable）がない | AppPermissionDeniedError |
| アプリが存在しない | AppNotFoundError |
| リビジョンが一致しない | RevisionConflictError |
| filterCond が不正（order by, limit, offset 使用、and/or 混在等） | InvalidFilterCondError（ドメインモデルから発生） |
| 編集/削除権限に閲覧権限がない | PermissionDependencyError（ドメインモデルから発生） |
| 同一ルール内にエンティティが重複 | DuplicateEntityInRuleError（ドメインモデルから発生） |

---

## 5. フィールドアクセス権の取得

### 概要

アプリ ID を指定してフィールドアクセス権設定を取得する。アプリ管理権限が必要。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| appId | AppId | 必須 | 有効な AppId 形式であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| appId | AppId |
| rights | FieldAclRule[] |
| revision | number |

### 処理フロー

1. Identity ドメインのポートから operatorId のユーザーコンテキスト（UserAclContext）を取得する
2. `AppAclRepository.findByAppId(appId)` でアプリアクセス権を取得する
3. `AclEvaluationService.evaluateAppPermission(appAcl, userContext, isAppCreator)` で操作者のアプリ権限を評価する
4. `appEditable` が false の場合は AppPermissionDeniedError を返す
5. `FieldAclRepository.findByAppId(appId)` でフィールドアクセス権を取得する
6. フィールドアクセス権を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 操作者にアプリ管理権限（appEditable）がない | AppPermissionDeniedError |
| アプリが存在しない | AppNotFoundError |

---

## 6. フィールドアクセス権の更新

### 概要

フィールドアクセス権のルールリストを一括更新する。リビジョンチェック付き楽観的ロック。アプリ管理権限が必要。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| appId | AppId | 必須 | 有効な AppId 形式であること |
| rights | FieldAclRule[] | 必須 | 各ルールは fieldCode と entities リストを含む。設定不可フィールドを含まないこと |
| revision | number | 任意 | 省略時はリビジョンチェックをスキップ |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| appId | AppId |
| rights | FieldAclRule[] |
| revision | number |

### 処理フロー

1. Identity ドメインのポートから operatorId のユーザーコンテキスト（UserAclContext）を取得する
2. `AppAclRepository.findByAppId(appId)` でアプリアクセス権を取得する
3. `AclEvaluationService.evaluateAppPermission(appAcl, userContext, isAppCreator)` で操作者のアプリ権限を評価する
4. `appEditable` が false の場合は AppPermissionDeniedError を返す
5. `FieldAclRepository.findByAppId(appId)` で現在のフィールドアクセス権を取得する
6. `fieldAcl.checkRevision(revision)` でリビジョンチェックを行う
7. `fieldAcl.updateRights(rights)` でルールリストを一括置換する（ドメインモデル内で Everyone 末尾移動・重複検証を実行）
8. `FieldAclRepository.save(fieldAcl)` で永続化する
9. 更新後のフィールドアクセス権を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 操作者にアプリ管理権限（appEditable）がない | AppPermissionDeniedError |
| アプリが存在しない | AppNotFoundError |
| リビジョンが一致しない | RevisionConflictError |
| 同一フィールドコードのルールが重複 | DuplicateFieldCodeError（ドメインモデルから発生） |
| 同一ルール内にエンティティが重複 | DuplicateEntityInRuleError（ドメインモデルから発生） |

---

## 7. システム権限一覧の取得

### 概要

全システム権限設定を取得する。OpenDesk システム管理権限が必要。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| permissions | SystemPermission[] |

### 処理フロー

1. Identity ドメインのポートから operatorId のユーザーコンテキスト（UserAclContext）を取得する
2. `SystemPermissionRepository.findByUser(userId, userCode, organizationCodes, groupCodes)` で操作者のシステム権限を取得する
3. 取得したシステム権限のいずれかで `hasRight("SYSTEM_ADMIN")` が true であること、または `userContext.isCybozuAdmin` が true であることを検証する
4. 権限がない場合は SystemPermissionDeniedError を返す
5. `SystemPermissionRepository.findAll()` で全システム権限設定を取得する
6. システム権限一覧を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 操作者に OpenDesk システム管理権限がない | SystemPermissionDeniedError |

---

## 8. システム権限の追加

### 概要

ユーザー・組織・グループに対するシステム権限を新規追加する。OpenDesk システム管理権限が必要。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| entity | AclEntity | 必須 | type は USER, GROUP, ORGANIZATION のいずれか。code は空文字でないこと |
| includeSubs | boolean | 必須 | ORGANIZATION の場合のみ true を許容 |
| systemAdmin | boolean | 必須 | - |
| appGroupViewable | boolean | 必須 | - |
| appGroupManageable | boolean | 必須 | - |
| appCreate | boolean | 必須 | - |
| appManage | boolean | 必須 | - |
| spaceCreate | boolean | 必須 | - |
| guestSpaceCreate | boolean | 必須 | - |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| systemPermissionId | SystemPermissionId |
| entity | AclEntity |
| includeSubs | boolean |
| systemAdmin | boolean |
| appGroupViewable | boolean |
| appGroupManageable | boolean |
| appCreate | boolean |
| appManage | boolean |
| spaceCreate | boolean |
| guestSpaceCreate | boolean |

### 処理フロー

1. Identity ドメインのポートから operatorId のユーザーコンテキスト（UserAclContext）を取得する
2. `SystemPermissionRepository.findByUser(userId, userCode, organizationCodes, groupCodes)` で操作者のシステム権限を取得する
3. 取得したシステム権限のいずれかで `hasRight("SYSTEM_ADMIN")` が true であること、または `userContext.isCybozuAdmin` が true であることを検証する
4. 権限がない場合は SystemPermissionDeniedError を返す
5. `SystemPermissionRepository.findByEntity(entity)` で既存の権限設定を確認する
6. 既に存在する場合は DuplicateSystemPermissionError を返す
7. 新しい SystemPermission エンティティを生成し、`updateRights()` で権限項目を設定する
8. `SystemPermissionRepository.save(permission)` で永続化する
9. 追加されたシステム権限を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 操作者に OpenDesk システム管理権限がない | SystemPermissionDeniedError |
| 同一エンティティのシステム権限が既に存在する | DuplicateSystemPermissionError |
| entity.type が CREATOR または FIELD_ENTITY | InvalidEntityTypeError |

---

## 9. システム権限の更新

### 概要

既存のシステム権限設定を更新する。OpenDesk システム管理権限が必要。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| systemPermissionId | SystemPermissionId | 必須 | 有効な SystemPermissionId 形式であること |
| systemAdmin | boolean | 必須 | - |
| appGroupViewable | boolean | 必須 | - |
| appGroupManageable | boolean | 必須 | - |
| appCreate | boolean | 必須 | - |
| appManage | boolean | 必須 | - |
| spaceCreate | boolean | 必須 | - |
| guestSpaceCreate | boolean | 必須 | - |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| systemPermissionId | SystemPermissionId |
| entity | AclEntity |
| includeSubs | boolean |
| systemAdmin | boolean |
| appGroupViewable | boolean |
| appGroupManageable | boolean |
| appCreate | boolean |
| appManage | boolean |
| spaceCreate | boolean |
| guestSpaceCreate | boolean |

### 処理フロー

1. Identity ドメインのポートから operatorId のユーザーコンテキスト（UserAclContext）を取得する
2. `SystemPermissionRepository.findByUser(userId, userCode, organizationCodes, groupCodes)` で操作者のシステム権限を取得する
3. 取得したシステム権限のいずれかで `hasRight("SYSTEM_ADMIN")` が true であること、または `userContext.isCybozuAdmin` が true であることを検証する
4. 権限がない場合は SystemPermissionDeniedError を返す
5. `SystemPermissionRepository.findByEntity()` または ID で対象のシステム権限を取得する
6. 存在しない場合は SystemPermissionNotFoundError を返す
7. `permission.updateRights({ systemAdmin, appGroupViewable, appGroupManageable, appCreate, appManage, spaceCreate, guestSpaceCreate })` を呼び出す
8. `SystemPermissionRepository.save(permission)` で永続化する
9. 更新後のシステム権限を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 操作者に OpenDesk システム管理権限がない | SystemPermissionDeniedError |
| 対象のシステム権限が存在しない | SystemPermissionNotFoundError |

---

## 10. システム権限の削除

### 概要

システム権限設定を削除する。OpenDesk システム管理権限が必要。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| systemPermissionId | SystemPermissionId | 必須 | 有効な SystemPermissionId 形式であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| (なし) | void |

### 処理フロー

1. Identity ドメインのポートから operatorId のユーザーコンテキスト（UserAclContext）を取得する
2. `SystemPermissionRepository.findByUser(userId, userCode, organizationCodes, groupCodes)` で操作者のシステム権限を取得する
3. 取得したシステム権限のいずれかで `hasRight("SYSTEM_ADMIN")` が true であること、または `userContext.isCybozuAdmin` が true であることを検証する
4. 権限がない場合は SystemPermissionDeniedError を返す
5. 対象のシステム権限を取得し、存在しない場合は SystemPermissionNotFoundError を返す
6. `SystemPermissionRepository.delete(systemPermissionId)` で削除する

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 操作者に OpenDesk システム管理権限がない | SystemPermissionDeniedError |
| 対象のシステム権限が存在しない | SystemPermissionNotFoundError |

---

## 11. ユーザーのシステム権限評価

### 概要

指定ユーザーに適用されるシステム権限を結合評価し、各権限項目の有効/無効を返す。cybozu.com 共通管理者フラグも考慮する。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| targetUserId | UserId | 必須 | 有効な UserId 形式であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| userId | UserId |
| systemAdmin | boolean |
| appGroupViewable | boolean |
| appGroupManageable | boolean |
| appCreate | boolean |
| appManage | boolean |
| spaceCreate | boolean |
| guestSpaceCreate | boolean |

### 処理フロー

1. Identity ドメインのポートから targetUserId のユーザーコンテキスト（UserAclContext）を取得する
2. `userContext.isCybozuAdmin` が true の場合、全権限項目を true として即座に返す
3. `SystemPermissionRepository.findByUser(userId, userCode, organizationCodes, groupCodes)` で対象ユーザーに適用されるシステム権限を全て取得する
4. 取得した各 SystemPermission の各権限項目を OR 結合する（いずれかで true であれば true）
5. いずれかの SystemPermission で `hasRight("SYSTEM_ADMIN")` が true の場合、全権限項目を true とする
6. 結合評価した結果を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 対象ユーザーが存在しない | UserNotFoundError |

---

## 12. レコードアクセス権の一括評価

### 概要

指定ユーザーの複数レコード（最大100件）に対する実効権限を一括評価する。レコードレベルとフィールドレベルの権限を返す。パスワード認証・セッション認証のみ対応。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| appId | AppId | 必須 | 有効な AppId 形式であること |
| recordIds | RecordId[] | 必須 | 1件以上100件以下 |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| results | EffectiveRecordPermission[] |

### 処理フロー

1. 認証方式がパスワード認証またはセッション認証であることを検証する。API トークン認証の場合は AuthMethodNotAllowedError を返す
2. recordIds が100件を超える場合は TooManyRecordsError を返す
3. Identity ドメインのポートから operatorId のユーザーコンテキスト（UserAclContext）を取得する
4. `AppAclRepository.findByAppId(appId)` でアプリアクセス権を取得する
5. `RecordAclRepository.findByAppId(appId)` でレコードアクセス権を取得する
6. `FieldAclRepository.findByAppId(appId)` でフィールドアクセス権を取得する
7. Record ドメインのポートから recordIds に対応するレコードのフィールド値マップを取得する
8. App ドメインのポートから評価対象のフィールドコード一覧を取得する
9. `AclEvaluationService.evaluateBatch(appAcl, recordAcl, fieldAcl, userContext, isAppCreator, records, evaluableFieldCodes)` で実効権限を一括評価する
10. 評価結果を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| API トークン認証でアクセス | AuthMethodNotAllowedError |
| recordIds が100件を超える | TooManyRecordsError |
| アプリが存在しない | AppNotFoundError |
| レコードが存在しない | RecordNotFoundError |
| 対象ユーザーが存在しない | UserNotFoundError |
