# ADR — Issue #1: バグ: action.ts がサーバーオンリーモジュールをインポートして React hydration が失敗する

## ADR-001: `.server.ts` ファイル規約の採用

### Status
Accepted

### Context
React Router v7 + Viteプロジェクトで、`action.ts`/`loader.ts` がサーバーオンリーモジュール（`session.server`, `container/server.instance`）をインポートしており、クライアントバンドルに含まれてhydrationが失敗する問題。

Issue本文では3つの選択肢を提示:
1. `action.ts` をサーバーオンリーとして明示し、型定義をクライアントから分離
2. `handlers` の型情報を別ファイルに分離
3. React Router v7 の `.server` ファイル規約に従い `action.server.ts` 等の命名にする

### Decision
Option 3（`.server.ts` ファイル規約）を採用。全ての `action.ts` → `action.server.ts`, `loader.ts` → `loader.server.ts` にリネーム。

### Consequences
- 良い点: React Router v7 の標準的な方法であり、Viteが自動的にクライアントバンドルから除外する
- 良い点: ファイル名だけで「このファイルはサーバーオンリー」が明確にわかる
- トレードオフ: 48個のファイルリネーム + import パスの更新が必要

---

## ADR-002: Zodスキーマの `schemas.ts` への分離

### Status
Accepted

### Context
`action.server.ts` にZodスキーマが定義されており、コンポーネント（`index.tsx`）がConformのバリデーションに使うため `handlers.xxx.schema` としてランタイムアクセスしていた。`.server.ts` ファイルからの value import はクライアントバンドルに含められないため、スキーマを分離する必要があった。

### Decision
Zodスキーマ定義を `schemas.ts`（サーバー制約なし）に切り出し、`action.server.ts` と `index.tsx` の両方から import する。コンポーネントでは `handlers.xxx.schema` の代わりにスキーマ名を直接使用。

### Consequences
- 良い点: クライアント/サーバー間の明確な依存関係分離
- 良い点: `import type` でハンドラーの型のみをクライアントに露出
- トレードオフ: ルートごとにファイル数が増える（schemas.ts の追加）

---

## ADR-003: インラインloader/action/handlersの分離

### Status
Accepted

### Context
14個のadminページでは `index.tsx` に `loader`, `action`, `handlers`, コンポーネントが全て同居していた。`handlers` がサーバーモジュールに依存しているため、React Router の自動サーバーコード除去が機能しなかった。

### Decision
各ファイルを `loader.server.ts`、`action.server.ts`、（必要に応じて）`schemas.ts`、`index.tsx`（コンポーネントのみ）に分割。

### Consequences
- 良い点: サーバー/クライアントの境界が明確になりビルドが成功する
- トレードオフ: 1ファイルだったものが3-4ファイルに増える
- 良い点: 各ファイルの責務が明確になり保守性向上

---

## ADR-004: APIルートの実装分離パターン

### Status
Accepted

### Context
`app/routes/api/bookmarks.ts` はコンポーネントを持たないリソースルート（API専用）で、`handlers` をエクスポートしていた。ルートファイル自体を `.server.ts` にリネームする方法はReact Routerがクライアントルートスタブを生成できないため失敗した。

### Decision
実装を `bookmarks-impl.server.ts` に移動し、ルートファイル `bookmarks.ts` は `export { loader, action }` の re-export のみにする。

### Consequences
- 良い点: ルートファイルとして認識されつつサーバーコードを分離できる
- トレードオフ: `-impl.server.ts` という命名が他のパターンと異なるが、APIルート特有の事情による
