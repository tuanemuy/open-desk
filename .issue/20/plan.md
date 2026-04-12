# 実装計画 — Issue #20: test:domain コマンドがドメイン層テストを発見しない

**Issue:** #20
**作成日:** 2026-04-12

---

## 目的

`TEST_DOMAIN=identity pnpm test:domain` を実行したとき、`app/core/domain/identity/` 配下のテストファイルも含めて実行されるようにする。

## スコープ

### 含まれるもの
- `package.json` の `test:domain` スクリプトの修正

### 含まれないもの
- 新しいテストコマンドの追加（`test:domain-layer` 等）
- vitest 設定ファイルの変更
- テストファイル自体の変更

## 実装ステップ

### 1. `package.json` の `test:domain` スクリプトを修正

- **対象ファイル:** `package.json` (L15)
- **変更内容:** `vitest run app/core/application/${TEST_DOMAIN}` を `vitest run app/core/domain/${TEST_DOMAIN} app/core/application/${TEST_DOMAIN}` に変更
- **理由:** vitest CLI は複数のフィルターパターンをスペース区切りで受け付ける。`app/core/domain/` と `app/core/application/` の両方を指定することで、ドメイン層とアプリケーション層の両方のテストを実行できる。

## リスクと注意点

- vitest CLI に複数パスを渡す方法はドキュメントで確認済みの標準的なアプローチ
- 既存の `app/core/application/` 配下のテストの実行に影響なし（パスが追加されるだけ）
- `TEST_DOMAIN` 環境変数が未指定の場合、空文字展開により `app/core/domain/ app/core/application/` となるが、これは既存動作と同じリスク（元々 `app/core/application/` に展開されていた）

## テスト方針

- `TEST_DOMAIN=identity pnpm test:domain` で `app/core/domain/identity/valueObject.test.ts` が実行されることを確認
- 既存の application 層テストも引き続き実行されることを確認
