# SystemSettings ユースケース定義

## 1. ヘッダー色の取得

### 概要

現在のヘッダーカラー設定（HEX コード）を取得する。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| （入力パラメータなし） | ― | ― | ― |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| hex | string |

### 処理フロー

1. `SystemSettingsRepository.findByKey("header_color")` でヘッダー色設定を取得する
2. 設定が存在しない場合は SettingNotFoundError を返す
3. 設定値を HeaderColor として出力 DTO に返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 設定キーが存在しない | SettingNotFoundError |

---

## 2. ヘッダー色の更新

### 概要

ヘッダーの背景色を HEX コードで指定して更新する。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| hex | string | 必須 | `/^#[0-9a-fA-F]{6}$/` にマッチすること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| hex | string |

### 処理フロー

1. hex が `/^#[0-9a-fA-F]{6}$/` にマッチすることを検証する。マッチしない場合は InvalidHexColorError を返す
2. `SystemSettingsRepository.findByKey("header_color")` でヘッダー色設定を取得する
3. 設定が存在しない場合は SettingNotFoundError を返す
4. `SystemSetting.updateValue(HeaderColor)` で設定値を更新する
5. `SystemSettingsRepository.save()` で永続化する
6. 更新後の設定値を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| hex が HEX カラーコード形式でない | InvalidHexColorError |
| 設定キーが存在しない | SettingNotFoundError |

---

## 3. 利用する機能の取得

### 概要

メール通知、スペース、ゲストスペース、ピープル/メッセージ、利用状況ダッシュボード等の ON/OFF 状態と詳細設定を取得する。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| （入力パラメータなし） | ― | ― | ― |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| emailNotification | { enabled: boolean; defaultReceive: "SELF_ONLY" \| "NONE"; format: "HTML" \| "TEXT"; allowUserFormatChange: boolean; notifyRestApi: boolean } |
| space | { enabled: boolean; allowStandaloneApp: boolean } |
| guestSpace | { enabled: boolean } |
| peopleAndMessage | { enabled: boolean } |
| usageDashboard | { enabled: boolean } |

### 処理フロー

1. `SystemSettingsRepository.findByKey("feature_flags")` で機能選択設定を取得する
2. 設定が存在しない場合は SettingNotFoundError を返す
3. 設定値を FeatureFlags として出力 DTO に返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 設定キーが存在しない | SettingNotFoundError |

---

## 4. 利用する機能の更新

### 概要

各機能の有効/無効を切り替え、メール通知の詳細設定（形式、受信既定値、REST API 通知等）を更新する。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| emailNotification | { enabled: boolean; defaultReceive: "SELF_ONLY" \| "NONE"; format: "HTML" \| "TEXT"; allowUserFormatChange: boolean; notifyRestApi: boolean } | 必須 | defaultReceive は "SELF_ONLY" または "NONE"、format は "HTML" または "TEXT" であること |
| space | { enabled: boolean; allowStandaloneApp: boolean } | 必須 | ― |
| guestSpace | { enabled: boolean } | 必須 | ― |
| peopleAndMessage | { enabled: boolean } | 必須 | ― |
| usageDashboard | { enabled: boolean } | 必須 | ― |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| emailNotification | { enabled: boolean; defaultReceive: "SELF_ONLY" \| "NONE"; format: "HTML" \| "TEXT"; allowUserFormatChange: boolean; notifyRestApi: boolean } |
| space | { enabled: boolean; allowStandaloneApp: boolean } |
| guestSpace | { enabled: boolean } |
| peopleAndMessage | { enabled: boolean } |
| usageDashboard | { enabled: boolean } |

### 処理フロー

1. 入力値のバリデーションを行う。不正な場合は InvalidSettingValueError を返す
2. `SystemSettingsRepository.findByKey("feature_flags")` で機能選択設定を取得する
3. 設定が存在しない場合は SettingNotFoundError を返す
4. `SystemSetting.updateValue(FeatureFlags)` で設定値を更新する
5. `SystemSettingsRepository.save()` で永続化する
6. 更新後の設定値を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 入力値が FeatureFlags の型制約を満たさない | InvalidSettingValueError |
| 設定キーが存在しない | SettingNotFoundError |

---

## 5. アクセス制限設定の取得

### 概要

IP アドレス制限と Basic 認証の設定を取得する。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| （入力パラメータなし） | ― | ― | ― |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| ipRestrictionEnabled | boolean |
| allowedIps | { cidr: string; description: string }[] |
| basicAuthEnabled | boolean |
| basicAuthUsername | string \| null |

### 処理フロー

1. `SystemSettingsRepository.findByKey("access_restriction")` でアクセス制限設定を取得する
2. 設定が存在しない場合は SettingNotFoundError を返す
3. 設定値を AccessRestriction として出力 DTO に返す（basicAuthPasswordHash は出力に含めない）

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 設定キーが存在しない | SettingNotFoundError |

---

## 6. アクセス制限設定の更新

### 概要

IP アドレス制限の追加/削除と Basic 認証の設定を更新する。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| ipRestrictionEnabled | boolean | 必須 | ― |
| allowedIps | { cidr: string; description: string }[] | 必須 | 各 cidr が有効な CIDR 形式であること |
| basicAuthEnabled | boolean | 必須 | ― |
| basicAuthUsername | string \| null | 任意 | basicAuthEnabled が true の場合は必須かつ空文字でないこと |
| basicAuthPassword | string \| null | 任意 | basicAuthEnabled が true の場合は必須かつ空文字でないこと（更新時のみ。変更なしの場合は null） |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| ipRestrictionEnabled | boolean |
| allowedIps | { cidr: string; description: string }[] |
| basicAuthEnabled | boolean |
| basicAuthUsername | string \| null |

### 処理フロー

1. allowedIps の各 cidr が有効な CIDR 形式であることを検証する。不正な場合は InvalidCidrError を返す
2. basicAuthEnabled が true の場合、basicAuthUsername が空文字でないことを検証する。空の場合は InvalidSettingValueError を返す
3. `SystemSettingsRepository.findByKey("access_restriction")` でアクセス制限設定を取得する
4. 設定が存在しない場合は SettingNotFoundError を返す
5. basicAuthPassword が指定されている場合はハッシュ化する。null の場合は既存のハッシュを維持する
6. `SystemSetting.updateValue(AccessRestriction)` で設定値を更新する
7. `SystemSettingsRepository.save()` で永続化する
8. 更新後の設定値を出力 DTO として返す（basicAuthPasswordHash は出力に含めない）

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| cidr が有効な CIDR 形式でない | InvalidCidrError |
| basicAuthEnabled が true で basicAuthUsername が空文字 | InvalidSettingValueError |
| 設定キーが存在しない | SettingNotFoundError |

---

## 7. ログインセキュリティ設定の取得

### 概要

パスワードポリシー、ロックアウトポリシー、セッションポリシー、SAML 認証、2 要素認証の全設定を一括取得する。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| （入力パラメータなし） | ― | ― | ― |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| passwordPolicy | PasswordPolicy |
| lockoutPolicy | LockoutPolicy |
| sessionPolicy | SessionPolicy |
| samlAuth | SamlAuth |
| twoFactorAuth | TwoFactorAuth |

### 処理フロー

1. 以下の設定キーを並列で取得する:
   - `SystemSettingsRepository.findByKey("password_policy")`
   - `SystemSettingsRepository.findByKey("lockout_policy")`
   - `SystemSettingsRepository.findByKey("session_policy")`
   - `SystemSettingsRepository.findByKey("saml_auth")`
   - `SystemSettingsRepository.findByKey("two_factor_auth")`
2. いずれかの設定が存在しない場合は SettingNotFoundError を返す
3. 各設定値を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| いずれかの設定キーが存在しない | SettingNotFoundError |

---

## 8. パスワードポリシーの更新

### 概要

パスワードの最小文字数、複雑さ、有効期間、履歴制限等を更新する。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| userMinLength | number | 必須 | 3 以上 15 以下 |
| adminMinLength | number | 必須 | 3 以上 15 以下 |
| complexity | PasswordComplexity | 必須 | "NONE" \| "ALPHANUMERIC" \| "ALPHANUMERIC_SPECIAL" のいずれか |
| allowSameAsLoginName | boolean | 必須 | ― |
| expirationDays | number \| null | 必須 | null または正の整数 |
| historyCount | number | 必須 | 0 以上 15 以下 |
| allowUserChange | boolean | 必須 | ― |
| requireChangeOnNextLogin | boolean | 必須 | ― |
| allowUserReset | boolean | 必須 | ― |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| userMinLength | number |
| adminMinLength | number |
| complexity | PasswordComplexity |
| allowSameAsLoginName | boolean |
| expirationDays | number \| null |
| historyCount | number |
| allowUserChange | boolean |
| requireChangeOnNextLogin | boolean |
| allowUserReset | boolean |

### 処理フロー

1. userMinLength が 3 以上 15 以下であることを検証する。範囲外の場合は PasswordPolicyOutOfRangeError を返す
2. adminMinLength が 3 以上 15 以下であることを検証する。範囲外の場合は PasswordPolicyOutOfRangeError を返す
3. historyCount が 0 以上 15 以下であることを検証する。範囲外の場合は PasswordPolicyOutOfRangeError を返す
4. `SystemSettingsRepository.findByKey("password_policy")` でパスワードポリシー設定を取得する
5. 設定が存在しない場合は SettingNotFoundError を返す
6. `SystemSetting.updateValue(PasswordPolicy)` で設定値を更新する
7. `SystemSettingsRepository.save()` で永続化する
8. 更新後の設定値を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| userMinLength が 3 未満または 15 超 | PasswordPolicyOutOfRangeError |
| adminMinLength が 3 未満または 15 超 | PasswordPolicyOutOfRangeError |
| historyCount が 0 未満または 15 超 | PasswordPolicyOutOfRangeError |
| 設定キーが存在しない | SettingNotFoundError |

---

## 9. ロックアウトポリシーの更新

### 概要

ロックアウト条件（失敗回数、解除時間、失敗メッセージ）を更新する。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| maxFailedAttempts | number \| null | 必須 | null または 3 以上 10 以下 |
| lockoutDurationMinutes | number \| null | 必須 | null または 3 \| 15 \| 30 \| 60 のいずれか |
| failedLoginMessage | Record<string, string> | 必須 | キーが言語コード、値が空文字でないこと |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| maxFailedAttempts | number \| null |
| lockoutDurationMinutes | number \| null |
| failedLoginMessage | Record<string, string> |

### 処理フロー

1. maxFailedAttempts が null でない場合、3 以上 10 以下であることを検証する。範囲外の場合は InvalidSettingValueError を返す
2. lockoutDurationMinutes が null でない場合、3, 15, 30, 60 のいずれかであることを検証する。不正な場合は InvalidSettingValueError を返す
3. `SystemSettingsRepository.findByKey("lockout_policy")` でロックアウトポリシー設定を取得する
4. 設定が存在しない場合は SettingNotFoundError を返す
5. `SystemSetting.updateValue(LockoutPolicy)` で設定値を更新する
6. `SystemSettingsRepository.save()` で永続化する
7. 更新後の設定値を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| maxFailedAttempts が null でなく 3 未満または 10 超 | InvalidSettingValueError |
| lockoutDurationMinutes が null でなく許可値以外 | InvalidSettingValueError |
| 設定キーが存在しない | SettingNotFoundError |

---

## 10. セッションポリシーの更新

### 概要

セッション有効期間、自動補完、ブラウザ保存、自動ログインの設定を更新する。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| sessionLifetimeMinutes | number | 必須 | 正の整数であること |
| allowAutoComplete | boolean | 必須 | ― |
| allowBrowserSave | boolean | 必須 | ― |
| allowAutoLogin | boolean | 必須 | ― |
| autoLoginExpiration | AutoLoginExpiration \| null | 必須 | allowAutoLogin が true の場合は "1_DAY" \| "1_WEEK" \| "1_MONTH" のいずれか。false の場合は null |
| allowMismatchedApiAuth | boolean | 必須 | ― |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| sessionLifetimeMinutes | number |
| allowAutoComplete | boolean |
| allowBrowserSave | boolean |
| allowAutoLogin | boolean |
| autoLoginExpiration | AutoLoginExpiration \| null |
| allowMismatchedApiAuth | boolean |

### 処理フロー

1. sessionLifetimeMinutes が正の整数であることを検証する。不正な場合は InvalidSettingValueError を返す
2. allowAutoLogin が true の場合、autoLoginExpiration が "1_DAY", "1_WEEK", "1_MONTH" のいずれかであることを検証する。不正な場合は InvalidSettingValueError を返す
3. allowAutoLogin が false の場合、autoLoginExpiration を null に強制する
4. `SystemSettingsRepository.findByKey("session_policy")` でセッションポリシー設定を取得する
5. 設定が存在しない場合は SettingNotFoundError を返す
6. `SystemSetting.updateValue(SessionPolicy)` で設定値を更新する
7. `SystemSettingsRepository.save()` で永続化する
8. 更新後の設定値を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| sessionLifetimeMinutes が正の整数でない | InvalidSettingValueError |
| allowAutoLogin が true で autoLoginExpiration が不正 | InvalidSettingValueError |
| 設定キーが存在しない | SettingNotFoundError |

---

## 11. SAML 認証設定の更新

### 概要

SAML 認証の有効/無効を切り替える。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| enabled | boolean | 必須 | ― |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| enabled | boolean |

### 処理フロー

1. `SystemSettingsRepository.findByKey("saml_auth")` で SAML 認証設定を取得する
2. 設定が存在しない場合は SettingNotFoundError を返す
3. `SystemSetting.updateValue(SamlAuth)` で設定値を更新する
4. `SystemSettingsRepository.save()` で永続化する
5. 更新後の設定値を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 設定キーが存在しない | SettingNotFoundError |

---

## 12. 2 要素認証設定の更新

### 概要

2 要素認証のユーザー許可を切り替える。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| enabled | boolean | 必須 | ― |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| enabled | boolean |

### 処理フロー

1. `SystemSettingsRepository.findByKey("two_factor_auth")` で 2 要素認証設定を取得する
2. 設定が存在しない場合は SettingNotFoundError を返す
3. `SystemSetting.updateValue(TwoFactorAuth)` で設定値を更新する
4. `SystemSettingsRepository.save()` で永続化する
5. 更新後の設定値を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 設定キーが存在しない | SettingNotFoundError |

---

## 13. ゲストユーザー認証設定の取得

### 概要

ゲストユーザーの二段階認証の有効/無効状態を取得する。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| （入力パラメータなし） | ― | ― | ― |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| twoFactorEnabled | boolean |

### 処理フロー

1. `SystemSettingsRepository.findByKey("guest_auth")` でゲストユーザー認証設定を取得する
2. 設定が存在しない場合は SettingNotFoundError を返す
3. 設定値を GuestAuth として出力 DTO に返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 設定キーが存在しない | SettingNotFoundError |

---

## 14. ゲストユーザー認証設定の更新

### 概要

ゲストユーザーの二段階認証の有効/無効を切り替える。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| twoFactorEnabled | boolean | 必須 | ― |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| twoFactorEnabled | boolean |

### 処理フロー

1. `SystemSettingsRepository.findByKey("guest_auth")` でゲストユーザー認証設定を取得する
2. 設定が存在しない場合は SettingNotFoundError を返す
3. `SystemSetting.updateValue(GuestAuth)` で設定値を更新する
4. `SystemSettingsRepository.save()` で永続化する
5. 更新後の設定値を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 設定キーが存在しない | SettingNotFoundError |

---

## 15. スマートフォン表示設定の取得

### 概要

表示モードとユーザー切替許可の設定を取得する。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| （入力パラメータなし） | ― | ― | ― |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| displayMode | "MOBILE" \| "PC" |
| allowUserToggle | boolean |

### 処理フロー

1. `SystemSettingsRepository.findByKey("mobile_display")` でスマートフォン表示設定を取得する
2. 設定が存在しない場合は SettingNotFoundError を返す
3. 設定値を MobileDisplay として出力 DTO に返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 設定キーが存在しない | SettingNotFoundError |

---

## 16. スマートフォン表示設定の更新

### 概要

表示モード（モバイル版/PC版）とユーザー切替許可を更新する。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| displayMode | "MOBILE" \| "PC" | 必須 | "MOBILE" または "PC" であること |
| allowUserToggle | boolean | 必須 | ― |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| displayMode | "MOBILE" \| "PC" |
| allowUserToggle | boolean |

### 処理フロー

1. displayMode が "MOBILE" または "PC" であることを検証する。不正な場合は InvalidSettingValueError を返す
2. `SystemSettingsRepository.findByKey("mobile_display")` でスマートフォン表示設定を取得する
3. 設定が存在しない場合は SettingNotFoundError を返す
4. `SystemSetting.updateValue(MobileDisplay)` で設定値を更新する
5. `SystemSettingsRepository.save()` で永続化する
6. 更新後の設定値を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| displayMode が不正な値 | InvalidSettingValueError |
| 設定キーが存在しない | SettingNotFoundError |

---

## 17〜32. 残りの設定セクション（共通パターン）

以下のユースケースは上記と同一の get/update パターンに従う。取得系は入力パラメータなしで `SystemSettingsRepository.findByKey(key)` を呼び出し、更新系は入力バリデーション後に `SystemSetting.updateValue()` で更新し `SystemSettingsRepository.save()` で永続化する。

### 17. JavaScript/CSS カスタマイズ設定の取得

- **キー**: `"js_css_customization"`
- **出力**: JsCssCustomization（scope, pcJsFiles, mobileJsFiles, pcCssFiles, mobileCssFiles）
- **エラー**: SettingNotFoundError

### 18. JavaScript/CSS カスタマイズ設定の更新

- **キー**: `"js_css_customization"`
- **入力**: scope（CustomizationScope）、pcJsFiles, mobileJsFiles, pcCssFiles, mobileCssFiles（各 CustomFile[]）
- **バリデーション**: scope が "ALL_USERS" \| "ADMIN_ONLY" \| "DISABLED" のいずれか。各ファイルの type が "URL" \| "UPLOAD" のいずれか
- **エラー**: InvalidSettingValueError, SettingNotFoundError

### 19. アップデートオプションの取得

- **キー**: `"update_option"`
- **出力**: UpdateOption（channel, disabledFeatures, disabledLatestOnlyFeatures, earlyAccessFeatures, experimentalFeatures, apiLabFeatures）
- **エラー**: SettingNotFoundError

### 20. アップデートオプションの更新

- **キー**: `"update_option"`
- **入力**: channel（UpdateChannel）、disabledFeatures, disabledLatestOnlyFeatures, earlyAccessFeatures, experimentalFeatures, apiLabFeatures（各 FeatureToggle[]）
- **バリデーション**: channel が "LATEST" \| "MONTHLY" のいずれか
- **エラー**: InvalidSettingValueError, SettingNotFoundError

### 21. アプリの共通設定の取得

- **キー**: `"shared_app_settings"`
- **出力**: SharedAppSettings（prohibitEveryoneAdmin）
- **エラー**: SettingNotFoundError

### 22. アプリの共通設定の更新

- **キー**: `"shared_app_settings"`
- **入力**: prohibitEveryoneAdmin（boolean）
- **バリデーション**: なし（boolean のみ）
- **エラー**: SettingNotFoundError

### 23. その他の設定（外部連携）の取得

- **キー**: `"external_integration"`
- **出力**: ExternalIntegration（allowIframe, referrerPolicySameOrigin, allowWebhook）
- **エラー**: SettingNotFoundError

### 24. その他の設定（外部連携）の更新

- **キー**: `"external_integration"`
- **入力**: allowIframe（boolean）、referrerPolicySameOrigin（boolean）、allowWebhook（boolean）
- **バリデーション**: なし（boolean のみ）
- **エラー**: SettingNotFoundError

### 25. システムメール設定の取得

- **キー**: `"system_mail"`
- **出力**: SystemMail（fromAddress, serverType, externalServer）
- **エラー**: SettingNotFoundError

### 26. システムメール設定の更新

- **キー**: `"system_mail"`
- **入力**: fromAddress（string）、serverType（MailServerType）、externalServer（ExternalMailServer \| null）
- **バリデーション**: fromAddress が空文字でないこと。serverType が "EXTERNAL" の場合は externalServer が必須かつ host, port, username, passwordEncrypted が空でないこと。serverType が "BUILTIN" の場合は externalServer は null であること
- **エラー**: InvalidSettingValueError, SettingNotFoundError

### 27. ロケール設定の取得

- **キー**: `"locale"`
- **出力**: Locale（timezone, language）
- **エラー**: SettingNotFoundError

### 28. ロケール設定の更新

- **キー**: `"locale"`
- **入力**: timezone（string）、language（SupportedLanguage）
- **バリデーション**: timezone が空文字でないこと。language が SupportedLanguage のいずれかであること
- **エラー**: InvalidSettingValueError, SettingNotFoundError

### 29. ロゴ設定の取得

- **キー**: `"logo"`
- **出力**: Logo（imageFileId, linkUrl）
- **エラー**: SettingNotFoundError

### 30. ロゴ設定の更新

- **キー**: `"logo"`
- **入力**: imageFileId（string \| null）、linkUrl（string）
- **バリデーション**: linkUrl が空文字でないこと
- **エラー**: InvalidSettingValueError, SettingNotFoundError

### 31. ログインページ設定の取得

- **キー**: `"login_page"`
- **出力**: LoginPage（title, backgroundImageFileId）
- **エラー**: SettingNotFoundError

### 32. ログインページ設定の更新

- **キー**: `"login_page"`
- **入力**: title（string）、backgroundImageFileId（string \| null）
- **バリデーション**: title が空文字でないこと
- **エラー**: InvalidSettingValueError, SettingNotFoundError
