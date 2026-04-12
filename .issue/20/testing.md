# 動作確認計画 — Issue #20: test:domain コマンドがドメイン層テストを発見しない

**Issue:** #20
**作成日:** 2026-04-12

---

## 確認環境

このIssueの変更を確認するために必要な手順のみ記載（プロジェクト全体のセットアップは省略）。

### デプロイ・起動手順
特に不要。テストコマンドの実行のみで確認できる。

## 確認項目

### 1. ドメイン層テストが実行されること

- **目的:** `test:domain` コマンドで `app/core/domain/` 配下のテストファイルが実行されることを確認する
- **手順:**
  1. `TEST_DOMAIN=identity pnpm test:domain` を実行する
  2. テスト実行結果の出力を確認する
- **期待結果:** `app/core/domain/identity/valueObject.test.ts` のテストが実行され、PASSする
- **確認ポイント:** テスト結果に `valueObject.test.ts` が含まれていること

### 2. アプリケーション層テストも引き続き実行されること

- **目的:** 既存の `app/core/application/` 配下のテストの実行に影響がないことを確認する
- **手順:**
  1. `TEST_DOMAIN=identity pnpm test:domain` を実行する
  2. テスト実行結果の出力を確認する
- **期待結果:** `app/core/application/identity/` 配下のテストも実行され、PASSする
- **確認ポイント:** application 層の既存テストが欠落していないこと

## エッジケース・異常系

### 1. 存在しないドメインを指定した場合

- **目的:** 無効なドメイン名を指定した場合の挙動を確認する
- **手順:**
  1. `TEST_DOMAIN=nonexistent pnpm test:domain` を実行する
- **期待結果:** テストファイルが見つからない旨のメッセージが表示される（既存動作と同じ）

## 既存機能への影響確認

- `pnpm test` の全体テスト実行に影響がないこと（`test:domain` のみの変更のため影響なし）

## 確認チェックリスト

- [ ] `TEST_DOMAIN=identity pnpm test:domain` でドメイン層テストが実行される
- [ ] `TEST_DOMAIN=identity pnpm test:domain` でアプリケーション層テストも実行される
- [ ] `pnpm test` で全体テストに影響がない
