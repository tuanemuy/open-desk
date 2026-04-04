# Identity ドメイン設計

## 概要

Identity ドメインは、OpenDesk プラットフォームにおけるユーザー・組織・グループの管理、および認証・セッション管理を担う Supporting ドメインである。すべての他ドメインがユーザーやグループの ID を参照するため、システム全体の基盤となる。

---

## ユビキタス言語

| 英語名 | 日本語名 | 定義 |
|--------|---------|------|
| User | ユーザー | OpenDesk にログインして操作を行う主体。表示名・メールアドレス・所属組織・タイムゾーン・言語などの属性を持つ |
| Organization | 組織 | ユーザーが所属する階層型（ツリー構造）の組織単位。親子関係を持ち、組織ツリーを形成する |
| Group | グループ | 組織とは独立した、フラットなユーザーの集合。ロールベースのアクセス制御などに利用される |
| Session | セッション | ユーザーのログインから明示的なログアウトまたはタイムアウトまでの認証済み接続。Cookie ベースで管理される |
| Login Name | ログイン名 | ユーザーがログイン時に使用する一意の識別子。メールアドレス形式 |
| Display Name | 表示名 | 画面上に表示されるユーザーの名前。必須項目 |
| Password | パスワード | ユーザー認証に使用する秘密の文字列。ハッシュ化して保存される |
| API Token | API トークン | アプリごとに生成される認証トークン。REST API のプログラム的アクセスに使用する |
| OAuth Token | OAuth トークン | OAuth 2.0 Authorization Code Grant フローで発行されるアクセストークンとリフレッシュトークンの組 |
| Authentication | 認証 | ユーザーの本人確認を行うプロセス。パスワード認証・API トークン認証・OAuth 認証・セッション認証の4方式を提供する |
| Timezone | タイムゾーン | ユーザーの日時表示に使用する時間帯設定。約80の標準タイムゾーンから選択（デフォルト: UTC+09:00） |
| Language | 言語 | ユーザーの画面表示言語。7言語（日本語・英語・中国語簡体/繁体・スペイン語・ポルトガル語・タイ語）から選択 |
| Password Policy | パスワードポリシー | パスワードの最小文字数（3-15）、複雑さ（制限なし/英数字/英数字+記号）、有効期間、履歴禁止などの制約ルール |
| Account Lockout | アカウントロックアウト | 連続ログイン失敗（3-10回）時にアカウントを一時的にロックするセキュリティ機構 |
| Two-Factor Authentication | 2要素認証 | パスワードに加えて追加の認証要素を要求するオプション機能 |
| Login History | ログイン履歴 | ユーザーの過去のログイン記録（日時・IP・国・ブラウザ/OS）。過去2週間・同端末最新10件を保持 |
| Organization Tree | 組織ツリー | 組織の親子関係によって形成される階層構造。ルート組織を頂点とする木構造 |
| Member | メンバー | 組織またはグループに所属するユーザーのこと |

---

## エンティティ

### User（ユーザー）

OpenDesk にログインして操作を行う主体。認証情報とプロフィール情報を持つ。

#### フィールド

| フィールド名 | 型 | 必須 | 説明 |
|-------------|-----|------|------|
| userId | UserId | 必須 | ユーザーの一意識別子 |
| loginName | LoginName | 必須 | ログインに使用する一意の識別子 |
| displayName | string | 必須 | 画面上に表示される名前 |
| email | Email | 必須 | メールアドレス |
| primaryOrganizationId | OrganizationId | 任意 | 主所属組織の ID |
| timezone | Timezone | 必須 | タイムゾーン設定（デフォルト: UTC+09:00） |
| language | Language | 必須 | 表示言語設定（デフォルト: ja） |
| isActive | boolean | 必須 | 有効/無効状態（true=使用中、false=停止中） |
| avatarFileKey | FileKey | 任意 | プロフィール画像のファイルキー（File ドメインへの参照） |
| createdAt | Date | 必須 | 作成日時 |
| updatedAt | Date | 必須 | 最終更新日時 |

#### ビヘイビア

```typescript
// ユーザーを有効化する
activate(): void
// 前提条件: isActive === false
// 事後条件: isActive === true, updatedAt が現在時刻に更新される
// エラー: すでに有効な場合は AlreadyActiveError

// ユーザーを無効化する（停止中にする）
deactivate(): void
// 前提条件: isActive === true
// 事後条件: isActive === false, updatedAt が現在時刻に更新される
// エラー: すでに無効な場合は AlreadyInactiveError

// プロフィール情報を更新する
updateProfile(params: {
  displayName: string;
  timezone: Timezone;
  language: Language;
}): void
// 前提条件: displayName が空文字でないこと
// 事後条件: 各フィールドが更新され、updatedAt が現在時刻に更新される
// エラー: displayName が空の場合は EmptyDisplayNameError

// アバター画像を変更する
changeAvatar(fileKey: FileKey): void
// 事後条件: avatarFileKey が更新され、updatedAt が現在時刻に更新される

// アバター画像を削除する
removeAvatar(): void
// 事後条件: avatarFileKey が null になり、updatedAt が現在時刻に更新される

// 主所属組織を設定する
setPrimaryOrganization(organizationId: OrganizationId): void
// 事後条件: primaryOrganizationId が更新され、updatedAt が現在時刻に更新される

// 主所属組織を解除する
clearPrimaryOrganization(): void
// 事後条件: primaryOrganizationId が null になり、updatedAt が現在時刻に更新される
```

#### 不変条件

- `displayName` は空文字であってはならない
- `email` は有効なメールアドレス形式でなければならない
- `loginName` はシステム全体で一意でなければならない（リポジトリ層で保証）
- `createdAt <= updatedAt` でなければならない

#### ライフサイクル

1. **作成**: 管理者がユーザーを新規追加する。`isActive = true` で作成される
2. **更新**: プロフィール編集、アバター変更、組織割当変更
3. **無効化**: 管理者がユーザーを停止状態にする。ログイン不可になるが、データは保持される
4. **再有効化**: 管理者が停止中のユーザーを再び使用可能にする
5. **削除**: 管理者がユーザーを完全削除する（物理削除または論理削除はインフラ層の判断）

---

### Organization（組織）

ユーザーが所属する階層型の組織単位。親子関係を持つツリー構造を形成する。

#### フィールド

| フィールド名 | 型 | 必須 | 説明 |
|-------------|-----|------|------|
| organizationId | OrganizationId | 必須 | 組織の一意識別子 |
| name | string | 必須 | 組織名 |
| code | string | 必須 | 組織コード（システム全体で一意） |
| parentOrganizationId | OrganizationId | 任意 | 親組織の ID（null の場合はルート組織） |
| orderIndex | number | 必須 | 同一親組織内での表示順序 |

#### ビヘイビア

```typescript
// 組織名を変更する
rename(name: string): void
// 前提条件: name が空文字でないこと
// 事後条件: name が更新される
// エラー: name が空の場合は EmptyOrganizationNameError

// 親組織を変更する（ツリー内の位置を移動する）
moveTo(parentOrganizationId: OrganizationId | null): void
// 前提条件: parentOrganizationId が自分自身の organizationId でないこと
// 事後条件: parentOrganizationId が更新される
// エラー: 自分自身を親に設定しようとした場合は CircularReferenceError
// 注意: 子孫への移動による循環参照の検出はドメインサービスで行う

// 表示順序を変更する
reorder(index: number): void
// 前提条件: index >= 0
// 事後条件: orderIndex が更新される
// エラー: index が負数の場合は InvalidOrderIndexError
```

#### 不変条件

- `name` は空文字であってはならない
- `code` はシステム全体で一意でなければならない（リポジトリ層で保証）
- `parentOrganizationId` は自分自身の `organizationId` であってはならない
- `orderIndex >= 0` でなければならない

#### ライフサイクル

1. **作成**: 管理者が組織を新規追加する。ルート組織として作成するか、既存組織の子として作成する
2. **更新**: 組織名変更、親組織変更（ツリー内移動）、表示順序変更
3. **削除**: 管理者が組織を削除する。子組織やメンバーの移動が前提

---

### Group（グループ）

組織とは独立した、フラットなユーザーの集合。ロールベースのアクセス制御に利用される。

#### フィールド

| フィールド名 | 型 | 必須 | 説明 |
|-------------|-----|------|------|
| groupId | GroupId | 必須 | グループの一意識別子 |
| name | string | 必須 | グループ名 |
| code | string | 必須 | グループコード（システム全体で一意） |

#### ビヘイビア

```typescript
// グループ名を変更する
rename(name: string): void
// 前提条件: name が空文字でないこと
// 事後条件: name が更新される
// エラー: name が空の場合は EmptyGroupNameError
```

#### 不変条件

- `name` は空文字であってはならない
- `code` はシステム全体で一意でなければならない（リポジトリ層で保証）

#### ライフサイクル

1. **作成**: 管理者がグループを新規追加する
2. **更新**: グループ名変更
3. **削除**: 管理者がグループを削除する。メンバーの所属解除が前提

---

### Session（セッション）

ユーザーのログインから明示的なログアウトまたはタイムアウトまでの認証済み接続を表す。

#### フィールド

| フィールド名 | 型 | 必須 | 説明 |
|-------------|-----|------|------|
| sessionId | SessionId | 必須 | セッションの一意識別子 |
| userId | UserId | 必須 | セッションを所有するユーザーの ID |
| ipAddress | string | 必須 | 接続元 IP アドレス |
| userAgent | string | 必須 | ブラウザ / OS 情報 |
| country | string | 任意 | 接続元の国（ジオロケーション） |
| createdAt | Date | 必須 | セッション開始日時（ログイン日時） |
| expiresAt | Date | 必須 | セッション有効期限（15分〜24時間、設定に依存） |

#### ビヘイビア

```typescript
// セッションが有効期限切れかどうかを判定する
isExpired(now: Date): boolean
// 戻り値: now >= expiresAt の場合 true

// セッションを明示的に終了する（ログアウト・強制終了）
terminate(): void
// 事後条件: expiresAt が現在時刻に設定される（即座に無効化）
```

#### 不変条件

- `expiresAt > createdAt` でなければならない
- `ipAddress` は空文字であってはならない
- `userAgent` は空文字であってはならない

#### ライフサイクル

1. **作成**: ユーザーがログインに成功した時点で作成される
2. **有効**: expiresAt に達するまで有効。リクエストのたびに有効性が検証される
3. **期限切れ**: expiresAt を超過した場合、自動的に無効となる
4. **終了**: ユーザーの明示的ログアウト、または管理者による強制終了で即座に無効化される
5. **削除**: 期限切れまたは終了済みのセッションはリポジトリから削除される

---

## 値オブジェクト

### UserId

ユーザーの一意識別子。

```typescript
type UserId = {
  readonly value: string; // UUID v4 形式
};

// 等価性: value が一致すれば等しい
// バリデーション: 空文字でないこと、有効な UUID 形式であること
```

### OrganizationId

組織の一意識別子。

```typescript
type OrganizationId = {
  readonly value: string; // UUID v4 形式
};

// 等価性: value が一致すれば等しい
// バリデーション: 空文字でないこと、有効な UUID 形式であること
```

### GroupId

グループの一意識別子。

```typescript
type GroupId = {
  readonly value: string; // UUID v4 形式
};

// 等価性: value が一致すれば等しい
// バリデーション: 空文字でないこと、有効な UUID 形式であること
```

### SessionId

セッションの一意識別子。

```typescript
type SessionId = {
  readonly value: string; // UUID v4 形式
};

// 等価性: value が一致すれば等しい
// バリデーション: 空文字でないこと、有効な UUID 形式であること
```

### FileKey

ファイルの一意識別子（File ドメインへの参照用）。

```typescript
type FileKey = {
  readonly value: string;
};

// 等価性: value が一致すれば等しい
// バリデーション: 空文字でないこと
```

### LoginName

ログインに使用する一意の識別子。メールアドレス形式。

```typescript
type LoginName = {
  readonly value: string;
};

// 等価性: value の小文字比較で一致すれば等しい（大文字小文字を区別しない）
// バリデーション:
//   - 空文字でないこと
//   - 有効なメールアドレス形式であること
//   - システム全体で一意であること（リポジトリ層で保証）
```

### Email

メールアドレス。

```typescript
type Email = {
  readonly value: string;
};

// 等価性: value の小文字比較で一致すれば等しい（大文字小文字を区別しない）
// バリデーション:
//   - 空文字でないこと
//   - RFC 5322 に準拠した有効なメールアドレス形式であること
//   - ローカルパート + "@" + ドメインパートの構造を持つこと
```

### Timezone

ユーザーの日時表示に使用するタイムゾーン。約80の標準タイムゾーンから選択。

```typescript
type Timezone = {
  readonly value: string; // IANA タイムゾーン識別子（例: "Asia/Tokyo", "America/New_York"）
};

// 等価性: value が一致すれば等しい
// バリデーション: 許可されたタイムゾーン識別子のリストに含まれること
// デフォルト値: "Asia/Tokyo"（UTC+09:00）
// 選択肢: UTC-12:00 から UTC+13:00 の範囲で約80個
```

### Language

ユーザーの画面表示言語。7言語をサポートする。

```typescript
type Language = {
  readonly value: "ja" | "en" | "zh-CN" | "zh-TW" | "es" | "pt-BR" | "th";
};

// 等価性: value が一致すれば等しい
// バリデーション: 上記の7値のいずれかであること
// デフォルト値: "ja"
// 対応言語:
//   - "ja": 日本語
//   - "en": English (US)
//   - "zh-CN": 中文(简体)
//   - "zh-TW": 中文(繁體)
//   - "es": Espanol
//   - "pt-BR": Portugues (Brasil)
//   - "th": Thai
```

### Password

平文パスワード。バリデーションを行った後、ハッシュ化されて HashedPassword に変換される。一時的なオブジェクトであり、永続化されない。

```typescript
type Password = {
  readonly value: string;
};

// 等価性: 比較しない（セキュリティ上、平文パスワード同士の比較は行わない）
// バリデーション:
//   - パスワードポリシーで設定された最小文字数（3〜15文字、デフォルト8）以上であること
//   - 複雑さ要件を満たすこと:
//     - "none": 制限なし
//     - "alphanumeric": アルファベットと数字の両方を含むこと
//     - "alphanumeric_symbol": アルファベット・数字・特殊文字をすべて含むこと
//   - ログイン名と同一でないこと（ポリシーで禁止されている場合）
//   - 過去に使用したパスワードでないこと（ポリシーで設定された履歴数分）
```

### HashedPassword

ハッシュ化されたパスワード。永続化される。

```typescript
type HashedPassword = {
  readonly value: string;    // ハッシュ値（bcrypt 等のアルゴリズムで生成）
  readonly algorithm: string; // 使用したハッシュアルゴリズム（例: "bcrypt"）
};

// 等価性: 比較しない（ハッシュ値同士の直接比較は行わない。検証は PasswordHasher ポートを使用する）
// バリデーション: value が空文字でないこと
```

### ApiToken

REST API のプログラム的アクセスに使用する認証トークン。

```typescript
type ApiToken = {
  readonly value: string;       // トークン文字列
  readonly scopes: ApiScope[];  // トークンに付与されたスコープ
};

// 等価性: value が一致すれば等しい
// バリデーション:
//   - value が空文字でないこと
//   - scopes が1つ以上含まれること

type ApiScope =
  | "k:app_record:read"
  | "k:app_record:write"
  | "k:app_settings:read"
  | "k:app_settings:write"
  | "k:file:read"
  | "k:file:write";
```

### OAuthToken

OAuth 2.0 フローで発行されるトークンの組。

```typescript
type OAuthToken = {
  readonly accessToken: string;   // アクセストークン
  readonly refreshToken: string;  // リフレッシュトークン
  readonly expiresAt: Date;       // アクセストークンの有効期限（発行から1時間）
  readonly scopes: ApiScope[];    // 付与されたスコープ
};

// 等価性: accessToken が一致すれば等しい
// バリデーション:
//   - accessToken が空文字でないこと
//   - refreshToken が空文字でないこと
//   - expiresAt が現在時刻より未来であること（生成時）
//   - scopes が1つ以上含まれること
```

### PasswordPolicy

パスワードに関するセキュリティポリシー設定。

```typescript
type PasswordPolicy = {
  readonly minLength: number;                            // 最小文字数（3〜15、デフォルト8）
  readonly complexity: "none" | "alphanumeric" | "alphanumeric_symbol";
                                                          // 複雑さ要件
  readonly allowSameAsLoginName: boolean;                // ログイン名と同一パスワードを許可するか
  readonly expirationDays: number | null;                // 有効期間（日数）。null は無期限
  readonly historyCount: number;                         // 過去パスワード禁止数（0〜15）
  readonly allowUserChange: boolean;                     // ユーザー自身によるパスワード変更を許可するか
  readonly allowUserReset: boolean;                      // ユーザー自身によるパスワードリセットを許可するか
};

// 等価性: 全フィールドが一致すれば等しい
// バリデーション:
//   - minLength は 3〜15 の範囲内であること
//   - historyCount は 0〜15 の範囲内であること
//   - expirationDays が null でない場合、正の整数であること
```

### LockoutPolicy

アカウントロックアウトに関するポリシー設定。

```typescript
type LockoutPolicy = {
  readonly maxFailedAttempts: number | null; // ロックアウトまでの失敗回数（3〜10）。null はロックアウトしない
  readonly lockoutDuration: number | null;   // ロックアウト解除までの時間（分）。null は解除しない
};

// 等価性: 全フィールドが一致すれば等しい
// バリデーション:
//   - maxFailedAttempts が null でない場合、3〜10 の範囲内であること
//   - lockoutDuration が null でない場合、正の整数であること（3/15/30/60分）
```

### SessionPolicy

セッションに関するポリシー設定。

```typescript
type SessionPolicy = {
  readonly timeoutMinutes: number; // セッション有効期間（分）。15〜1440（=24時間）。デフォルト1440
};

// 等価性: 全フィールドが一致すれば等しい
// バリデーション:
//   - timeoutMinutes は 15〜1440 の範囲内であること
```

---

## ドメインサービス

### AuthenticationService

認証に関するビジネスロジックを提供する。複数の認証方式を統一的に扱う。

#### 依存ポート

- UserRepository
- SessionRepository
- PasswordHasher
- AuthenticationProvider

#### メソッド

```typescript
// パスワード認証を行い、セッションを作成する
authenticateByPassword(params: {
  loginName: LoginName;
  password: Password;
  ipAddress: string;
  userAgent: string;
  country?: string;
  sessionPolicy: SessionPolicy;
}): Result<Session, AuthenticationError>
// 処理:
//   1. UserRepository からログイン名でユーザーを検索
//   2. ユーザーが存在しない場合は InvalidCredentialsError を返す
//   3. ユーザーが無効（isActive === false）の場合は UserInactiveError を返す
//   4. PasswordHasher でパスワードを検証
//   5. パスワードが一致しない場合は InvalidCredentialsError を返す
//   6. ロックアウト判定（失敗回数の閾値チェック）
//   7. セッションを作成して SessionRepository に保存
//   8. 作成された Session を返す

// API トークンによる認証を行う
authenticateByApiToken(params: {
  token: string;
}): Result<{ userId: UserId; scopes: ApiScope[] }, AuthenticationError>
// 処理:
//   1. AuthenticationProvider でトークンを検証
//   2. 無効なトークンの場合は InvalidTokenError を返す
//   3. ユーザー ID とスコープを返す

// OAuth アクセストークンによる認証を行う
authenticateByOAuth(params: {
  accessToken: string;
}): Result<{ userId: UserId; scopes: ApiScope[] }, AuthenticationError>
// 処理:
//   1. AuthenticationProvider でアクセストークンを検証
//   2. トークンが期限切れの場合は TokenExpiredError を返す
//   3. 無効なトークンの場合は InvalidTokenError を返す
//   4. ユーザー ID とスコープを返す

// セッション認証を行う（Cookie ベース）
authenticateBySession(params: {
  sessionId: SessionId;
  csrfToken?: string;     // POST/PUT/DELETE 時は必須
  requestMethod: string;
}): Result<UserId, AuthenticationError>
// 処理:
//   1. SessionRepository からセッションを取得
//   2. セッションが存在しない場合は SessionNotFoundError を返す
//   3. セッションが期限切れの場合は SessionExpiredError を返す
//   4. POST/PUT/DELETE メソッドの場合、CSRF トークンを検証
//   5. CSRF トークンが不正の場合は InvalidCsrfTokenError を返す
//   6. ユーザー ID を返す

// セッションを終了する（ログアウト）
terminateSession(sessionId: SessionId): Result<void, SessionNotFoundError>
// 処理:
//   1. SessionRepository からセッションを取得
//   2. セッションが存在しない場合は SessionNotFoundError を返す
//   3. Session.terminate() を呼び出す
//   4. SessionRepository に保存（または削除）する

// 指定ユーザーの全セッションを終了する（管理者による強制終了）
terminateAllSessions(userId: UserId): Result<void, UserNotFoundError>
// 処理:
//   1. UserRepository でユーザーの存在を確認
//   2. SessionRepository.deleteByUserId() で全セッションを削除
```

---

### OrganizationService

組織のツリー構造に関するビジネスロジックを提供する。単一エンティティでは解決できない、ツリー横断的な操作を担う。

#### 依存ポート

- OrganizationRepository
- UserRepository

#### メソッド

```typescript
// 指定組織の祖先組織を取得する（ルートまで遡る）
getAncestors(organizationId: OrganizationId): Result<Organization[], OrganizationNotFoundError>
// 処理:
//   1. OrganizationRepository から組織を取得
//   2. parentOrganizationId を辿ってルートまで再帰的に取得
//   3. ルートから対象組織の親までの順序で返す

// 指定組織の子孫組織を取得する（全階層）
getDescendants(organizationId: OrganizationId): Result<Organization[], OrganizationNotFoundError>
// 処理:
//   1. OrganizationRepository から子組織を再帰的に取得
//   2. 幅優先または深さ優先でフラットなリストとして返す

// 指定組織に所属するユーザーを取得する（サブ組織を含むかどうかを選択可能）
getUsersInOrganization(params: {
  organizationId: OrganizationId;
  includeSubOrganizations: boolean;
}): Result<User[], OrganizationNotFoundError>
// 処理:
//   1. OrganizationRepository で組織の存在を確認
//   2. includeSubOrganizations が true の場合、getDescendants で子孫を取得
//   3. 対象組織（+ 子孫組織）の ID リストで UserRepository から検索
//   4. 重複を排除してユーザーリストを返す

// 組織の移動が循環参照を引き起こさないか検証する
validateMove(params: {
  organizationId: OrganizationId;
  newParentOrganizationId: OrganizationId | null;
}): Result<void, CircularReferenceError | OrganizationNotFoundError>
// 処理:
//   1. newParentOrganizationId が null の場合、ルートへの移動なので常に有効
//   2. newParentOrganizationId が organizationId と同一の場合は CircularReferenceError
//   3. newParentOrganizationId の祖先を辿り、organizationId が含まれていないことを確認
//   4. 含まれている場合は CircularReferenceError を返す
```

---

## ポート

### UserRepository

ユーザーの永続化を担うリポジトリインターフェース。

```typescript
interface UserRepository {
  // ID でユーザーを取得する
  findById(userId: UserId): Promise<User | null>;

  // メールアドレスでユーザーを取得する
  findByEmail(email: Email): Promise<User | null>;

  // ログイン名でユーザーを取得する
  findByLoginName(loginName: LoginName): Promise<User | null>;

  // 指定組織に所属するユーザーを取得する
  findByOrganizationId(organizationId: OrganizationId): Promise<User[]>;

  // 指定グループに所属するユーザーを取得する
  findByGroupId(groupId: GroupId): Promise<User[]>;

  // ユーザーを保存する（新規作成または更新）
  save(user: User): Promise<void>;
  // エラー: LoginName が重複する場合は DuplicateLoginNameError
  // エラー: Email が重複する場合は DuplicateEmailError

  // ユーザーを削除する
  delete(userId: UserId): Promise<void>;
  // エラー: ユーザーが存在しない場合は UserNotFoundError

  // ユーザー一覧を取得する（ページネーション付き）
  list(params: {
    offset: number;
    limit: number;
    filter?: {
      isActive?: boolean;       // 有効/無効でフィルタ
      keyword?: string;         // 表示名・ログイン名・メールアドレスで部分一致検索
    };
  }): Promise<{ users: User[]; totalCount: number }>;
}
```

### OrganizationRepository

組織の永続化を担うリポジトリインターフェース。

```typescript
interface OrganizationRepository {
  // ID で組織を取得する
  findById(organizationId: OrganizationId): Promise<Organization | null>;

  // コードで組織を取得する
  findByCode(code: string): Promise<Organization | null>;

  // 指定親組織の子組織を取得する（直下のみ）
  findByParentId(parentOrganizationId: OrganizationId | null): Promise<Organization[]>;
  // parentOrganizationId が null の場合はルート組織を返す

  // ルート組織を取得する（parentOrganizationId が null の組織）
  findRoot(): Promise<Organization[]>;

  // 組織を保存する（新規作成または更新）
  save(organization: Organization): Promise<void>;
  // エラー: code が重複する場合は DuplicateOrganizationCodeError

  // 組織を削除する
  delete(organizationId: OrganizationId): Promise<void>;
  // エラー: 組織が存在しない場合は OrganizationNotFoundError
  // エラー: 子組織が存在する場合は OrganizationHasChildrenError
  // エラー: 所属ユーザーが存在する場合は OrganizationHasMembersError
}
```

### GroupRepository

グループの永続化を担うリポジトリインターフェース。

```typescript
interface GroupRepository {
  // ID でグループを取得する
  findById(groupId: GroupId): Promise<Group | null>;

  // コードでグループを取得する
  findByCode(code: string): Promise<Group | null>;

  // グループを保存する（新規作成または更新）
  save(group: Group): Promise<void>;
  // エラー: code が重複する場合は DuplicateGroupCodeError

  // グループを削除する
  delete(groupId: GroupId): Promise<void>;
  // エラー: グループが存在しない場合は GroupNotFoundError

  // グループ一覧を取得する（ページネーション付き）
  list(params: {
    offset: number;
    limit: number;
    keyword?: string; // グループ名・コードで部分一致検索
  }): Promise<{ groups: Group[]; totalCount: number }>;
}
```

### SessionRepository

セッションの永続化を担うリポジトリインターフェース。

```typescript
interface SessionRepository {
  // ID でセッションを取得する
  findById(sessionId: SessionId): Promise<Session | null>;

  // 指定ユーザーのセッション一覧を取得する
  findByUserId(userId: UserId): Promise<Session[]>;

  // セッションを保存する（新規作成または更新）
  save(session: Session): Promise<void>;

  // セッションを削除する
  delete(sessionId: SessionId): Promise<void>;
  // エラー: セッションが存在しない場合は SessionNotFoundError

  // 指定ユーザーの全セッションを削除する
  deleteByUserId(userId: UserId): Promise<void>;

  // 有効期限切れのセッションを一括削除する（バッチ処理用）
  deleteExpired(now: Date): Promise<number>;
  // 戻り値: 削除されたセッション数
}
```

### AuthenticationProvider

外部認証メカニズムとの連携を担うポートインターフェース。

```typescript
interface AuthenticationProvider {
  // パスワード認証を行う（ハッシュ化パスワードとの照合）
  authenticate(params: {
    loginName: LoginName;
    password: Password;
    hashedPassword: HashedPassword;
  }): Promise<Result<void, InvalidCredentialsError>>;

  // API トークンを検証し、ユーザー ID とスコープを返す
  validateApiToken(token: string): Promise<
    Result<{ userId: UserId; scopes: ApiScope[] }, InvalidTokenError>
  >;

  // OAuth アクセストークンを検証し、ユーザー ID とスコープを返す
  validateOAuthToken(accessToken: string): Promise<
    Result<{ userId: UserId; scopes: ApiScope[] }, InvalidTokenError | TokenExpiredError>
  >;

  // OAuth リフレッシュトークンを使って新しいアクセストークンを取得する
  refreshOAuthToken(refreshToken: string): Promise<
    Result<OAuthToken, InvalidTokenError>
  >;
}
```

### PasswordHasher

パスワードのハッシュ化と検証を担うポートインターフェース。

```typescript
interface PasswordHasher {
  // 平文パスワードをハッシュ化する
  hash(password: Password): Promise<HashedPassword>;

  // 平文パスワードがハッシュと一致するかを検証する
  verify(password: Password, hashedPassword: HashedPassword): Promise<boolean>;
}
```

### MembershipRepository

ユーザーと組織・グループの所属関係を管理するリポジトリインターフェース。

```typescript
interface MembershipRepository {
  // ユーザーを組織に追加する
  addUserToOrganization(params: {
    userId: UserId;
    organizationId: OrganizationId;
  }): Promise<void>;
  // エラー: すでに所属している場合は AlreadyMemberError

  // ユーザーを組織から削除する
  removeUserFromOrganization(params: {
    userId: UserId;
    organizationId: OrganizationId;
  }): Promise<void>;
  // エラー: 所属していない場合は NotMemberError

  // ユーザーをグループに追加する
  addUserToGroup(params: {
    userId: UserId;
    groupId: GroupId;
  }): Promise<void>;
  // エラー: すでに所属している場合は AlreadyMemberError

  // ユーザーをグループから削除する
  removeUserFromGroup(params: {
    userId: UserId;
    groupId: GroupId;
  }): Promise<void>;
  // エラー: 所属していない場合は NotMemberError

  // ユーザーが所属する組織の ID 一覧を取得する
  getOrganizationIdsByUserId(userId: UserId): Promise<OrganizationId[]>;

  // ユーザーが所属するグループの ID 一覧を取得する
  getGroupIdsByUserId(userId: UserId): Promise<GroupId[]>;
}
```

---

## エラー型

```typescript
// 認証エラーの基底型
type AuthenticationError =
  | InvalidCredentialsError    // ログイン名またはパスワードが不正
  | UserInactiveError          // ユーザーが無効化されている
  | AccountLockedError         // アカウントがロックアウトされている
  | InvalidTokenError          // API トークンまたは OAuth トークンが不正
  | TokenExpiredError          // OAuth アクセストークンが期限切れ
  | SessionNotFoundError       // セッションが存在しない
  | SessionExpiredError        // セッションが期限切れ
  | InvalidCsrfTokenError;     // CSRF トークンが不正

// エンティティ操作エラー
type InvalidCredentialsError = { kind: "InvalidCredentials" };
type UserInactiveError = { kind: "UserInactive"; userId: UserId };
type AccountLockedError = { kind: "AccountLocked"; userId: UserId; unlockAt: Date | null };
type InvalidTokenError = { kind: "InvalidToken" };
type TokenExpiredError = { kind: "TokenExpired" };
type SessionNotFoundError = { kind: "SessionNotFound"; sessionId: SessionId };
type SessionExpiredError = { kind: "SessionExpired"; sessionId: SessionId };
type InvalidCsrfTokenError = { kind: "InvalidCsrfToken" };

type UserNotFoundError = { kind: "UserNotFound"; userId: UserId };
type OrganizationNotFoundError = { kind: "OrganizationNotFound"; organizationId: OrganizationId };
type GroupNotFoundError = { kind: "GroupNotFound"; groupId: GroupId };

type DuplicateLoginNameError = { kind: "DuplicateLoginName"; loginName: LoginName };
type DuplicateEmailError = { kind: "DuplicateEmail"; email: Email };
type DuplicateOrganizationCodeError = { kind: "DuplicateOrganizationCode"; code: string };
type DuplicateGroupCodeError = { kind: "DuplicateGroupCode"; code: string };

type CircularReferenceError = { kind: "CircularReference"; organizationId: OrganizationId; targetParentId: OrganizationId };
type OrganizationHasChildrenError = { kind: "OrganizationHasChildren"; organizationId: OrganizationId };
type OrganizationHasMembersError = { kind: "OrganizationHasMembers"; organizationId: OrganizationId };

type AlreadyActiveError = { kind: "AlreadyActive"; userId: UserId };
type AlreadyInactiveError = { kind: "AlreadyInactive"; userId: UserId };
type AlreadyMemberError = { kind: "AlreadyMember" };
type NotMemberError = { kind: "NotMember" };

type EmptyDisplayNameError = { kind: "EmptyDisplayName" };
type EmptyOrganizationNameError = { kind: "EmptyOrganizationName" };
type EmptyGroupNameError = { kind: "EmptyGroupName" };
type InvalidOrderIndexError = { kind: "InvalidOrderIndex"; index: number };
```

---

## ユースケース（概要）

### 認証

| # | ユースケース名 | 概要 | 主要アクター |
|---|--------------|------|-------------|
| 1 | ログイン（パスワード認証） | メールアドレスとパスワードでログインし、セッションを作成する | 未認証ユーザー |
| 2 | ログアウト | 現在のセッションを終了する | 認証済みユーザー |
| 3 | パスワード変更 | 現在のパスワードを確認した上で新しいパスワードに変更する | 認証済みユーザー |
| 4 | API トークン発行 | アプリに紐づく API トークンを新規生成する | アプリ管理者 |
| 5 | API トークン無効化 | 発行済みの API トークンを無効化する | アプリ管理者 |
| 6 | OAuth トークンリフレッシュ | リフレッシュトークンを使って新しいアクセストークンを取得する | 外部サービス |

### ユーザー管理

| # | ユースケース名 | 概要 | 主要アクター |
|---|--------------|------|-------------|
| 7 | ユーザー作成 | 新規ユーザーを作成する。ログイン名・表示名・メールアドレスが必須 | システム管理者 |
| 8 | ユーザー更新（プロフィール編集） | 表示名・タイムゾーン・言語などのプロフィール情報を更新する | 認証済みユーザー / 管理者 |
| 9 | ユーザー無効化 | ユーザーを停止状態にする。ログイン不可になり全セッションが終了される | システム管理者 |
| 10 | ユーザー有効化 | 停止中のユーザーを再び使用可能にする | システム管理者 |
| 11 | ユーザー削除 | ユーザーを完全に削除する | システム管理者 |

### 組織管理

| # | ユースケース名 | 概要 | 主要アクター |
|---|--------------|------|-------------|
| 12 | 組織の作成 | 新規組織を作成する。ルート組織または既存組織の子として作成する | システム管理者 |
| 13 | 組織の更新 | 組織名の変更、親組織の変更（ツリー内移動）、表示順序の変更を行う | システム管理者 |
| 14 | 組織の削除 | 組織を削除する。子組織と所属ユーザーが存在しないことが前提 | システム管理者 |
| 15 | 組織へのユーザー追加 | ユーザーを組織のメンバーとして追加する | システム管理者 |
| 16 | 組織からのユーザー削除 | ユーザーを組織のメンバーから削除する | システム管理者 |

### グループ管理

| # | ユースケース名 | 概要 | 主要アクター |
|---|--------------|------|-------------|
| 17 | グループの作成 | 新規グループを作成する | システム管理者 |
| 18 | グループの更新 | グループ名を変更する | システム管理者 |
| 19 | グループの削除 | グループを削除する。所属ユーザーの解除が前提 | システム管理者 |
| 20 | グループへのユーザー追加 | ユーザーをグループのメンバーとして追加する | システム管理者 |
| 21 | グループからのユーザー削除 | ユーザーをグループのメンバーから削除する | システム管理者 |

### セッション管理

| # | ユースケース名 | 概要 | 主要アクター |
|---|--------------|------|-------------|
| 22 | セッション一覧取得 | 現在有効なセッションの一覧を取得する（5件/ページ） | 認証済みユーザー |
| 23 | セッション強制終了 | 指定したセッションを強制終了する（他端末のログアウト） | 認証済みユーザー |
| 24 | ログイン履歴取得 | 過去のログイン記録を取得する（過去2週間、同端末最新10件） | 認証済みユーザー |
