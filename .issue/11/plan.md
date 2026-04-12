# 実装計画 — Issue #11: fix: action内のtry-catchがrequireAuthのredirectを飲み込む

**Issue:** #11
**作成日:** 2026-04-12

---

## 目的

全ての `action.server.ts` で使われている `requireAuth` の `try-catch` パターンを修正し、`redirect("/login")` が正しく伝播するようにする。

## スコープ

### 含まれるもの
- 問題のある try-catch パターンを持つ4ファイルの修正

### 含まれないもの
- `requireAuth` 自体の変更
- `login/action.server.ts` の変更（`requireAuth` を使っていない）
- 既に正しいパターン（`const auth = await requireAuth(...)` ）を使っているファイルの変更

## 実装ステップ

### 1. `app/routes/apps/store/action.server.ts` の修正

- **対象ファイル:** `app/routes/apps/store/action.server.ts`
- **変更内容:** lines 18-23 の try-catch ブロックを `const auth = await requireAuth(args.request, container);` に置換
- **理由:** try-catch が `redirect` Response を捕捉してしまい、未認証時のリダイレクトが機能しない

### 2. `app/routes/apps/app/records/new/action.server.ts` の修正

- **対象ファイル:** `app/routes/apps/app/records/new/action.server.ts`
- **変更内容:** lines 19-24 の try-catch ブロックを `const auth = await requireAuth(args.request, container);` に置換
- **理由:** 同上

### 3. `app/routes/apps/app/records/record/action.server.ts` の修正

- **対象ファイル:** `app/routes/apps/app/records/record/action.server.ts`
- **変更内容:** lines 18-23 の try-catch ブロックを `const auth = await requireAuth(args.request, container);` に置換
- **理由:** 同上

### 4. `app/routes/spaces/new/action.server.ts` の修正

- **対象ファイル:** `app/routes/spaces/new/action.server.ts`
- **変更内容:** lines 25-30 の try-catch ブロックを `const auth = await requireAuth(args.request, container);` に置換
- **理由:** 同上

### 5. 未使用 import の削除

- **対象ファイル:** 上記4ファイル
- **変更内容:** try-catch 削除後に `error` import が不要になるファイルがあれば削除する
- **理由:** デッドコードの除去（ただし4ファイルとも `error` を他でも使っているため、実際には削除不要の見込み）

## リスクと注意点

- 4ファイルとも `error` を `handleUseCase` の match 内で引き続き使用しているため、import の変更は不要
- `auth.userId` の型が `let` 宣言から `const` 宣言に変わるが、`as string` キャストで使われており型推論上の問題はない

## テスト方針

- `pnpm typecheck` で型チェック
- `pnpm lint:fix` でリント
- `pnpm build` でビルド確認
