# 実装計画 — Issue #1: バグ: action.ts がサーバーオンリーモジュールをインポートして React hydration が失敗する

**Issue:** #1
**作成日:** 2026-04-12

---

## 目的

`action.ts` と `loader.ts` がサーバーオンリーモジュール（`session.server`, `container/server.instance`）をインポートしており、`index.tsx` から再エクスポートされることでクライアントバンドルに含まれ、React hydration が失敗するバグを修正する。

## スコープ

### 含まれるもの
- 全 `action.ts` ファイル（21個）を `action.server.ts` にリネーム
- 全 `loader.ts` ファイル（27個）を `loader.server.ts` にリネーム
- 対応する `index.tsx` の import/export パスの更新
- `handlers` の value import を type import に修正（4ファイル）

### 含まれないもの
- `compositeAction.ts` の変更（クライアント/サーバー両方で使われる設計のため）
- 新しいテストの追加（バグ修正はリネームのみで完結）
- その他のリファクタリング

## 実装ステップ

### 1. action.ts → action.server.ts のリネーム

- **対象ファイル:** 全21個の `app/routes/**/action.ts`
- **変更内容:** `git mv` で `action.ts` → `action.server.ts` にリネーム
- **理由:** React Router v7 の `.server.ts` 規約に従うことで、Vite がクライアントバンドルから自動除外する

### 2. loader.ts → loader.server.ts のリネーム

- **対象ファイル:** 全27個の `app/routes/**/loader.ts`
- **変更内容:** `git mv` で `loader.ts` → `loader.server.ts` にリネーム
- **理由:** action.ts と同じパターンで session.server をインポートしており、同じ問題が発生する

### 3. index.tsx の export パス更新

- **対象ファイル:** action/loader を再エクスポートしている全 `index.tsx`
- **変更内容:**
  - `export { action } from "./action"` → `export { action } from "./action.server"`
  - `export { loader } from "./loader"` → `export { loader } from "./loader.server"`
- **理由:** リネームしたファイルを正しく参照するため

### 4. handlers の import 修正

- **対象ファイル:** `handlers` を value import している4ファイル
  - `app/routes/login/index.tsx`
  - `app/routes/apps/app/records/new/index.tsx`
  - `app/routes/apps/app/records/record/index.tsx`
  - `app/routes/settings/index.tsx`
- **変更内容:** `import { handlers } from "./action"` → `import type { handlers } from "./action.server"`
- **理由:** `handlers` は `useCompositeAction<typeof handlers>()` の型パラメータにのみ使用されるため、type import が正しい。value import だと `.server` ファイルのクライアントバンドル参照が発生する

### 5. type import の handlers パス更新

- **対象ファイル:** `handlers` を type import している13ファイル
- **変更内容:** `import type { handlers } from "./action"` → `import type { handlers } from "./action.server"`
- **理由:** リネームしたファイルを正しく参照するため

### 6. 型チェック・lint・ビルド確認

- **変更内容:** `pnpm typecheck`, `pnpm lint:fix`, `pnpm format`, `pnpm dev` で問題なく動作することを確認
- **理由:** リネーム後の整合性を担保

## 設計判断

React Router v7 の `.server.ts` ファイル規約を採用。Issue本文の3つの選択肢のうち「Option 3」に該当。これが最もシンプルかつフレームワークの標準的な方法。

## リスクと注意点

- action.ts/loader.ts を直接インポートしている他のファイルがないか確認が必要
- `.server.ts` ファイルからの `import type` がViteで正しく動作するか確認が必要
- loader.ts のリネームはIssue本文には明示されていないが、同じ問題パターンのため同時修正が妥当

## テスト方針

- `pnpm dev` でサーバー起動し、コンソールにサーバーオンリーモジュールのエラーが出ないことを確認
- ブラウザで `/login` にアクセスし、React hydration が正常に完了することを確認
- フォーム送信（ログインフォーム等）が `useFetcher` で正常動作することを確認
- SPA ナビゲーションが機能することを確認
