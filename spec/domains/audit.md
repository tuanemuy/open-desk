# Audit ドメイン設計

## 概要

Audit ドメインは、OpenDesk プラットフォームにおける監査ログの記録・取得・フィルタリング・ダウンロードと、ユーザーアクセス状況の追跡を管理する Supporting ドメインである。cybozu.com 共通管理の監査ログ機能と、OpenDesk システム管理のユーザーアクセス状況機能を提供する。

**ドメイン種別**: Supporting

**責務境界**:
- 監査ログの記録（各ドメインのユースケースからイベント経由でトリガー）を担う
- 監査ログの閲覧（日時範囲・レベル・ユーザー・サービス・モジュール・アクション・結果によるフィルタリング）を担う
- 監査ログの CSV ダウンロード（最大10万件）を担う
- 監査ログの保持期間管理（6週間未満のログを閲覧可能）を担う
- 監査ログ設定（保存対象の設定等）の管理を担う
- ユーザーごとの最終アクセス日・過去30日間のアクセス日数の記録・取得を担う
- ユーザーアクセス状況の CSV ダウンロードを担う

---

## ユビキタス言語

| 英語名 | 日本語名 | 定義 |
|--------|---------|------|
| AuditLog | 監査ログ | システム上の操作を記録したログエントリ。レベル・日時・接続元IP・ユーザー・サービス・モジュール・アクション・結果・エラー番号を持つ |
| AuditLevel | 監査レベル | 監査ログの重要度レベル。重要（CRITICAL）と情報（INFO）の2種類 |
| AuditFilter | 監査フィルタ | 監査ログの検索条件。日時範囲・レベル・ユーザー・サービス・モジュール・アクション・結果を指定可能 |
| AuditResult | 監査結果 | 操作の結果を示す値。SUCCESS（成功）または FAILURE（失敗） |
| ServiceType | サービス種別 | 監査ログの対象サービス。サービス共通・Garoon・サイボウズ Office・OpenDesk 等 |
| AuditLogSetting | 監査ログ設定 | 監査ログの保存対象やレベルに関する設定 |
| UserAccessUsage | ユーザーアクセス状況 | ユーザーごとの最終アクセス日と過去30日間のアクセス日数を集約した情報 |
| RetentionPeriod | 保持期間 | 監査ログの保持期間。6週間未満のログが閲覧対象 |

---

## 他ドメインとの関係

| 参照先ドメイン | 参照方法 | 用途 |
|--------------|---------|------|
| Identity | UserId（値オブジェクト） | 監査ログの対象ユーザー識別、ユーザーアクセス状況の対象ユーザー識別 |

Audit ドメインは他ドメインのエンティティを直接保持しない。UserId は監査対象ユーザーを識別するために値オブジェクトとして参照するのみ。

各ドメインのユースケースは Outbox パターンのイベント経由で監査ログの記録をトリガーする。Audit ドメインはイベントを受信して AuditLog エンティティを生成・永続化する。

---

## エンティティ

### AuditLog（監査ログ）

システム上の操作を記録した監査ログエントリ。各ドメインのユースケース実行時にイベント経由で生成される。

#### フィールド

| フィールド名 | 型 | 必須 | 説明 |
|-------------|-----|------|------|
| auditLogId | AuditLogId | 必須 | 監査ログの一意識別子 |
| level | AuditLevel | 必須 | ログの重要度レベル（CRITICAL / INFO） |
| timestamp | Date | 必須 | 操作が発生した日時 |
| sourceIp | string | 任意 | 接続元 IP アドレス。システム内部処理の場合は null |
| userId | UserId | 任意 | 操作を実行したユーザーの ID。システム処理の場合は null |
| service | ServiceType | 必須 | 対象サービス |
| module | string | 必須 | 操作のモジュール名（例: Authentication, App management） |
| action | string | 必須 | 操作のアクション名（例: login, App create） |
| result | AuditResult | 必須 | 操作の結果（SUCCESS / FAILURE） |
| errorCode | string | 任意 | エラー発生時のエラー番号。成功時は null |

#### ビヘイビア

```typescript
/**
 * このログが指定した保持期間内であるかを判定する。
 * @param retentionWeeks 保持期間（週数）
 * @returns 保持期間内であれば true
 */
isWithinRetention(retentionWeeks: number): boolean
// 前提条件: retentionWeeks > 0
// 事後条件: timestamp が現在時刻から retentionWeeks 週間以内であれば true

/**
 * このログが指定したフィルタ条件に一致するかを判定する。
 * @param filter フィルタ条件
 * @returns 全条件に一致すれば true
 */
matchesFilter(filter: AuditFilter): boolean
// 前提条件: なし
// 事後条件: filter の全条件（設定されたもののみ）に一致すれば true
```

#### 不変条件

- `auditLogId` は作成後に変更不可
- `level` は作成後に変更不可
- `timestamp` は作成後に変更不可
- `service` は作成後に変更不可
- `module` は空文字であってはならない
- `action` は空文字であってはならない
- `result` は作成後に変更不可
- `result` が `SUCCESS` の場合、`errorCode` は null
- AuditLog はイミュータブルである（作成後に一切の変更を許さない）

#### ライフサイクル

1. **作成**: 各ドメインのユースケース実行時にイベント経由でトリガーされ、自動的に生成・永続化される
2. **閲覧**: フィルタ条件を指定して検索・一覧表示する。保持期間（6週間未満）内のログのみ閲覧可能
3. **ダウンロード**: フィルタ条件に一致するログを CSV 形式でダウンロードする（最大10万件）
4. **削除**: 保持期間を過ぎたログはシステムにより自動削除される（ユーザー操作による削除は不可）

---

### UserAccessUsage（ユーザーアクセス状況）

ユーザーごとのアクセス状況を集約した情報。最終アクセス日と過去30日間のアクセス日数を管理する。

#### フィールド

| フィールド名 | 型 | 必須 | 説明 |
|-------------|-----|------|------|
| userId | UserId | 必須 | 対象ユーザーの ID |
| lastAccessDate | Date | 任意 | 最終アクセス日。一度もアクセスしていない場合は null |
| accessDaysLast30 | number | 必須 | 過去30日間のアクセス日数（0〜30） |

#### ビヘイビア

```typescript
/**
 * アクセスを記録する。
 * @param accessDate アクセスした日付
 */
recordAccess(accessDate: Date): void
// 前提条件: なし
// 事後条件: lastAccessDate が accessDate 以降に更新される。accessDaysLast30 が再計算される

/**
 * 過去30日間のアクセス日数を再計算する。
 * 日次バッチ等で呼び出し、古いアクセス記録を反映する。
 * @param accessDates 過去30日間にアクセスした日付の一覧
 */
recalculateAccessDays(accessDates: Date[]): void
// 前提条件: accessDates は過去30日間の範囲内の日付のみ含む
// 事後条件: accessDaysLast30 が accessDates のユニーク日数に更新される
```

#### 不変条件

- `userId` は作成後に変更不可
- `accessDaysLast30` は 0 以上 30 以下
- `lastAccessDate` が非 null の場合、未来の日付であってはならない

#### ライフサイクル

1. **作成**: ユーザーの初回アクセス時に自動生成される
2. **更新**: ユーザーのアクセスごとに `lastAccessDate` と `accessDaysLast30` が更新される
3. **削除**: ユーザー削除時に連動して削除される（Identity ドメインのイベント経由）

---

## 値オブジェクト

### AuditLogId

監査ログの一意識別子。

```typescript
type AuditLogId = {
  readonly value: string; // UUID v4 形式
};

// 等価性: value が一致すれば等しい
// バリデーション: 空文字でないこと、有効な UUID 形式であること
```

### AuditLevel

監査ログの重要度レベルを表す列挙型。

```typescript
type AuditLevel =
  | "CRITICAL"  // 重要: セキュリティ関連や重要な操作（ログイン失敗、権限変更等）
  | "INFO";     // 情報: 通常の操作記録（レコード作成、アプリ設定変更等）
```

### AuditResult

操作の結果を表す列挙型。

```typescript
type AuditResult =
  | "SUCCESS"   // 成功: 操作が正常に完了した
  | "FAILURE";  // 失敗: 操作がエラーにより失敗した
```

### ServiceType

監査ログの対象サービスを表す列挙型。

```typescript
type ServiceType =
  | "COMMON"        // サービス共通: 認証・共通管理等のサービス横断操作
  | "OPEN_DESK"     // OpenDesk: OpenDesk 固有の操作
  | "GAROON"        // Garoon: Garoon 固有の操作
  | "CYBOZU_OFFICE"; // サイボウズ Office: サイボウズ Office 固有の操作
```

### AuditFilter

監査ログのフィルタ条件を表す値オブジェクト。全フィールドが任意で、指定されたフィールドのみフィルタリングに使用される。

```typescript
type AuditFilter = {
  readonly dateFrom: Date | null;          // 開始日時（以上）
  readonly dateTo: Date | null;            // 終了日時（以下）
  readonly level: AuditLevel | null;       // レベル絞り込み（「重要以上」は CRITICAL のみ、「情報以上」は全件）
  readonly userId: UserId | null;          // 対象ユーザー
  readonly service: ServiceType | null;    // 対象サービス
  readonly module: string | null;          // モジュール名（部分一致）
  readonly action: string | null;          // アクション名（部分一致）
  readonly result: AuditResult | null;     // 結果
};

// 等価性: 全フィールドが一致すれば等しい
// バリデーション:
//   - dateFrom と dateTo が両方指定された場合、dateFrom <= dateTo であること
//   - dateFrom は保持期間（6週間前）より古い日時を指定できない
```

### AuditLogSetting（監査ログ設定）

監査ログの保存対象やレベルに関する設定。テナントに1つだけ存在するシングルトンエンティティ。

#### フィールド

| フィールド名 | 型 | 必須 | 説明 |
|-------------|-----|------|------|
| settings | Record<string, unknown> | 必須 | 監査ログ設定（保存対象の設定等、JSON 形式） |
| createdAt | Date | 必須 | 作成日時 |
| updatedAt | Date | 必須 | 最終更新日時 |

#### ビヘイビア

```typescript
/**
 * 監査ログ設定を更新する。
 * @param newSettings 新しい設定値
 */
updateSettings(newSettings: Record<string, unknown>): void
// 事後条件: settings が newSettings に置き換えられ、updatedAt が現在時刻に更新される
```

#### 不変条件

- `settings` は null でないこと
- `createdAt <= updatedAt`

#### ライフサイクル

1. **初期化**: システム初回セットアップ時にデフォルト値で作成される
2. **更新**: 管理画面から設定を変更して保存する
3. **削除**: 通常は削除しない（システムに必須の設定であるため）

---

## ドメインサービス

このドメインではドメインサービスは不要。監査ログの記録とクエリはシンプルな CRUD 操作であり、複雑なビジネスロジックを要しない。

---

## ポート

### AuditLogRepository

監査ログの永続化と検索を担うリポジトリインターフェース。

```typescript
interface AuditLogRepository {
  /**
   * 監査ログ ID で監査ログを取得する。
   * @param auditLogId 監査ログの一意識別子
   * @returns 監査ログ。存在しない場合は null
   */
  findById(auditLogId: AuditLogId): Promise<AuditLog | null>;

  /**
   * フィルタ条件に一致する監査ログを取得する（日時の降順）。
   * 保持期間（6週間未満）内のログのみ対象。
   * @param filter フィルタ条件
   * @param limit 最大取得件数
   * @param offset 取得開始位置
   * @returns 監査ログの配列（日時の降順）と総件数
   */
  findByFilter(
    filter: AuditFilter,
    limit: number,
    offset: number
  ): Promise<{ logs: AuditLog[]; totalCount: number }>;

  /**
   * フィルタ条件に一致する監査ログを CSV ダウンロード用に取得する（日時の降順）。
   * 最大10万件まで取得可能。
   * @param filter フィルタ条件
   * @returns 監査ログの配列（日時の降順、最大10万件）
   */
  findForExport(filter: AuditFilter): Promise<AuditLog[]>;

  /**
   * 監査ログを保存する。
   * @param auditLog 保存対象の監査ログ
   */
  save(auditLog: AuditLog): Promise<void>;

  /**
   * 保持期間を超過した監査ログを削除する。
   * @param retentionWeeks 保持期間（週数）
   * @returns 削除された件数
   */
  deleteExpired(retentionWeeks: number): Promise<number>;
}
```

### UserAccessUsageRepository

ユーザーアクセス状況の永続化と取得を担うリポジトリインターフェース。

```typescript
interface UserAccessUsageRepository {
  /**
   * ユーザー ID でアクセス状況を取得する。
   * @param userId ユーザーの ID
   * @returns アクセス状況。存在しない場合は null
   */
  findByUserId(userId: UserId): Promise<UserAccessUsage | null>;

  /**
   * 全ユーザーのアクセス状況を取得する（ユーザー名順）。
   * @returns アクセス状況の配列
   */
  findAll(): Promise<UserAccessUsage[]>;

  /**
   * 全ユーザーのアクセス状況を CSV ダウンロード用に取得する。
   * @returns アクセス状況の配列（ユーザー名順）
   */
  findAllForExport(): Promise<UserAccessUsage[]>;

  /**
   * アクセス状況を保存する（新規作成・更新の両方に対応）。
   * @param usage 保存対象のアクセス状況
   */
  save(usage: UserAccessUsage): Promise<void>;

  /**
   * ユーザーのアクセス状況を削除する。
   * @param userId 削除対象のユーザー ID
   */
  deleteByUserId(userId: UserId): Promise<void>;

  /**
   * 指定ユーザーの過去30日間のアクセス日付一覧を取得する。
   * accessDaysLast30 の再計算に使用する。
   * @param userId ユーザーの ID
   * @returns 過去30日間にアクセスした日付の配列
   */
  findAccessDatesLast30Days(userId: UserId): Promise<Date[]>;
}
```

### AuditLogSettingRepository

監査ログ設定の永続化を担うリポジトリインターフェース。

```typescript
interface AuditLogSettingRepository {
  /**
   * 現在の監査ログ設定を取得する。
   * @returns 監査ログ設定
   */
  find(): Promise<AuditLogSetting>;

  /**
   * 監査ログ設定を保存する。
   * @param setting 保存対象の設定
   */
  save(setting: AuditLogSetting): Promise<void>;
}
```

---

## エラー型

```typescript
// 監査ログ操作エラー
type AuditLogNotFoundError = { kind: "AuditLogNotFound"; auditLogId: AuditLogId };
type InvalidAuditFilterError = { kind: "InvalidAuditFilter"; reason: string };
type ExportLimitExceededError = { kind: "ExportLimitExceeded"; requestedCount: number; maxCount: number };
type EmptyModuleError = { kind: "EmptyModule" };
type EmptyActionError = { kind: "EmptyAction" };
type InvalidRetentionPeriodError = { kind: "InvalidRetentionPeriod"; retentionWeeks: number };

// ユーザーアクセス状況エラー
type UserAccessUsageNotFoundError = { kind: "UserAccessUsageNotFound"; userId: UserId };
type InvalidAccessDaysError = { kind: "InvalidAccessDays"; accessDays: number };
```

---

## ユースケース（概要）

### 監査ログ管理

| # | ユースケース名 | 概要 | 主要アクター |
|---|--------------|------|-------------|
| 1 | 監査ログ記録 | 各ドメインのユースケースから Outbox パターンのイベント経由で監査ログを記録する。レベル・日時・接続元IP・ユーザー・サービス・モジュール・アクション・結果・エラー番号を保存する | システム（イベント経由） |
| 2 | 監査ログ一覧取得 | フィルタ条件（日時範囲・レベル・ユーザー・サービス・モジュール・アクション・結果）を指定して監査ログを検索・取得する。保持期間（6週間未満）内のログのみ対象。日時の降順で返す | cybozu.com 共通管理者 |
| 3 | 監査ログ CSV ダウンロード | フィルタ条件に一致する監査ログを CSV 形式でダウンロードする。最大10万件まで出力可能 | cybozu.com 共通管理者 |
| 4 | 監査ログ設定取得 | 現在の監査ログ設定（保存対象の設定等）を取得する | cybozu.com 共通管理者 |
| 5 | 監査ログ設定更新 | 監査ログの保存対象やレベルに関する設定を更新する | cybozu.com 共通管理者 |
| 6 | 期限切れ監査ログ削除 | 保持期間（6週間）を超過した監査ログを一括削除する。定期バッチで実行される | システム（バッチ処理） |

### ユーザーアクセス状況管理

| # | ユースケース名 | 概要 | 主要アクター |
|---|--------------|------|-------------|
| 7 | アクセス記録 | ユーザーのアクセスを記録し、最終アクセス日と過去30日間のアクセス日数を更新する | システム（アクセス検知時） |
| 8 | アクセス状況一覧取得 | 全ユーザーのアクセス状況（ユーザー・組織・最終アクセス日・過去30日間のアクセス日数）を取得する | OpenDesk システム管理者 |
| 9 | アクセス状況 CSV ダウンロード | 全ユーザーのアクセス状況一覧を CSV 形式でダウンロードする | OpenDesk システム管理者 |
