# 動作確認計画 — Issue #13: LockoutPolicy.create() が矛盾した設定値を許容する

**Issue:** #13
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

### 1. 矛盾した設定値の拒否

- **目的:** `maxFailedAttempts: null` かつ `lockoutDuration: 非null` のとき `BusinessRuleError` がスローされることを確認
- **手順:**
  1. `pnpm test` を実行する
  2. `LockoutPolicy.create()` の矛盾検出テストがPASSすることを確認する
- **期待結果:** `BusinessRuleError` が `IDENTITY_INCONSISTENT_LOCKOUT_POLICY` コードでスローされる
- **確認ポイント:** エラーメッセージが矛盾の内容を適切に説明していること

### 2. 有効な組み合わせの許容

- **目的:** 矛盾しない設定値の組み合わせが引き続き受け入れられることを確認
- **手順:**
  1. `pnpm test` を実行する
  2. 以下の組み合わせがエラーなく作成できるテストがPASSすることを確認する:
     - `maxFailedAttempts: null, lockoutDuration: null`（ロックアウト無効）
     - `maxFailedAttempts: 5, lockoutDuration: 30`（通常ロックアウト）
     - `maxFailedAttempts: 5, lockoutDuration: null`（永久ロック）
- **期待結果:** すべての有効な組み合わせで `LockoutPolicy` が正常に作成される

## エッジケース・異常系

### 1. 既存バリデーションとの共存

- **目的:** 新しいバリデーションが既存のバリデーション（範囲チェック等）と干渉しないことを確認
- **手順:**
  1. `pnpm test` で既存のバリデーションテスト（`maxFailedAttempts` の範囲外、`lockoutDuration` の負数）もPASSすることを確認
- **期待結果:** 既存のバリデーションが変わらず動作する

## 既存機能への影響確認

- `pnpm test` で全テストスイートがPASSすることを確認（既存の `login.test.ts` 等に影響がないこと）

## 確認チェックリスト

- [ ] 矛盾した設定値（`maxFailedAttempts: null, lockoutDuration: 30`）で `BusinessRuleError` がスローされる
- [ ] 有効な組み合わせ（both null, both non-null, maxFailedAttempts非null+lockoutDuration null）が正常に動作する
- [ ] 既存のバリデーション（範囲チェック等）が変わらず動作する
- [ ] `pnpm typecheck` が成功する
- [ ] `pnpm test` で全テストがPASSする
