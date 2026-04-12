# 動作確認計画 — Issue #24: 複数の数値フィールドに整数チェックがない

**Issue:** #24
**作成日:** 2026-04-13

---

## 確認環境

このIssueの変更を確認するために必要な手順のみ記載（プロジェクト全体のセットアップは省略）。

### デプロイ・起動手順

```bash
pnpm test
```

または、identity ドメインのテストのみ:

```bash
TEST_DOMAIN=identity pnpm test:domain
```

## 確認項目

### 1. LockoutPolicy.maxFailedAttempts の整数チェック

- **目的:** 浮動小数点数が拒否されることを確認
- **手順:**
  1. `LockoutPolicy.create({ maxFailedAttempts: 5.5, lockoutDuration: null })` を呼び出す
  2. `BusinessRuleError` が `InvalidLockoutMaxAttempts` コードでスローされることを確認
- **期待結果:** エラーがスローされる
- **確認ポイント:** 整数値（例: 5）は通過すること

### 2. PasswordPolicy.minLength の整数チェック

- **目的:** 浮動小数点数が拒否されることを確認
- **手順:**
  1. `PasswordPolicy.create({ minLength: 8.5, ... })` を呼び出す
  2. `BusinessRuleError` が `InvalidPasswordMinLength` コードでスローされることを確認
- **期待結果:** エラーがスローされる
- **確認ポイント:** 整数値（例: 8）は通過すること

### 3. PasswordPolicy.historyCount の整数チェック

- **目的:** 浮動小数点数が拒否されることを確認
- **手順:**
  1. `PasswordPolicy.create({ historyCount: 3.7, ... })` を呼び出す
  2. `BusinessRuleError` が `InvalidPasswordHistoryCount` コードでスローされることを確認
- **期待結果:** エラーがスローされる
- **確認ポイント:** 整数値（例: 3）は通過すること

### 4. SessionPolicy.timeoutMinutes の整数チェック

- **目的:** 浮動小数点数が拒否されることを確認
- **手順:**
  1. `SessionPolicy.create(30.5)` を呼び出す
  2. `BusinessRuleError` が `InvalidSessionTimeout` コードでスローされることを確認
- **期待結果:** エラーがスローされる
- **確認ポイント:** 整数値（例: 30）は通過すること

## エッジケース・異常系

### 1. 境界値の整数は通過すること

- **目的:** 整数の境界値（最小・最大）が正常に通過することを確認
- **手順:**
  1. `LockoutPolicy.create({ maxFailedAttempts: 3, lockoutDuration: null })` — 最小値
  2. `LockoutPolicy.create({ maxFailedAttempts: 10, lockoutDuration: null })` — 最大値
  3. `PasswordPolicy.create({ minLength: 3, ... })` — 最小値
  4. `SessionPolicy.create(15)` — 最小値
  5. `SessionPolicy.create(1440)` — 最大値
- **期待結果:** いずれもエラーなし

## 確認チェックリスト

- [ ] LockoutPolicy.maxFailedAttempts: 5.5 がエラーになる
- [ ] LockoutPolicy.maxFailedAttempts: 5 が通過する
- [ ] PasswordPolicy.minLength: 8.5 がエラーになる
- [ ] PasswordPolicy.minLength: 8 が通過する
- [ ] PasswordPolicy.historyCount: 3.7 がエラーになる
- [ ] PasswordPolicy.historyCount: 3 が通過する
- [ ] SessionPolicy.timeoutMinutes: 30.5 がエラーになる
- [ ] SessionPolicy.timeoutMinutes: 30 が通過する
