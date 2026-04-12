# 実装計画 — Issue #24: 複数の数値フィールドに整数チェックがない

**Issue:** #24
**作成日:** 2026-04-13

---

## 目的

`app/core/domain/identity/valueObject.ts` にある複数の数値フィールドに、Issue #19 で `lockoutDuration` と `expirationDays` に追加したのと同様の `Number.isInteger()` チェックを追加する。

## スコープ

### 含まれるもの
- `LockoutPolicy.maxFailedAttempts` への整数チェック追加
- `PasswordPolicy.minLength` への整数チェック追加
- `PasswordPolicy.historyCount` への整数チェック追加
- `SessionPolicy.timeoutMinutes` への整数チェック追加

### 含まれないもの
- 他のドメインのバリデーション修正
- エラーコードの新規追加（既存コードを流用）

## 実装ステップ

### 1. LockoutPolicy.maxFailedAttempts に整数チェックを追加

- **対象ファイル:** `app/core/domain/identity/valueObject.ts`
- **変更内容:** `maxFailedAttempts` の範囲チェック条件に `|| !Number.isInteger(params.maxFailedAttempts)` を追加
- **理由:** 5.5 のような浮動小数点が通過してしまう。ログイン失敗回数は整数であるべき
- **使用エラーコード:** `IdentityErrorCode.InvalidLockoutMaxAttempts`（既存）

変更前:
```typescript
if (
  params.maxFailedAttempts !== null &&
  (params.maxFailedAttempts < LOCKOUT_MAX_ATTEMPTS_MIN ||
    params.maxFailedAttempts > LOCKOUT_MAX_ATTEMPTS_MAX)
) {
```

変更後:
```typescript
if (
  params.maxFailedAttempts !== null &&
  (params.maxFailedAttempts < LOCKOUT_MAX_ATTEMPTS_MIN ||
    params.maxFailedAttempts > LOCKOUT_MAX_ATTEMPTS_MAX ||
    !Number.isInteger(params.maxFailedAttempts))
) {
```

### 2. PasswordPolicy.minLength に整数チェックを追加

- **対象ファイル:** `app/core/domain/identity/valueObject.ts`
- **変更内容:** `minLength` の範囲チェック条件に `|| !Number.isInteger(params.minLength)` を追加
- **理由:** 8.5 のような浮動小数点が通過してしまう。パスワード最小文字数は整数であるべき
- **使用エラーコード:** `IdentityErrorCode.InvalidPasswordMinLength`（既存）

### 3. PasswordPolicy.historyCount に整数チェックを追加

- **対象ファイル:** `app/core/domain/identity/valueObject.ts`
- **変更内容:** `historyCount` の範囲チェック条件に `|| !Number.isInteger(params.historyCount)` を追加
- **理由:** 3.7 のような浮動小数点が通過してしまう。パスワード履歴保持数は整数であるべき
- **使用エラーコード:** `IdentityErrorCode.InvalidPasswordHistoryCount`（既存）

### 4. SessionPolicy.timeoutMinutes に整数チェックを追加

- **対象ファイル:** `app/core/domain/identity/valueObject.ts`
- **変更内容:** `timeoutMinutes` の範囲チェック条件に `|| !Number.isInteger(timeoutMinutes)` を追加
- **理由:** 30.5 のような浮動小数点が通過してしまう。セッションタイムアウト分は整数であるべき
- **使用エラーコード:** `IdentityErrorCode.InvalidSessionTimeout`（既存）

## 設計判断

- 既存の範囲チェック条件に `||` で整数チェックを追加する。Issue #19 の `lockoutDuration` / `expirationDays` と同じパターン
- 新規エラーコードを追加しない。既存のエラーコードがセマンティクス的に適切

## リスクと注意点

- 変更は 1 ファイル、4 箇所のみ。影響範囲が小さい
- 既存の単体テストがない場合は新規作成する

## テスト方針

- 各フィールドの浮動小数点値がエラーになることを確認するテストを追加する
- 境界値（3, 10, 8, 15, 0, 15, 1440 等）の整数値は通過することを確認する
