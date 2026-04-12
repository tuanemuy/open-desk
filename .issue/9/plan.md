# 実装計画 — Issue #9: リファクタ: system-mail/index.tsx のインライン loader を loader.server.ts に分離する

**Issue:** #9
**作成日:** 2026-04-12

---

## 目的

`app/routes/admin/system-mail/index.tsx` にインラインで定義されている `loader` 関数を `loader.server.ts` に分離し、他ルート（`directory`, `group`, `localization` 等）と同じパターンに統一する。

## スコープ

### 含まれるもの
- `app/routes/admin/system-mail/loader.server.ts` の新規作成
- `app/routes/admin/system-mail/index.tsx` から loader 関数とサーバー専用 import の除去、re-export の追加

### 含まれないもの
- loader のロジック変更
- 他ルートの変更
- テストの追加・変更

## 実装ステップ

### 1. `loader.server.ts` の作成

- **対象ファイル:** `app/routes/admin/system-mail/loader.server.ts`（新規作成）
- **変更内容:** `index.tsx` の loader 関数をそのまま移動する。必要な import（`data` from `react-router`, `container`, `getSystemMail`, `handleUseCase`, `requireAuth`, `Route` 型）も一緒に移動する。
- **理由:** サーバー専用コードを `.server.ts` に分離し、他ルートとパターンを統一するため

### 2. `index.tsx` の修正

- **対象ファイル:** `app/routes/admin/system-mail/index.tsx`
- **変更内容:**
  - loader 関数の定義を削除
  - サーバー専用の import を削除（`container`, `getSystemMail`, `handleUseCase`, `requireAuth`）
  - `data` import を削除（loader でのみ使用されているため）
  - `export { loader } from "./loader.server";` を追加（`action` の re-export と同じパターン）
- **理由:** クライアントバンドルにサーバー専用モジュールが混入するリスクを排除し、一貫性を確保するため

## リスクと注意点

- loader のロジック自体は一切変更しないため、動作への影響は最小限
- React Router v7 の型生成（`+types/index`）は `loader.server.ts` からの export も正しく認識するため、型安全性は維持される（他ルートで実績あり）

## テスト方針

- `pnpm typecheck` で型エラーがないことを確認
- `pnpm build` でビルドが通ることを確認
- ブラウザで `/admin/system-mail` にアクセスし、画面が正常に表示されることを確認
