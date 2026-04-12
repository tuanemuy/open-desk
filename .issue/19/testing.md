# 動作確認計画 — Issue #19: LockoutPolicy.lockoutDuration に整数チェックがない

**Issue:** #19
**作成日:** 2026-04-12

---

## 確認環境

このIssueの変更を確認するために必要な手順のみ記載（プロジェクト全体のセットアップは省略）。

### デプロイ・起動手順
```bash
pnpm test           # ユニットテストの実行
pnpm typecheck      # 型チェック
```

## 確認項目

### 1. lockoutDuration の浮動小数点数拒否

- **目的:** `lockoutDuration` に浮動小数点数を渡した場合に `BusinessRuleError` がスローされることを確認
- **手順:**
  1. `pnpm test` を実行する
  2. `lockoutDuration: 3.7` のテストケースが `InvalidLockoutDuration` エラーでPASSすることを確認
- **期待結果:** `BusinessRuleError` が `IDENTITY_INVALID_LOCKOUT_DURATION` コードでスローされる
- **確認ポイント:** 正の浮動小数点数（`> 0` だが非整数）が拒否されること

### 2. expirationDays の浮動小数点数拒否

- **目的:** `expirationDays` に浮動小数点数を渡した場合に `BusinessRuleError` がスローされることを確認
- **手順:**
  1. `pnpm test` を実行する
  2. `expirationDays: 3.7` のテストケースが `InvalidPasswordExpirationDays` エラーでPASSすることを確認
- **期待結果:** `BusinessRuleError` が `IDENTITY_INVALID_PASSWORD_EXPIRATION_DAYS` コードでスローされる
- **確認ポイント:** 正の浮動小数点数（`> 0` だが非整数）が拒否されること

### 3. 既存の正常系が引き続き動作すること

- **目的:** 整数値を渡す既存のテストケースが引き続きPASSすることを確認
- **手順:**
  1. `pnpm test` を実行する
  2. 既存の正常系テスト（`lockoutDuration: 30`, `lockoutDuration: 1` 等）がPASSすることを確認
- **期待結果:** 全ての既存正常系テストがPASS

## エッジケース・異常系

### 1. 正の浮動小数点数（0 < x < 1）

- **目的:** `lockoutDuration: 0.5` のように正だが1未満の浮動小数点数が拒否されることを確認
- **手順:**
  1. `pnpm test` を実行する
- **期待結果:** `InvalidLockoutDuration` エラーがスローされる

### 2. 矛盾チェックと整数チェックの相互作用

- **目的:** `maxFailedAttempts: null, lockoutDuration: 3.7` のように矛盾＋非整数の場合、整数チェック（`InvalidLockoutDuration`）が先に実行されることを確認
- **手順:**
  1. テストケースを確認
- **期待結果:** `InvalidLockoutDuration` エラーがスローされる（矛盾チェックより先に整数チェックが走る）

## 既存機能への影響確認

- `pnpm test` で全テストスイートがPASSすることを確認
- `pnpm typecheck` がエラーなく完了すること

## 確認チェックリスト

- [ ] `lockoutDuration` に浮動小数点数（3.7）を渡すと `InvalidLockoutDuration` エラー
- [ ] `lockoutDuration` に 0.5 を渡すと `InvalidLockoutDuration` エラー
- [ ] `expirationDays` に浮動小数点数（3.7）を渡すと `InvalidPasswordExpirationDays` エラー
- [ ] `expirationDays` に 0.5 を渡すと `InvalidPasswordExpirationDays` エラー
- [ ] 既存の正常系テストが全てPASS
- [ ] 既存の異常系テストが全てPASS
- [ ] `pnpm typecheck` が成功
- [ ] `pnpm test` で全テストがPASS
