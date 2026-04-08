# SystemSettings ドメイン設計

## 概要

SystemSettings ドメインは、OpenDesk プラットフォーム全体のシステム設定の読み書きを一元管理する Supporting ドメインである。設定は key-value ストア（`system_settings` テーブル）に永続化され、各設定セクションの値は型安全な値オブジェクトとして定義される。OpenDeskシステム管理側の設定（ヘッダー色、機能選択、モバイル表示等）と cybozu.com 共通管理側の設定（ログインセキュリティ、アクセス制限、ロケール等）の両方を包含する。

**ドメイン種別**: Supporting

**責務境界**:
- システム全体の設定値の取得・更新を管理する
- 各設定セクションに対応する型安全な値オブジェクトの定義を担う
- 設定キーに基づく key-value ストアの読み書きを担う
- 個別ユーザーの設定（プロフィール、通知等）は対象外であり、各ドメインが担う
- アクセス権の判定（誰が設定を変更できるか）は AccessControl ドメインの責務であり、ユースケース層で連携する

---

## ユビキタス言語

| 英語名 | 日本語名 | 定義 |
|--------|---------|------|
| SystemSetting | システム設定 | 設定キーと JSON 形式の設定値のペア。設定セクションごとに1レコードが対応する |
| SettingKey | 設定キー | システム設定を一意に識別する文字列キー。セクションごとに定義される |
| HeaderColor | ヘッダーの色 | OpenDesk 画面ヘッダーの背景色。HEX コード形式で指定する |
| FeatureFlags | 利用する機能の選択 | メール通知、スペース、ゲストスペース、ピープル/メッセージ等の ON/OFF を管理するフラグ群 |
| GuestAuth | ゲストユーザーの認証 | ゲストユーザーのログイン時二段階認証の有効/無効設定 |
| MobileDisplay | スマートフォンでの表示 | モバイル版/PC版の表示モードとユーザーによる切替許可の設定 |
| JsCssCustomization | JavaScript/CSSカスタマイズ | JS/CSS ファイルの適用範囲とファイル設定 |
| UpdateOption | アップデートオプション | アップデートチャネルの選択と新機能制御の設定 |
| SharedAppSettings | アプリの共通設定 | Everyone への管理権限付与禁止等のアプリ全体に適用される設定 |
| PasswordPolicy | パスワードポリシー | パスワードの最小文字数、複雑さ、有効期間、履歴制限等のポリシー |
| LockoutPolicy | ロックアウトポリシー | ログイン失敗時のアカウントロックアウト条件と解除条件 |
| SessionPolicy | セッションポリシー | ログインセッション有効期間、自動ログイン許可等のセッション制御 |
| LoginSecurity | ログインセキュリティ | SAML認証、2FA、パスワードポリシー、ロックアウト、セッション等のログイン関連セキュリティ設定の総称 |
| AccessRestriction | アクセス制限 | IP アドレス制限と Basic 認証の設定 |
| ExternalIntegration | その他の設定（外部連携） | iframe 許可、Referrer-Policy、Webhook 許可の設定 |
| SystemMail | システムメール | メールサーバーの種別（組み込み/外部）とメールアドレス設定 |
| Locale | ロケール | タイムゾーンと表示言語の設定 |
| Logo | ロゴ | 画面左上のロゴ画像とリンク先 URL の設定 |
| LoginPage | ログインページ | ログインページのタイトルと背景画像の設定 |

---

## 他ドメインとの関係

| 参照先ドメイン | 参照方法 | 用途 |
|--------------|---------|------|
| AccessControl | ユースケース層で連携 | 設定変更権限（システム管理者/共通管理者）の確認 |
| File | FileId（値オブジェクト） | JS/CSS ファイル、ロゴ画像、ログインページ背景画像の参照 |

SystemSettings ドメインは他ドメインのエンティティを直接保持しない。FileId はアップロード済みファイルを参照するために値オブジェクトとして保持するのみ。

---

## エンティティ

### SystemSetting（システム設定）

設定キーと型安全な設定値のペア。各設定セクション（ヘッダー色、機能選択、ログインセキュリティ等）に対して1レコードが対応する。

#### フィールド

| フィールド名 | 型 | 必須 | 説明 |
|-------------|-----|------|------|
| settingId | SettingId | 必須 | システム設定の一意識別子 |
| key | SettingKey | 必須 | 設定セクションを一意に識別するキー |
| value | SettingValue | 必須 | 設定値。SettingKey に対応する値オブジェクトの型で型安全にアクセスする |
| updatedAt | Date | 必須 | 最終更新日時 |

#### ビヘイビア

```typescript
/**
 * 設定値を更新する。
 * @param value 新しい設定値
 * @throws InvalidSettingValueError value が当該 key に対して不正な場合
 */
updateValue(value: SettingValue): void
// 前提条件: value が当該 key に対応する値オブジェクトの型として有効であること
// 事後条件: value と updatedAt が更新される
```

#### 不変条件

- `key` は作成後に変更不可
- `settingId` は作成後に変更不可
- `value` は `key` に対応する値オブジェクトの型制約を満たすこと

#### ライフサイクル

1. **初期化**: システム初回セットアップ時にデフォルト値で作成される（マイグレーションまたは初期化処理）
2. **更新**: 管理画面から設定セクションごとに値を変更して保存する
3. **削除**: 通常は削除しない（システムに必須の設定であるため）

---

## 値オブジェクト

### SettingId

システム設定の一意識別子。

```typescript
type SettingId = {
  readonly value: string; // UUID v7 形式
};

// 等価性: value が一致すれば等しい
// バリデーション: 空文字でないこと、有効な UUID 形式であること
```

### SettingKey

設定セクションを一意に識別する文字列キー。

```typescript
type SettingKey =
  // OpenDeskシステム管理
  | "header_color"
  | "feature_flags"
  | "guest_auth"
  | "mobile_display"
  | "js_css_customization"
  | "update_option"
  | "shared_app_settings"
  // cybozu.com共通管理
  | "password_policy"
  | "lockout_policy"
  | "session_policy"
  | "saml_auth"
  | "two_factor_auth"
  | "access_restriction"
  | "external_integration"
  | "system_mail"
  | "locale"
  | "logo"
  | "login_page";
```

### SettingValue（ユニオン型）

SettingKey に対応する値オブジェクトのユニオン型。key によって型が一意に決定される。

```typescript
type SettingValue =
  | HeaderColor
  | FeatureFlags
  | GuestAuth
  | MobileDisplay
  | JsCssCustomization
  | UpdateOption
  | SharedAppSettings
  | PasswordPolicy
  | LockoutPolicy
  | SessionPolicy
  | SamlAuth
  | TwoFactorAuth
  | AccessRestriction
  | ExternalIntegration
  | SystemMail
  | Locale
  | Logo
  | LoginPage;
```

### HeaderColor（ヘッダーの色）

```typescript
type HeaderColor = {
  readonly hex: string; // HEX カラーコード（例: "#ffcc00"）
};

// バリデーション: /^#[0-9a-fA-F]{6}$/ にマッチすること
// デフォルト値: "#ffcc00"
```

### FeatureFlags（利用する機能の選択）

```typescript
type FeatureFlags = {
  readonly emailNotification: {
    readonly enabled: boolean;           // 通知のメール送信機能を利用する
    readonly defaultReceive: "SELF_ONLY" | "NONE"; // 受信設定の既定値
    readonly format: "HTML" | "TEXT";    // メール通知の形式
    readonly allowUserFormatChange: boolean; // 個人設定による変更を許可する
    readonly notifyRestApi: boolean;     // REST APIの通知をメールで送信
  };
  readonly space: {
    readonly enabled: boolean;            // スペース機能を利用する
    readonly allowStandaloneApp: boolean; // スペースに所属しないアプリの作成を許可する
  };
  readonly guestSpace: {
    readonly enabled: boolean; // ゲストスペース機能を利用する
  };
  readonly peopleAndMessage: {
    readonly enabled: boolean; // ピープル機能とメッセージ機能を利用する
  };
  readonly usageDashboard: {
    readonly enabled: boolean; // 利用状況ダッシュボード機能を利用する
  };
};
```

### GuestAuth（ゲストユーザーの認証）

```typescript
type GuestAuth = {
  readonly twoFactorEnabled: boolean; // ゲストユーザーの認証に二段階認証を利用する
};
```

### MobileDisplay（スマートフォンでの表示）

```typescript
type MobileDisplay = {
  readonly displayMode: "MOBILE" | "PC"; // 表示モード（モバイル版/PC版）
  readonly allowUserToggle: boolean;     // ユーザー自身による表示の切り替えを許可する
};
```

### JsCssCustomization（JavaScript/CSSカスタマイズ）

```typescript
type CustomizationScope = "ALL_USERS" | "ADMIN_ONLY" | "DISABLED";

type CustomFile = {
  readonly type: "URL" | "UPLOAD"; // URL指定 or アップロード
  readonly url: string;            // URL（type=URL の場合は外部URL、type=UPLOAD の場合は内部ファイルパス）
  readonly fileId: string | null;  // アップロードファイルの場合の FileId
};

type JsCssCustomization = {
  readonly scope: CustomizationScope;       // 適用範囲
  readonly pcJsFiles: readonly CustomFile[];         // PC用のJavaScriptファイル
  readonly mobileJsFiles: readonly CustomFile[];     // スマートフォン用のJavaScriptファイル
  readonly pcCssFiles: readonly CustomFile[];        // PC用のCSSファイル
  readonly mobileCssFiles: readonly CustomFile[];    // スマートフォン用のCSSファイル
};

// バリデーション: 各ファイルは最大20MB
```

### UpdateOption（アップデートオプション）

```typescript
type UpdateChannel = "LATEST" | "MONTHLY";

type FeatureToggle = {
  readonly featureId: string;   // 新機能の識別子
  readonly name: string;        // 新機能の表示名
  readonly enabled: boolean;    // 有効/無効
  readonly expiresAt: Date | null; // 無効化期限（期限付きの場合）
};

type UpdateOption = {
  readonly channel: UpdateChannel;                       // アップデートチャネルの選択
  readonly disabledFeatures: readonly FeatureToggle[];            // 新機能の無効化
  readonly disabledLatestOnlyFeatures: readonly FeatureToggle[];  // 最新チャネル限定の新機能の無効化
  readonly earlyAccessFeatures: readonly FeatureToggle[];         // リリース予定の新機能の先行利用
  readonly experimentalFeatures: readonly FeatureToggle[];        // 検討中の新機能
  readonly apiLabFeatures: readonly FeatureToggle[];              // API ラボ
};
```

### SharedAppSettings（アプリの共通設定）

```typescript
type SharedAppSettings = {
  readonly prohibitEveryoneAdmin: boolean; // Everyoneグループへのアプリ管理権限の付与を禁止する
};
```

### PasswordPolicy（パスワードポリシー）

```typescript
type PasswordComplexity = "NONE" | "ALPHANUMERIC" | "ALPHANUMERIC_SPECIAL";

type PasswordPolicy = {
  readonly userMinLength: number;               // ユーザーパスワードの最小文字数（3〜15、デフォルト8）
  readonly adminMinLength: number;              // 管理者パスワードの最小文字数（3〜15、デフォルト8）
  readonly complexity: PasswordComplexity;      // 複雑さの要件
  readonly allowSameAsLoginName: boolean;       // ログイン名と同じパスワードの使用を許可
  readonly expirationDays: number | null;       // 有効期間（日数）。null は無期限
  readonly historyCount: number;                // 過去に使用したパスワードの禁止数（0〜15。0は制限なし）
  readonly allowUserChange: boolean;            // パスワードの変更をユーザーに許可
  readonly requireChangeOnNextLogin: boolean;   // パスワードの変更要求
  readonly allowUserReset: boolean;             // パスワードのリセットをユーザーに許可
};

// バリデーション:
//   userMinLength: 3以上15以下
//   adminMinLength: 3以上15以下
//   historyCount: 0以上15以下
```

### LockoutPolicy（ロックアウトポリシー）

```typescript
type LockoutPolicy = {
  readonly maxFailedAttempts: number | null; // アカウントロックアウトまでのログイン失敗回数（3〜10、null はロックアウトしない。デフォルト10）
  readonly lockoutDurationMinutes: number | null; // ロックアウト解除までの時間（分）。null は自動解除しない（デフォルト3）
  readonly failedLoginMessage: Record<string, string>; // ログイン失敗時のメッセージ（言語コード → メッセージ）
};

// バリデーション:
//   maxFailedAttempts: null または 3以上10以下
//   lockoutDurationMinutes: null または 3 | 15 | 30 | 60
```

### SessionPolicy（セッションポリシー）

```typescript
type AutoLoginExpiration = "1_DAY" | "1_WEEK" | "1_MONTH";

type SessionPolicy = {
  readonly sessionLifetimeMinutes: number;      // ログインセッション有効期間（分。デフォルト1440=24時間）
  readonly allowAutoComplete: boolean;          // ログイン名の自動補完
  readonly allowBrowserSave: boolean;           // ログイン名とパスワードのWebブラウザへの保存を許可
  readonly allowAutoLogin: boolean;             // 自動ログインをユーザーに許可する
  readonly autoLoginExpiration: AutoLoginExpiration | null; // 自動ログイン有効期間（allowAutoLogin が false の場合は null）
  readonly allowMismatchedApiAuth: boolean;     // セキュアアクセス利用時の不一致許可
};
```

### SamlAuth（SAML認証）

```typescript
type SamlAuth = {
  readonly enabled: boolean; // SAML認証を有効にする
};
```

### TwoFactorAuth（2要素認証）

```typescript
type TwoFactorAuth = {
  readonly enabled: boolean; // 2要素認証の利用をユーザーに許可する
};
```

### AccessRestriction（アクセス制限）

```typescript
type IpRestrictionEntry = {
  readonly cidr: string;        // CIDR 表記の IP アドレス範囲
  readonly description: string; // 説明
};

type AccessRestriction = {
  readonly ipRestrictionEnabled: boolean;                    // IP アドレス制限の有効/無効
  readonly allowedIps: readonly IpRestrictionEntry[];                 // 許可する IP アドレス一覧
  readonly basicAuthEnabled: boolean;                        // Basic 認証の有効/無効
  readonly basicAuthUsername: string | null;                  // Basic 認証ユーザー名
  readonly basicAuthPasswordHash: string | null;             // Basic 認証パスワードハッシュ
};
```

### ExternalIntegration（その他の設定 - 外部連携）

```typescript
type ExternalIntegration = {
  readonly allowIframe: boolean;        // 外部サイトへの埋め込み（iframe）を許可
  readonly referrerPolicySameOrigin: boolean; // Referrer-Policy: same-origin ヘッダーを付与（デフォルト true）
  readonly allowWebhook: boolean;       // Webhookの送信を許可する（デフォルト true）
};
```

### SystemMail（システムメール）

```typescript
type MailServerType = "BUILTIN" | "EXTERNAL";

type ExternalMailServer = {
  readonly host: string;
  readonly port: number;
  readonly username: string;
  readonly passwordEncrypted: string; // 暗号化済みパスワード
  readonly useTls: boolean;
};

type SystemMail = {
  readonly fromAddress: string;                     // システムメールアドレス
  readonly serverType: MailServerType;              // メールサーバー種別
  readonly externalServer: ExternalMailServer | null; // 外部サーバー設定（serverType が EXTERNAL の場合のみ）
};
```

### Locale（ロケール）

```typescript
type SupportedLanguage =
  | "ja"      // 日本語
  | "en_US"   // English (US)
  | "zh_CN"   // 中文（简体）
  | "zh_TW"   // 中文（繁體）
  | "es"      // Espanol
  | "pt_BR"   // Portugues (Brasil)
  | "th";     // Thai

type Locale = {
  readonly timezone: string;          // IANA タイムゾーン名（例: "Asia/Tokyo"）
  readonly language: SupportedLanguage; // 表示言語
};
```

### Logo（ロゴ）

```typescript
type Logo = {
  readonly imageFileId: string | null;  // ロゴ画像の FileId（未設定の場合は null）
  readonly linkUrl: string;             // ロゴのリンク先 URL
};

// バリデーション: 画像ファイルは最大800KB
```

### LoginPage（ログインページ）

```typescript
type LoginPage = {
  readonly title: string;                       // ログインページのタイトル
  readonly backgroundImageFileId: string | null; // 背景画像の FileId（未設定の場合は null）
};

// バリデーション: 背景画像は最大5MB
```

---

## ドメインサービス

シンプルな key-value 設定の読み書きであるため、専用のドメインサービスは不要。値オブジェクトのバリデーションはエンティティのビヘイビアおよび値オブジェクトの生成時に行う。

---

## ポート

### SystemSettingsRepository

システム設定の永続化を担うリポジトリインターフェース。

```typescript
interface SystemSettingsRepository {
  /**
   * 設定キーでシステム設定を取得する。
   * @param key 設定キー
   * @returns システム設定。存在しない場合は null
   */
  findByKey(key: SettingKey): Promise<SystemSetting | null>;

  /**
   * 全てのシステム設定を取得する。
   * @returns システム設定の配列
   */
  findAll(): Promise<SystemSetting[]>;

  /**
   * システム設定を保存する（新規作成・更新の両方に対応）。
   * @param setting 保存対象のシステム設定
   */
  save(setting: SystemSetting): Promise<void>;
}
```

---

## エラー型

```typescript
// 設定キーが存在しないエラー
type SettingNotFoundError = {
  kind: "SettingNotFound";
  key: SettingKey;
};

// 設定値が不正なエラー
type InvalidSettingValueError = {
  kind: "InvalidSettingValue";
  key: SettingKey;
  reason: string;
};

// HEX カラーコードが不正なエラー
type InvalidHexColorError = {
  kind: "InvalidHexColor";
  value: string;
};

// パスワードポリシーの値が範囲外エラー
type PasswordPolicyOutOfRangeError = {
  kind: "PasswordPolicyOutOfRange";
  field: string;
  min: number;
  max: number;
  actual: number;
};

// IP アドレス制限の CIDR 形式が不正なエラー
type InvalidCidrError = {
  kind: "InvalidCidr";
  value: string;
};
```

---

## ユースケース（概要）

### OpenDeskシステム管理

| # | ユースケース名 | 概要 | 主要アクター |
|---|--------------|------|-------------|
| 1 | ヘッダー色の取得 | 現在のヘッダーカラー設定（HEX コード）を取得する | システム管理者 |
| 2 | ヘッダー色の更新 | ヘッダーの背景色を HEX コードまたはプリセットから選択して更新する | システム管理者 |
| 3 | 利用する機能の取得 | メール通知、スペース、ゲストスペース、ピープル/メッセージ等の ON/OFF 状態を取得する | システム管理者 |
| 4 | 利用する機能の更新 | 各機能の有効/無効を切り替え、関連する詳細設定（メール形式、受信既定値等）を更新する | システム管理者 |
| 5 | ゲストユーザー認証設定の取得 | ゲストユーザーの二段階認証の有効/無効状態を取得する | システム管理者 |
| 6 | ゲストユーザー認証設定の更新 | ゲストユーザーの二段階認証の有効/無効を切り替える | システム管理者 |
| 7 | スマートフォン表示設定の取得 | 表示モードとユーザー切替許可の設定を取得する | システム管理者 |
| 8 | スマートフォン表示設定の更新 | 表示モード（モバイル版/PC版）とユーザー切替許可を更新する | システム管理者 |
| 9 | JavaScript/CSSカスタマイズ設定の取得 | 適用範囲とファイル設定を取得する | システム管理者 |
| 10 | JavaScript/CSSカスタマイズ設定の更新 | 適用範囲とJS/CSSファイルの設定を更新する | システム管理者 |
| 11 | アップデートオプションの取得 | アップデートチャネルと各新機能のトグル状態を取得する | システム管理者 |
| 12 | アップデートオプションの更新 | アップデートチャネルの選択と新機能の有効/無効を更新する | システム管理者 |
| 13 | アプリの共通設定の取得 | Everyone への管理権限付与禁止設定を取得する | システム管理者 |
| 14 | アプリの共通設定の更新 | Everyone への管理権限付与禁止を切り替える | システム管理者 |

### cybozu.com共通管理

| # | ユースケース名 | 概要 | 主要アクター |
|---|--------------|------|-------------|
| 15 | ログインセキュリティ設定の取得 | パスワードポリシー、ロックアウトポリシー、セッションポリシー、SAML認証、2FA の全設定を取得する | 共通管理者 |
| 16 | パスワードポリシーの更新 | パスワードの最小文字数、複雑さ、有効期間、履歴制限等を更新する | 共通管理者 |
| 17 | ロックアウトポリシーの更新 | ロックアウト条件（失敗回数、解除時間、失敗メッセージ）を更新する | 共通管理者 |
| 18 | セッションポリシーの更新 | セッション有効期間、自動補完、ブラウザ保存、自動ログインの設定を更新する | 共通管理者 |
| 19 | SAML認証設定の更新 | SAML 認証の有効/無効を切り替える | 共通管理者 |
| 20 | 2要素認証設定の更新 | 2要素認証のユーザー許可を切り替える | 共通管理者 |
| 21 | アクセス制限設定の取得 | IP アドレス制限と Basic 認証の設定を取得する | 共通管理者 |
| 22 | アクセス制限設定の更新 | IP アドレス制限の追加/削除と Basic 認証の設定を更新する | 共通管理者 |
| 23 | その他の設定（外部連携）の取得 | iframe 許可、Referrer-Policy、Webhook 許可の設定を取得する | 共通管理者 |
| 24 | その他の設定（外部連携）の更新 | iframe 許可、Referrer-Policy、Webhook 許可を切り替える | 共通管理者 |
| 25 | システムメール設定の取得 | メールサーバー種別とアドレス設定を取得する | 共通管理者 |
| 26 | システムメール設定の更新 | メールサーバー種別の切替と外部サーバー設定を更新する | 共通管理者 |
| 27 | ロケール設定の取得 | タイムゾーンと表示言語の設定を取得する | 共通管理者 |
| 28 | ロケール設定の更新 | タイムゾーンと表示言語を更新する | 共通管理者 |
| 29 | ロゴ設定の取得 | ロゴ画像とリンク先 URL を取得する | 共通管理者 |
| 30 | ロゴ設定の更新 | ロゴ画像のアップロードとリンク先 URL を更新する | 共通管理者 |
| 31 | ログインページ設定の取得 | ログインページのタイトルと背景画像を取得する | 共通管理者 |
| 32 | ログインページ設定の更新 | ログインページのタイトルと背景画像を更新する | 共通管理者 |
