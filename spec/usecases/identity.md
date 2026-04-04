# Identity ドメイン ユースケース設計

---

## 認証

---

### UC-1: ログイン（パスワード認証）

#### 概要

未認証ユーザーがログイン名（メールアドレス形式）とパスワードを入力し、パスワード認証を経てセッションを作成する。認証成功時にセッション ID を Cookie に設定し、以降のリクエストで利用する。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| loginName | string | 必須 | 空文字でないこと。有効なメールアドレス形式であること |
| password | string | 必須 | 空文字でないこと |
| ipAddress | string | 必須 | 空文字でないこと。有効な IPv4 または IPv6 形式であること |
| userAgent | string | 必須 | 空文字でないこと |
| country | string | 任意 | 指定する場合は ISO 3166-1 alpha-2 コードであること |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| sessionId | string |
| userId | string |
| displayName | string |
| language | string |
| timezone | string |
| expiresAt | Date |

#### 処理フロー

1. 入力 DTO のバリデーションを行う
2. `LoginName` 値オブジェクトを生成する（loginName から）
3. `Password` 値オブジェクトを生成する（password から）
4. `SessionPolicy` を取得する（設定ストアまたはデフォルト値）
5. `AuthenticationService.authenticateByPassword()` を呼び出す（loginName, password, ipAddress, userAgent, country, sessionPolicy を渡す）
6. 認証成功時、`UserRepository.findByLoginName()` でユーザー情報を取得する
7. 出力 DTO を構築して返す

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| loginName が空文字またはメールアドレス形式でない | バリデーションエラー |
| password が空文字 | バリデーションエラー |
| ログイン名に一致するユーザーが存在しない | InvalidCredentialsError（認証エラー） |
| パスワードが一致しない | InvalidCredentialsError（認証エラー） |
| ユーザーが無効化されている | UserInactiveError（認証エラー） |
| アカウントがロックアウトされている | AccountLockedError（認証エラー） |

---

### UC-2: ログアウト

#### 概要

認証済みユーザーが現在のセッションを明示的に終了する。セッションを無効化し、Cookie を削除する。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| sessionId | string | 必須 | 空文字でないこと。有効な UUID v4 形式であること |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| （なし） | void |

#### 処理フロー

1. 入力 DTO のバリデーションを行う
2. `SessionId` 値オブジェクトを生成する
3. `AuthenticationService.terminateSession()` を呼び出す（sessionId を渡す）
4. 正常終了を返す

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| sessionId が空文字または UUID 形式でない | バリデーションエラー |
| セッションが存在しない | SessionNotFoundError（ビジネスルール違反） |

---

### UC-3: パスワード変更

#### 概要

認証済みユーザーが現在のパスワードを確認した上で、新しいパスワードに変更する。パスワードポリシーに基づくバリデーションを行い、ハッシュ化して保存する。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| userId | string | 必須 | 空文字でないこと。有効な UUID v4 形式であること |
| currentPassword | string | 必須 | 空文字でないこと |
| newPassword | string | 必須 | 空文字でないこと。パスワードポリシーを満たすこと（最小文字数、複雑さ要件、ログイン名と異なること、過去パスワードと異なること） |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| （なし） | void |

#### 処理フロー

1. 入力 DTO のバリデーションを行う
2. `UserId` 値オブジェクトを生成する
3. `UserRepository.findById()` でユーザーを取得する
4. ユーザーが存在しない場合はエラーを返す
5. `PasswordHasher.verify()` で現在のパスワードを検証する
6. 現在のパスワードが一致しない場合はエラーを返す
7. `PasswordPolicy` を取得する
8. `Password` 値オブジェクトを生成する（newPassword + PasswordPolicy でバリデーション）
9. `PasswordHasher.hash()` で新しいパスワードをハッシュ化する
10. ハッシュ化されたパスワードを保存する
11. 正常終了を返す

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| userId が空文字または UUID 形式でない | バリデーションエラー |
| currentPassword が空文字 | バリデーションエラー |
| newPassword が空文字 | バリデーションエラー |
| ユーザーが存在しない | UserNotFoundError（ビジネスルール違反） |
| 現在のパスワードが一致しない | InvalidCredentialsError（認証エラー） |
| 新しいパスワードがポリシーの最小文字数を満たさない | バリデーションエラー |
| 新しいパスワードがポリシーの複雑さ要件を満たさない | バリデーションエラー |
| 新しいパスワードがログイン名と同一（ポリシーで禁止の場合） | バリデーションエラー |
| 新しいパスワードが過去に使用済み（ポリシーの履歴数分） | バリデーションエラー |

---

### UC-4: API トークン発行

#### 概要

アプリ管理者がアプリに紐づく API トークンを新規生成する。トークンにはスコープ（権限範囲）を指定する。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| userId | string | 必須 | 空文字でないこと。有効な UUID v4 形式であること |
| scopes | ApiScope[] | 必須 | 1つ以上のスコープが指定されていること。各スコープが有効な ApiScope 値であること |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| token | string |
| scopes | ApiScope[] |

#### 処理フロー

1. 入力 DTO のバリデーションを行う
2. `UserId` 値オブジェクトを生成する
3. `UserRepository.findById()` でユーザーの存在を確認する
4. ユーザーが存在しない場合はエラーを返す
5. `AuthenticationProvider.generateApiToken()` は外部の責務のため、`ApiToken` 値オブジェクトを生成する（トークン文字列の生成はインフラ層に委譲）
6. 生成されたトークンを永続化する
7. 出力 DTO を構築して返す

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| userId が空文字または UUID 形式でない | バリデーションエラー |
| scopes が空配列 | バリデーションエラー |
| scopes に無効なスコープ値が含まれている | バリデーションエラー |
| ユーザーが存在しない | UserNotFoundError（ビジネスルール違反） |

---

### UC-5: API トークン無効化

#### 概要

アプリ管理者が発行済みの API トークンを無効化する。無効化後はそのトークンで API アクセスできなくなる。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| userId | string | 必須 | 空文字でないこと。有効な UUID v4 形式であること |
| token | string | 必須 | 空文字でないこと |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| （なし） | void |

#### 処理フロー

1. 入力 DTO のバリデーションを行う
2. `UserId` 値オブジェクトを生成する
3. `UserRepository.findById()` でユーザーの存在を確認する
4. ユーザーが存在しない場合はエラーを返す
5. `AuthenticationProvider.validateApiToken()` でトークンが有効であることを確認する
6. トークンが無効またはユーザーに紐づかない場合はエラーを返す
7. トークンを無効化（削除）する
8. 正常終了を返す

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| userId が空文字または UUID 形式でない | バリデーションエラー |
| token が空文字 | バリデーションエラー |
| ユーザーが存在しない | UserNotFoundError（ビジネスルール違反） |
| トークンが存在しないまたは無効 | InvalidTokenError（ビジネスルール違反） |

---

### UC-6: OAuth トークンリフレッシュ

#### 概要

外部サービスがリフレッシュトークンを使用して、期限切れのアクセストークンを新しいアクセストークンに更新する。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| refreshToken | string | 必須 | 空文字でないこと |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| accessToken | string |
| refreshToken | string |
| expiresAt | Date |
| scopes | ApiScope[] |

#### 処理フロー

1. 入力 DTO のバリデーションを行う
2. `AuthenticationProvider.refreshOAuthToken()` を呼び出す（refreshToken を渡す）
3. 新しい `OAuthToken` が返された場合、出力 DTO を構築して返す

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| refreshToken が空文字 | バリデーションエラー |
| リフレッシュトークンが無効 | InvalidTokenError（認証エラー） |

---

## ユーザー管理

---

### UC-7: ユーザー作成

#### 概要

システム管理者が新規ユーザーを作成する。ログイン名・表示名・メールアドレスは必須で、初期パスワードを設定する。作成されたユーザーは有効状態（isActive = true）となる。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| loginName | string | 必須 | 空文字でないこと。有効なメールアドレス形式であること |
| displayName | string | 必須 | 空文字でないこと |
| email | string | 必須 | 空文字でないこと。有効なメールアドレス形式（RFC 5322）であること |
| password | string | 必須 | 空文字でないこと。パスワードポリシーを満たすこと |
| timezone | string | 任意 | 指定する場合は有効な IANA タイムゾーン識別子であること。省略時は "Asia/Tokyo" |
| language | string | 任意 | 指定する場合は "ja" / "en" / "zh-CN" / "zh-TW" / "es" / "pt-BR" / "th" のいずれかであること。省略時は "ja" |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| userId | string |
| loginName | string |
| displayName | string |
| email | string |
| timezone | string |
| language | string |
| isActive | boolean |
| createdAt | Date |

#### 処理フロー

1. 入力 DTO のバリデーションを行う
2. `LoginName` 値オブジェクトを生成する
3. `Email` 値オブジェクトを生成する
4. `Timezone` 値オブジェクトを生成する（指定があれば入力値、なければデフォルト "Asia/Tokyo"）
5. `Language` 値オブジェクトを生成する（指定があれば入力値、なければデフォルト "ja"）
6. `PasswordPolicy` を取得する
7. `Password` 値オブジェクトを生成する（パスワードポリシーでバリデーション）
8. `PasswordHasher.hash()` でパスワードをハッシュ化する
9. `User` エンティティを生成する（userId は新規 UUID、isActive = true、createdAt/updatedAt は現在時刻）
10. `UserRepository.save()` でユーザーを永続化する
11. ハッシュ化パスワードを永続化する
12. 出力 DTO を構築して返す

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| loginName が空文字またはメールアドレス形式でない | バリデーションエラー |
| displayName が空文字 | バリデーションエラー |
| email が空文字またはメールアドレス形式でない | バリデーションエラー |
| password がパスワードポリシーを満たさない | バリデーションエラー |
| timezone が無効な IANA タイムゾーン識別子 | バリデーションエラー |
| language がサポート対象外の言語コード | バリデーションエラー |
| ログイン名が既に使用されている | DuplicateLoginNameError（ビジネスルール違反） |
| メールアドレスが既に使用されている | DuplicateEmailError（ビジネスルール違反） |

---

### UC-8: ユーザー更新（プロフィール編集）

#### 概要

認証済みユーザーまたは管理者が、ユーザーの表示名・タイムゾーン・言語などのプロフィール情報を更新する。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| userId | string | 必須 | 空文字でないこと。有効な UUID v4 形式であること |
| displayName | string | 必須 | 空文字でないこと |
| timezone | string | 必須 | 有効な IANA タイムゾーン識別子であること |
| language | string | 必須 | "ja" / "en" / "zh-CN" / "zh-TW" / "es" / "pt-BR" / "th" のいずれかであること |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| userId | string |
| displayName | string |
| timezone | string |
| language | string |
| updatedAt | Date |

#### 処理フロー

1. 入力 DTO のバリデーションを行う
2. `UserId` 値オブジェクトを生成する
3. `Timezone` 値オブジェクトを生成する
4. `Language` 値オブジェクトを生成する
5. `UserRepository.findById()` でユーザーを取得する
6. ユーザーが存在しない場合はエラーを返す
7. `User.updateProfile()` を呼び出す（displayName, timezone, language を渡す）
8. `UserRepository.save()` で更新を永続化する
9. 出力 DTO を構築して返す

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| userId が空文字または UUID 形式でない | バリデーションエラー |
| displayName が空文字 | EmptyDisplayNameError（ドメインエラー） |
| timezone が無効な IANA タイムゾーン識別子 | バリデーションエラー |
| language がサポート対象外の言語コード | バリデーションエラー |
| ユーザーが存在しない | UserNotFoundError（ビジネスルール違反） |

---

### UC-9: ユーザー無効化

#### 概要

システム管理者がユーザーを停止状態にする。無効化されたユーザーはログインできなくなり、そのユーザーの全セッションが強制終了される。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| userId | string | 必須 | 空文字でないこと。有効な UUID v4 形式であること |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| userId | string |
| isActive | boolean |
| updatedAt | Date |

#### 処理フロー

1. 入力 DTO のバリデーションを行う
2. `UserId` 値オブジェクトを生成する
3. `UserRepository.findById()` でユーザーを取得する
4. ユーザーが存在しない場合はエラーを返す
5. `User.deactivate()` を呼び出す
6. `UserRepository.save()` で更新を永続化する
7. `AuthenticationService.terminateAllSessions()` を呼び出して全セッションを終了する
8. 出力 DTO を構築して返す

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| userId が空文字または UUID 形式でない | バリデーションエラー |
| ユーザーが存在しない | UserNotFoundError（ビジネスルール違反） |
| ユーザーが既に無効状態 | AlreadyInactiveError（ビジネスルール違反） |

---

### UC-10: ユーザー有効化

#### 概要

システム管理者が停止中のユーザーを再び使用可能にする。有効化後、ユーザーはログインできるようになる。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| userId | string | 必須 | 空文字でないこと。有効な UUID v4 形式であること |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| userId | string |
| isActive | boolean |
| updatedAt | Date |

#### 処理フロー

1. 入力 DTO のバリデーションを行う
2. `UserId` 値オブジェクトを生成する
3. `UserRepository.findById()` でユーザーを取得する
4. ユーザーが存在しない場合はエラーを返す
5. `User.activate()` を呼び出す
6. `UserRepository.save()` で更新を永続化する
7. 出力 DTO を構築して返す

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| userId が空文字または UUID 形式でない | バリデーションエラー |
| ユーザーが存在しない | UserNotFoundError（ビジネスルール違反） |
| ユーザーが既に有効状態 | AlreadyActiveError（ビジネスルール違反） |

---

### UC-11: ユーザー削除

#### 概要

システム管理者がユーザーを完全に削除する。削除前にユーザーの全セッションを終了し、組織・グループの所属関係を解除する。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| userId | string | 必須 | 空文字でないこと。有効な UUID v4 形式であること |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| （なし） | void |

#### 処理フロー

1. 入力 DTO のバリデーションを行う
2. `UserId` 値オブジェクトを生成する
3. `UserRepository.findById()` でユーザーの存在を確認する
4. ユーザーが存在しない場合はエラーを返す
5. `AuthenticationService.terminateAllSessions()` を呼び出して全セッションを終了する
6. `MembershipRepository.getOrganizationIdsByUserId()` でユーザーの所属組織一覧を取得する
7. 各組織について `MembershipRepository.removeUserFromOrganization()` を呼び出す
8. `MembershipRepository.getGroupIdsByUserId()` でユーザーの所属グループ一覧を取得する
9. 各グループについて `MembershipRepository.removeUserFromGroup()` を呼び出す
10. `UserRepository.delete()` でユーザーを削除する
11. 正常終了を返す

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| userId が空文字または UUID 形式でない | バリデーションエラー |
| ユーザーが存在しない | UserNotFoundError（ビジネスルール違反） |

---

## 組織管理

---

### UC-12: 組織の作成

#### 概要

システム管理者が新規組織を作成する。ルート組織（親なし）として作成するか、既存組織の子として作成する。組織コードはシステム全体で一意である必要がある。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| name | string | 必須 | 空文字でないこと |
| code | string | 必須 | 空文字でないこと |
| parentOrganizationId | string | 任意 | 指定する場合は有効な UUID v4 形式であること。省略時はルート組織として作成 |
| orderIndex | number | 任意 | 指定する場合は 0 以上の整数であること。省略時は 0 |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| organizationId | string |
| name | string |
| code | string |
| parentOrganizationId | string \| null |
| orderIndex | number |

#### 処理フロー

1. 入力 DTO のバリデーションを行う
2. parentOrganizationId が指定されている場合、`OrganizationId` 値オブジェクトを生成する
3. parentOrganizationId が指定されている場合、`OrganizationRepository.findById()` で親組織の存在を確認する
4. 親組織が存在しない場合はエラーを返す
5. `Organization` エンティティを生成する（organizationId は新規 UUID）
6. `OrganizationRepository.save()` で組織を永続化する
7. 出力 DTO を構築して返す

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| name が空文字 | バリデーションエラー |
| code が空文字 | バリデーションエラー |
| parentOrganizationId が UUID 形式でない | バリデーションエラー |
| orderIndex が負数 | バリデーションエラー |
| 親組織が存在しない | OrganizationNotFoundError（ビジネスルール違反） |
| 組織コードが既に使用されている | DuplicateOrganizationCodeError（ビジネスルール違反） |

---

### UC-13: 組織の更新

#### 概要

システム管理者が組織の名称変更、親組織の変更（ツリー内移動）、表示順序の変更を行う。親組織の変更時は循環参照のチェックを行う。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| organizationId | string | 必須 | 空文字でないこと。有効な UUID v4 形式であること |
| name | string | 任意 | 指定する場合は空文字でないこと |
| parentOrganizationId | string \| null | 任意 | 指定する場合は有効な UUID v4 形式であること。null の場合はルート組織に移動 |
| orderIndex | number | 任意 | 指定する場合は 0 以上の整数であること |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| organizationId | string |
| name | string |
| code | string |
| parentOrganizationId | string \| null |
| orderIndex | number |

#### 処理フロー

1. 入力 DTO のバリデーションを行う
2. `OrganizationId` 値オブジェクトを生成する
3. `OrganizationRepository.findById()` で組織を取得する
4. 組織が存在しない場合はエラーを返す
5. name が指定されている場合、`Organization.rename()` を呼び出す
6. parentOrganizationId が指定されている場合（明示的に渡された場合）:
   - `OrganizationService.validateMove()` を呼び出して循環参照チェックを行う
   - 検証に通過したら `Organization.moveTo()` を呼び出す
7. orderIndex が指定されている場合、`Organization.reorder()` を呼び出す
8. `OrganizationRepository.save()` で更新を永続化する
9. 出力 DTO を構築して返す

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| organizationId が空文字または UUID 形式でない | バリデーションエラー |
| name が空文字（指定時） | EmptyOrganizationNameError（ドメインエラー） |
| orderIndex が負数（指定時） | InvalidOrderIndexError（ドメインエラー） |
| 組織が存在しない | OrganizationNotFoundError（ビジネスルール違反） |
| 移動先の親組織が存在しない | OrganizationNotFoundError（ビジネスルール違反） |
| 移動により循環参照が発生する | CircularReferenceError（ビジネスルール違反） |

---

### UC-14: 組織の削除

#### 概要

システム管理者が組織を削除する。子組織が存在する場合、所属ユーザーが存在する場合は削除できない。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| organizationId | string | 必須 | 空文字でないこと。有効な UUID v4 形式であること |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| （なし） | void |

#### 処理フロー

1. 入力 DTO のバリデーションを行う
2. `OrganizationId` 値オブジェクトを生成する
3. `OrganizationRepository.findById()` で組織の存在を確認する
4. 組織が存在しない場合はエラーを返す
5. `OrganizationRepository.delete()` で組織を削除する（子組織・所属ユーザーの存在チェックはリポジトリ層で実施）
6. 正常終了を返す

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| organizationId が空文字または UUID 形式でない | バリデーションエラー |
| 組織が存在しない | OrganizationNotFoundError（ビジネスルール違反） |
| 子組織が存在する | OrganizationHasChildrenError（ビジネスルール違反） |
| 所属ユーザーが存在する | OrganizationHasMembersError（ビジネスルール違反） |

---

### UC-15: 組織へのユーザー追加

#### 概要

システム管理者がユーザーを組織のメンバーとして追加する。ユーザーは複数の組織に所属できる。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| userId | string | 必須 | 空文字でないこと。有効な UUID v4 形式であること |
| organizationId | string | 必須 | 空文字でないこと。有効な UUID v4 形式であること |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| userId | string |
| organizationId | string |

#### 処理フロー

1. 入力 DTO のバリデーションを行う
2. `UserId` 値オブジェクトを生成する
3. `OrganizationId` 値オブジェクトを生成する
4. `UserRepository.findById()` でユーザーの存在を確認する
5. ユーザーが存在しない場合はエラーを返す
6. `OrganizationRepository.findById()` で組織の存在を確認する
7. 組織が存在しない場合はエラーを返す
8. `MembershipRepository.addUserToOrganization()` を呼び出す（userId, organizationId を渡す）
9. 出力 DTO を構築して返す

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| userId が空文字または UUID 形式でない | バリデーションエラー |
| organizationId が空文字または UUID 形式でない | バリデーションエラー |
| ユーザーが存在しない | UserNotFoundError（ビジネスルール違反） |
| 組織が存在しない | OrganizationNotFoundError（ビジネスルール違反） |
| ユーザーが既にその組織に所属している | AlreadyMemberError（ビジネスルール違反） |

---

### UC-16: 組織からのユーザー削除

#### 概要

システム管理者がユーザーを組織のメンバーから削除する。削除する組織がユーザーの主所属組織の場合、主所属組織をクリアする。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| userId | string | 必須 | 空文字でないこと。有効な UUID v4 形式であること |
| organizationId | string | 必須 | 空文字でないこと。有効な UUID v4 形式であること |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| （なし） | void |

#### 処理フロー

1. 入力 DTO のバリデーションを行う
2. `UserId` 値オブジェクトを生成する
3. `OrganizationId` 値オブジェクトを生成する
4. `UserRepository.findById()` でユーザーを取得する
5. ユーザーが存在しない場合はエラーを返す
6. `OrganizationRepository.findById()` で組織の存在を確認する
7. 組織が存在しない場合はエラーを返す
8. `MembershipRepository.removeUserFromOrganization()` を呼び出す（userId, organizationId を渡す）
9. ユーザーの `primaryOrganizationId` が削除対象の `organizationId` と一致する場合、`User.clearPrimaryOrganization()` を呼び出す
10. ユーザーの変更がある場合、`UserRepository.save()` で永続化する
11. 正常終了を返す

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| userId が空文字または UUID 形式でない | バリデーションエラー |
| organizationId が空文字または UUID 形式でない | バリデーションエラー |
| ユーザーが存在しない | UserNotFoundError（ビジネスルール違反） |
| 組織が存在しない | OrganizationNotFoundError（ビジネスルール違反） |
| ユーザーがその組織に所属していない | NotMemberError（ビジネスルール違反） |

---

## グループ管理

---

### UC-17: グループの作成

#### 概要

システム管理者が新規グループを作成する。グループコードはシステム全体で一意である必要がある。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| name | string | 必須 | 空文字でないこと |
| code | string | 必須 | 空文字でないこと |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| groupId | string |
| name | string |
| code | string |

#### 処理フロー

1. 入力 DTO のバリデーションを行う
2. `Group` エンティティを生成する（groupId は新規 UUID）
3. `GroupRepository.save()` でグループを永続化する
4. 出力 DTO を構築して返す

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| name が空文字 | バリデーションエラー |
| code が空文字 | バリデーションエラー |
| グループコードが既に使用されている | DuplicateGroupCodeError（ビジネスルール違反） |

---

### UC-18: グループの更新

#### 概要

システム管理者がグループ名を変更する。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| groupId | string | 必須 | 空文字でないこと。有効な UUID v4 形式であること |
| name | string | 必須 | 空文字でないこと |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| groupId | string |
| name | string |
| code | string |

#### 処理フロー

1. 入力 DTO のバリデーションを行う
2. `GroupId` 値オブジェクトを生成する
3. `GroupRepository.findById()` でグループを取得する
4. グループが存在しない場合はエラーを返す
5. `Group.rename()` を呼び出す（name を渡す）
6. `GroupRepository.save()` で更新を永続化する
7. 出力 DTO を構築して返す

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| groupId が空文字または UUID 形式でない | バリデーションエラー |
| name が空文字 | EmptyGroupNameError（ドメインエラー） |
| グループが存在しない | GroupNotFoundError（ビジネスルール違反） |

---

### UC-19: グループの削除

#### 概要

システム管理者がグループを削除する。削除前に所属メンバーが存在しないことを確認する。メンバーが残っている場合は事前に全メンバーを削除する必要がある。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| groupId | string | 必須 | 空文字でないこと。有効な UUID v4 形式であること |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| （なし） | void |

#### 処理フロー

1. 入力 DTO のバリデーションを行う
2. `GroupId` 値オブジェクトを生成する
3. `GroupRepository.findById()` でグループの存在を確認する
4. グループが存在しない場合はエラーを返す
5. `UserRepository.findByGroupId()` でグループの所属ユーザーを取得する
6. 所属ユーザーが存在する場合はエラーを返す
7. `GroupRepository.delete()` でグループを削除する
8. 正常終了を返す

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| groupId が空文字または UUID 形式でない | バリデーションエラー |
| グループが存在しない | GroupNotFoundError（ビジネスルール違反） |
| 所属ユーザーが存在する | GroupHasMembersError（ビジネスルール違反） |

---

### UC-20: グループへのユーザー追加

#### 概要

システム管理者がユーザーをグループのメンバーとして追加する。ユーザーは複数のグループに所属できる。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| userId | string | 必須 | 空文字でないこと。有効な UUID v4 形式であること |
| groupId | string | 必須 | 空文字でないこと。有効な UUID v4 形式であること |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| userId | string |
| groupId | string |

#### 処理フロー

1. 入力 DTO のバリデーションを行う
2. `UserId` 値オブジェクトを生成する
3. `GroupId` 値オブジェクトを生成する
4. `UserRepository.findById()` でユーザーの存在を確認する
5. ユーザーが存在しない場合はエラーを返す
6. `GroupRepository.findById()` でグループの存在を確認する
7. グループが存在しない場合はエラーを返す
8. `MembershipRepository.addUserToGroup()` を呼び出す（userId, groupId を渡す）
9. 出力 DTO を構築して返す

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| userId が空文字または UUID 形式でない | バリデーションエラー |
| groupId が空文字または UUID 形式でない | バリデーションエラー |
| ユーザーが存在しない | UserNotFoundError（ビジネスルール違反） |
| グループが存在しない | GroupNotFoundError（ビジネスルール違反） |
| ユーザーが既にそのグループに所属している | AlreadyMemberError（ビジネスルール違反） |

---

### UC-21: グループからのユーザー削除

#### 概要

システム管理者がユーザーをグループのメンバーから削除する。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| userId | string | 必須 | 空文字でないこと。有効な UUID v4 形式であること |
| groupId | string | 必須 | 空文字でないこと。有効な UUID v4 形式であること |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| （なし） | void |

#### 処理フロー

1. 入力 DTO のバリデーションを行う
2. `UserId` 値オブジェクトを生成する
3. `GroupId` 値オブジェクトを生成する
4. `UserRepository.findById()` でユーザーの存在を確認する
5. ユーザーが存在しない場合はエラーを返す
6. `GroupRepository.findById()` でグループの存在を確認する
7. グループが存在しない場合はエラーを返す
8. `MembershipRepository.removeUserFromGroup()` を呼び出す（userId, groupId を渡す）
9. 正常終了を返す

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| userId が空文字または UUID 形式でない | バリデーションエラー |
| groupId が空文字または UUID 形式でない | バリデーションエラー |
| ユーザーが存在しない | UserNotFoundError（ビジネスルール違反） |
| グループが存在しない | GroupNotFoundError（ビジネスルール違反） |
| ユーザーがそのグループに所属していない | NotMemberError（ビジネスルール違反） |

---

## セッション管理

---

### UC-22: セッション一覧取得

#### 概要

認証済みユーザーが自分の現在有効なセッションの一覧を取得する。ページネーション付き（5件/ページ）で返す。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| userId | string | 必須 | 空文字でないこと。有効な UUID v4 形式であること |
| offset | number | 任意 | 0 以上の整数であること。省略時は 0 |
| limit | number | 任意 | 1 以上 5 以下の整数であること。省略時は 5 |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| sessions | SessionDTO[] |
| totalCount | number |

**SessionDTO:**

| フィールド名 | 型 |
|-------------|-----|
| sessionId | string |
| ipAddress | string |
| userAgent | string |
| country | string \| null |
| createdAt | Date |
| expiresAt | Date |
| isCurrent | boolean |

#### 処理フロー

1. 入力 DTO のバリデーションを行う
2. `UserId` 値オブジェクトを生成する
3. `UserRepository.findById()` でユーザーの存在を確認する
4. ユーザーが存在しない場合はエラーを返す
5. `SessionRepository.findByUserId()` でユーザーの全セッションを取得する
6. 期限切れでないセッションのみをフィルタする（`Session.isExpired()` で判定）
7. createdAt の降順でソートする
8. offset / limit でページネーション処理を行う
9. 出力 DTO を構築して返す（totalCount は有効セッションの総数）

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| userId が空文字または UUID 形式でない | バリデーションエラー |
| offset が負数 | バリデーションエラー |
| limit が 1 未満または 5 超過 | バリデーションエラー |
| ユーザーが存在しない | UserNotFoundError（ビジネスルール違反） |

---

### UC-23: セッション強制終了

#### 概要

認証済みユーザーが指定したセッションを強制終了する。他端末でのログインを強制的にログアウトさせる用途で利用する。現在のセッション自身も対象にできる。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| userId | string | 必須 | 空文字でないこと。有効な UUID v4 形式であること |
| sessionId | string | 必須 | 空文字でないこと。有効な UUID v4 形式であること |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| （なし） | void |

#### 処理フロー

1. 入力 DTO のバリデーションを行う
2. `UserId` 値オブジェクトを生成する
3. `SessionId` 値オブジェクトを生成する
4. `SessionRepository.findById()` でセッションを取得する
5. セッションが存在しない場合はエラーを返す
6. セッションの `userId` が入力の `userId` と一致することを確認する（自分のセッションのみ操作可能）
7. 一致しない場合はエラーを返す
8. `AuthenticationService.terminateSession()` を呼び出す（sessionId を渡す）
9. 正常終了を返す

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| userId が空文字または UUID 形式でない | バリデーションエラー |
| sessionId が空文字または UUID 形式でない | バリデーションエラー |
| セッションが存在しない | SessionNotFoundError（ビジネスルール違反） |
| セッションが自分のものでない | SessionNotFoundError（ビジネスルール違反。セキュリティ上、他人のセッション存在は隠蔽する） |

---

### UC-24: ログイン履歴取得

#### 概要

認証済みユーザーが自分の過去のログイン記録を取得する。過去2週間分のセッション履歴を、同一端末（userAgent）ごとに最新10件まで取得する。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| userId | string | 必須 | 空文字でないこと。有効な UUID v4 形式であること |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| loginHistories | LoginHistoryDTO[] |

**LoginHistoryDTO:**

| フィールド名 | 型 |
|-------------|-----|
| sessionId | string |
| ipAddress | string |
| userAgent | string |
| country | string \| null |
| loginAt | Date |

#### 処理フロー

1. 入力 DTO のバリデーションを行う
2. `UserId` 値オブジェクトを生成する
3. `UserRepository.findById()` でユーザーの存在を確認する
4. ユーザーが存在しない場合はエラーを返す
5. `SessionRepository.findByUserId()` でユーザーの全セッション（有効・期限切れ含む）を取得する
6. 過去2週間以内のセッションのみをフィルタする（`createdAt` >= 現在時刻 - 14日）
7. userAgent ごとにグループ化し、各グループで createdAt の降順で最新10件に絞り込む
8. 全グループの結果を createdAt の降順でマージする
9. 出力 DTO を構築して返す

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| userId が空文字または UUID 形式でない | バリデーションエラー |
| ユーザーが存在しない | UserNotFoundError（ビジネスルール違反） |
