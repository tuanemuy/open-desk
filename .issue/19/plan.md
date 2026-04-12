# 実装計画 — Issue #19: LockoutPolicy.lockoutDuration に整数チェックがない

**Issue:** #19
**作成日:** 2026-04-12

---

## 目的

`LockoutPolicy.lockoutDuration` と `PasswordPolicy.expirationDays` のバリデーションに `Number.isInteger()` チェックを追加し、エラーメッセージ（"must be a positive integer"）と実際のバリデーションを一致させる。

## スコープ

### 含まれるもの
- `LockoutPolicy.create()` の `lockoutDuration` に整数チェック追加
- `PasswordPolicy.create()` の `expirationDays` に整数チェック追加
- 上記のユニットテスト追加

### 含まれないもの
- `maxFailedAttempts` の整数チェック（エラーメッセージに "integer" と記載されていないため、別途検討が必要であれば別Issueで対応）
- バリデーション以外のロジック変更

## 実装ステップ

### 1. `LockoutPolicy.create()` の `lockoutDuration` バリデーション修正

- **対象ファイル:** `app/core/domain/identity/valueObject.ts` (L761)
- **変更内容:** `params.lockoutDuration <= 0` の条件に `!Number.isInteger(params.lockoutDuration)` を追加する
- **理由:** エラーメッセージが "must be a positive integer" と記載しているが、実際には整数チェックが行われていないため

変更前:
```typescript
if (params.lockoutDuration !== null && params.lockoutDuration <= 0) {
```

変更後:
```typescript
if (params.lockoutDuration !== null && (params.lockoutDuration <= 0 || !Number.isInteger(params.lockoutDuration))) {
```

### 2. `PasswordPolicy.create()` の `expirationDays` バリデーション修正

- **対象ファイル:** `app/core/domain/identity/valueObject.ts` (L570)
- **変更内容:** `params.expirationDays <= 0` の条件に `!Number.isInteger(params.expirationDays)` を追加する
- **理由:** エラーメッセージが "must be a positive integer" と記載しているが、実際には整数チェックが行われていないため

変更前:
```typescript
if (params.expirationDays !== null && params.expirationDays <= 0) {
```

変更後:
```typescript
if (params.expirationDays !== null && (params.expirationDays <= 0 || !Number.isInteger(params.expirationDays))) {
```

### 3. `LockoutPolicy` のテスト追加

- **対象ファイル:** `app/core/domain/identity/valueObject.test.ts`
- **変更内容:** 浮動小数点数のテストケースを追加
  - `lockoutDuration: 3.7` → `InvalidLockoutDuration` エラー
  - `lockoutDuration: 0.5` → `InvalidLockoutDuration` エラー（正だが非整数）

### 4. `PasswordPolicy` のテスト追加

- **対象ファイル:** 新規テストファイルまたは既存テストファイルに追記
- **変更内容:** 浮動小数点数のテストケースを追加
  - `expirationDays: 3.7` → `InvalidPasswordExpirationDays` エラー
  - `expirationDays: 0.5` → `InvalidPasswordExpirationDays` エラー（正だが非整数）

## リスクと注意点

- `Number.isInteger()` は `NaN` や `Infinity` に対しても `false` を返すため、これらの値も正しく拒否される（副次的なメリット）
- 既存の正常系テスト（整数値を渡しているケース）には影響なし
- `LockoutPolicy` の矛盾チェック相互作用テストで `lockoutDuration` に浮動小数点を渡す新しいエッジケースの考慮（整数チェックが先に走るので `InvalidLockoutDuration` が返る）

## テスト方針

- `lockoutDuration` と `expirationDays` に浮動小数点数を渡してエラーになることを確認
- 既存テストが全てパスすることを確認
- `pnpm typecheck` と `pnpm lint` がパスすることを確認
