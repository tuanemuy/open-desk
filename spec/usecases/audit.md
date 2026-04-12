# Audit ユースケース定義

## 1. 監査ログ記録

### 概要

各ドメインのユースケースから Outbox パターンのイベント経由で監査ログを記録する。レベル・日時・接続元IP・ユーザー・サービス・モジュール・アクション・結果・エラー番号を保存する。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| level | AuditLevel | 必須 | "CRITICAL" または "INFO" であること |
| timestamp | Date | 必須 | 有効な日時であること |
| sourceIp | string \| null | 任意 | null 許容（システム内部処理の場合） |
| userId | UserId \| null | 任意 | null 許容（システム処理の場合）。指定時は有効な UserId 形式であること |
| service | ServiceType | 必須 | 有効な ServiceType であること |
| module | string | 必須 | 空文字でないこと |
| action | string | 必須 | 空文字でないこと |
| result | AuditResult | 必須 | "SUCCESS" または "FAILURE" であること |
| errorCode | string \| null | 任意 | null 許容。result が "SUCCESS" の場合は null であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| auditLogId | AuditLogId |

### 処理フロー

1. module が空文字でないことを検証する。空の場合は EmptyModuleError を返す
2. action が空文字でないことを検証する。空の場合は EmptyActionError を返す
3. result が "SUCCESS" かつ errorCode が非 null の場合、errorCode を null に補正する（不変条件の維持）
4. AuditLog エンティティを新規作成する（auditLogId は新規生成、level, timestamp, sourceIp, userId, service, module, action, result, errorCode を設定）
5. `AuditLogRepository.save()` で永続化する
6. 作成された監査ログの auditLogId を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| module が空文字 | EmptyModuleError |
| action が空文字 | EmptyActionError |

---

## 2. 監査ログ一覧取得

### 概要

フィルタ条件（日時範囲・レベル・ユーザー・サービス・モジュール・アクション・結果）を指定して監査ログを検索・取得する。保持期間（6週間未満）内のログのみ対象。日時の降順で返す。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| filter | AuditFilter | 必須 | 有効な AuditFilter であること |
| limit | number | 必須 | 1 以上であること |
| offset | number | 必須 | 0 以上であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| logs | { auditLogId: AuditLogId; level: AuditLevel; timestamp: Date; sourceIp: string \| null; userId: UserId \| null; service: ServiceType; module: string; action: string; result: AuditResult; errorCode: string \| null }[] |
| totalCount | number |

### 処理フロー

1. AuditFilter のバリデーションを行う
   - dateFrom と dateTo が両方指定されている場合、dateFrom <= dateTo であることを検証する。違反時は InvalidAuditFilterError を返す
   - dateFrom が指定されている場合、保持期間（6週間前）より古い日時でないことを検証する。違反時は InvalidAuditFilterError を返す
   - dateFrom が未指定の場合、保持期間（6週間前）を dateFrom として自動設定する
2. `AuditLogRepository.findByFilter(filter, limit, offset)` でフィルタ条件に一致する監査ログを取得する
3. 監査ログ一覧と総件数を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| dateFrom > dateTo | InvalidAuditFilterError |
| dateFrom が保持期間（6週間前）より古い | InvalidAuditFilterError |

---

## 3. 監査ログ CSV ダウンロード

### 概要

フィルタ条件に一致する監査ログを CSV 形式でダウンロードする。最大10万件まで出力可能。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| filter | AuditFilter | 必須 | 有効な AuditFilter であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| logs | { auditLogId: AuditLogId; level: AuditLevel; timestamp: Date; sourceIp: string \| null; userId: UserId \| null; service: ServiceType; module: string; action: string; result: AuditResult; errorCode: string \| null }[] |
| totalCount | number |

### 処理フロー

1. AuditFilter のバリデーションを行う
   - dateFrom と dateTo が両方指定されている場合、dateFrom <= dateTo であることを検証する。違反時は InvalidAuditFilterError を返す
   - dateFrom が指定されている場合、保持期間（6週間前）より古い日時でないことを検証する。違反時は InvalidAuditFilterError を返す
   - dateFrom が未指定の場合、保持期間（6週間前）を dateFrom として自動設定する
2. `AuditLogRepository.findForExport(filter)` でフィルタ条件に一致する監査ログを取得する（最大10万件）
3. 取得件数が10万件を超える場合は ExportLimitExceededError を返す
4. 監査ログ一覧と総件数を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| dateFrom > dateTo | InvalidAuditFilterError |
| dateFrom が保持期間（6週間前）より古い | InvalidAuditFilterError |
| 取得件数が10万件を超える | ExportLimitExceededError |

---

## 4. 監査ログ設定取得

### 概要

現在の監査ログ設定（保存対象の設定等）を取得する。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| （入力パラメータなし） | ― | ― | ― |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| setting | AuditLogSetting |

### 処理フロー

1. `AuditLogSettingRepository.find()` で現在の監査ログ設定を取得する
2. 監査ログ設定を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| （このユースケースではエラーケースは発生しない。設定が未作成の場合はデフォルト値が返る） | ― |

---

## 5. 監査ログ設定更新

### 概要

監査ログの保存対象やレベルに関する設定を更新する。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| setting | AuditLogSetting | 必須 | 有効な AuditLogSetting であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| setting | AuditLogSetting |

### 処理フロー

1. `AuditLogSettingRepository.find()` で現在の監査ログ設定を取得する
2. 入力の setting で設定を上書きする
3. `AuditLogSettingRepository.save(setting)` で永続化する
4. 更新後の監査ログ設定を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| （AuditLogSetting のバリデーションエラーはドメインモデルから発生） | ― |

---

## 6. 期限切れ監査ログ削除

### 概要

保持期間（6週間）を超過した監査ログを一括削除する。定期バッチで実行される。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| retentionWeeks | number | 必須 | 1 以上であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| deletedCount | number |

### 処理フロー

1. retentionWeeks が 1 以上であることを検証する。違反時は InvalidRetentionPeriodError を返す
2. `AuditLogRepository.deleteExpired(retentionWeeks)` で保持期間を超過した監査ログを一括削除する
3. 削除された件数を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| retentionWeeks が 1 未満 | InvalidRetentionPeriodError |

---

## 7. アクセス記録

### 概要

ユーザーのアクセスを記録し、最終アクセス日と過去30日間のアクセス日数を更新する。ユーザーの初回アクセス時は UserAccessUsage を新規作成する。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| userId | UserId | 必須 | 有効な UserId 形式であること |
| accessDate | Date | 必須 | 有効な日時であること。未来の日付でないこと |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| userId | UserId |
| lastAccessDate | Date |
| accessDaysLast30 | number |

### 処理フロー

1. accessDate が未来の日付でないことを検証する。違反時は InvalidAccessDaysError を返す
2. `UserAccessUsageRepository.findByUserId(userId)` でアクセス状況を取得する
3. アクセス状況が存在しない場合、UserAccessUsage エンティティを新規作成する（userId, lastAccessDate: null, accessDaysLast30: 0）
4. `UserAccessUsage.recordAccess(accessDate)` を呼び出し、lastAccessDate と accessDaysLast30 を更新する
5. `UserAccessUsageRepository.save(usage)` で永続化する
6. 更新後のアクセス状況を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| accessDate が未来の日付 | InvalidAccessDaysError |

---

## 8. アクセス状況一覧取得

### 概要

全ユーザーのアクセス状況（ユーザー・最終アクセス日・過去30日間のアクセス日数）を取得する。ユーザー名順で返す。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| （入力パラメータなし） | ― | ― | ― |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| usages | { userId: UserId; lastAccessDate: Date \| null; accessDaysLast30: number }[] |

### 処理フロー

1. `UserAccessUsageRepository.findAll()` で全ユーザーのアクセス状況を取得する（ユーザー名順）
2. アクセス状況一覧を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| （このユースケースではエラーケースは発生しない。ユーザーが0件の場合は空配列で返る） | ― |

---

## 9. アクセス状況 CSV ダウンロード

### 概要

全ユーザーのアクセス状況一覧を CSV 形式でダウンロードする。ユーザー名順で返す。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| （入力パラメータなし） | ― | ― | ― |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| usages | { userId: UserId; lastAccessDate: Date \| null; accessDaysLast30: number }[] |

### 処理フロー

1. `UserAccessUsageRepository.findAllForExport()` で全ユーザーのアクセス状況を CSV ダウンロード用に取得する（ユーザー名順）
2. アクセス状況一覧を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| （このユースケースではエラーケースは発生しない。ユーザーが0件の場合は空配列で返る） | ― |
