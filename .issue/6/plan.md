# 実装計画 — Issue #6: リファクタ: 残りの11ルートでZodスキーマをschemas.tsに統一する

**Issue:** #6
**作成日:** 2026-04-12

---

## 目的

Issue #1 PR で8ルートに適用済みの `schemas.ts` パターンを、残り11ルートにも適用し、プロジェクト全体でZodスキーマの共有方式を統一する。

## スコープ

### 含まれるもの
- 対象11ルートそれぞれに `schemas.ts` を新規作成
- `action.server.ts` と `index.tsx` のスキーマ定義を `schemas.ts` からのインポートに置き換え
- スキーマ乖離のあるルートではサーバー側のフルスキーマに統一

### 含まれないもの
- スキーマのバリデーションロジック自体の変更
- `system-mail` ルートの `index.tsx` にあるインライン loader の分離（別Issue）
- フォームUIやコンポーネントの変更

## 実装ステップ

対象ルートを3カテゴリに分類して実装する。

### カテゴリA: スキーマ完全一致（6ルート） — 機械的抽出

#### 1. `app/routes/admin/system/customize/`

- **対象ファイル:** `schemas.ts`（新規）, `action.server.ts`, `index.tsx`
- **変更内容:** `action.server.ts` の `schema` を `customizeSchema` にリネームして `schemas.ts` にexport。両ファイルから `import { customizeSchema } from "./schemas"` でインポート。不要になった `import { z } from "zod"` を両ファイルから削除。`SCOPE_MAP_TO_BACKEND` 定数はスキーマ定義に使われないため `action.server.ts` に残す。
- **理由:** 両ファイルのスキーマが完全一致。

#### 2. `app/routes/admin/system/mobile/`

- **対象ファイル:** `schemas.ts`（新規）, `action.server.ts`, `index.tsx`
- **変更内容:** `schema` を `mobileSchema` にリネームして抽出。同上パターン。
- **理由:** 両ファイルのスキーマが完全一致。

#### 3. `app/routes/admin/system/guest-auth/`

- **対象ファイル:** `schemas.ts`（新規）, `action.server.ts`, `index.tsx`
- **変更内容:** `schema` を `guestAuthSchema` にリネームして抽出。同上パターン。
- **理由:** 両ファイルのスキーマが完全一致。

#### 4. `app/routes/admin/system/update-options/`

- **対象ファイル:** `schemas.ts`（新規）, `action.server.ts`, `index.tsx`
- **変更内容:** `schema` を `updateOptionsSchema` にリネームして抽出。同上パターン。
- **理由:** 両ファイルのスキーマが完全一致。

#### 5. `app/routes/admin/system/shared-settings/`

- **対象ファイル:** `schemas.ts`（新規）, `action.server.ts`, `index.tsx`
- **変更内容:** `schema` を `sharedSettingsSchema` にリネームして抽出。同上パターン。
- **理由:** 両ファイルのスキーマが完全一致。

#### 6. `app/routes/admin/system/restore/`

- **対象ファイル:** `schemas.ts`（新規）, `action.server.ts`, `index.tsx`
- **変更内容:** `restoreAppSchema` と `restoreSpaceSchema` の2つをそのまま抽出。
- **理由:** 両ファイルのスキーマが完全一致。名前も一致しているためリネーム不要。

### カテゴリB: 名前のみ異なる（1ルート）

#### 7. `app/routes/admin/system/header-color/`

- **対象ファイル:** `schemas.ts`（新規）, `action.server.ts`, `index.tsx`
- **変更内容:** サーバー側の `updateHeaderColorSchema` を `schemas.ts` にexport。`index.tsx` の `colorSchema` を `updateHeaderColorSchema` に置き換え。不要になった `import { z } from "zod"` を両ファイルから削除。
- **理由:** 内容同一で名前のみ異なる。サーバー側の名前 `updateHeaderColorSchema` を採用（handler名と一致するため）。

### カテゴリC: スキーマ内容が乖離（4ルート） — サーバー側フルスキーマに統一

#### 8. `app/routes/admin/system/features/`

- **対象ファイル:** `schemas.ts`（新規）, `action.server.ts`, `index.tsx`
- **変更内容:** サーバー側の `updateFeaturesSchema`（全フィールド含む）を `schemas.ts` にexport。`index.tsx` の部分スキーマ（`emailDefaultReceive`, `emailFormat` のみ）を削除し、`updateFeaturesSchema` に置き換え。不要になった `import { z } from "zod"` を両ファイルから削除。
- **理由:** サーバー側のフルスキーマが正。Conform の `getZodConstraint` / `parseWithZod` はフルスキーマでも正常動作する（checkbox の `.transform()` 付きフィールドは `z.string().optional().transform()` チェーンであり、unchecked 時は FormData にフィールドが存在せず `undefined` → `.optional()` で通過するため `required` 制約を生成しない）。

#### 9. `app/routes/admin/security/login/`

- **対象ファイル:** `schemas.ts`（新規）, `action.server.ts`, `index.tsx`
- **変更内容:** サーバー側の `saveSecuritySchema` と `passwordComplexityValues` 定数を `schemas.ts` にexport。`passwordComplexityValues` はスキーマ定義（`z.enum(passwordComplexityValues)`）に使用されるため `schemas.ts` に含める。`index.tsx` の緩いスキーマ（全フィールド `z.string()`）を削除し、サーバー側スキーマに置き換え。不要になった `import { z } from "zod"` を両ファイルから削除。`parseLockoutDuration` / `parseSessionTimeout` ヘルパー関数はサーバー側ビジネスロジックのため `action.server.ts` に残す。`index.tsx` の `formatComplexity` 関数内のハードコードされた複雑度値の型改善は本Issueのスコープ外とする（任意で活用可）。
- **理由:** サーバー側の厳密なスキーマ（`z.coerce.number()`, `.transform()`, `z.enum()`）に統一。

#### 10. `app/routes/admin/system/acl/`

- **対象ファイル:** `schemas.ts`（新規）, `action.server.ts`, `index.tsx`
- **変更内容:** サーバー側の3スキーマ（`addPermissionSchema`, `updatePermissionSchema`, `deletePermissionSchema`）を全て `schemas.ts` にexport。`index.tsx` の `addSchema` を `addPermissionSchema` に置き換え。不要になった `import { z } from "zod"` を両ファイルから削除。`index.tsx` でインポートするのは `addPermissionSchema` のみ（`updatePermissionSchema` / `deletePermissionSchema` はサーバー側のみで使用）。
- **理由:** クライアント側は `addPermissionSchema` のみ使用（update/deleteは手動FormData構築）だが、全スキーマを `schemas.ts` に配置して一元管理。

#### 11. `app/routes/admin/system-mail/`

- **対象ファイル:** `schemas.ts`（新規）, `action.server.ts`, `index.tsx`
- **変更内容:** サーバー側の `updateMailSettingsSchema` を `schemas.ts` にexport。`index.tsx` の `mailSettingsSchema`（`serverType` のみ）を削除し、`updateMailSettingsSchema` に置き換え。不要になった `import { z } from "zod"` を両ファイルから削除。注意: `index.tsx` のインライン loader（サーバー専用モジュールをインポート）には触れない。
- **理由:** サーバー側のフルスキーマに統一。

### 12. 品質チェック

- `pnpm typecheck` で型チェック
- `pnpm lint:fix` でリント修正
- `pnpm format` でフォーマット
- `pnpm test` で既存テスト確認

## 設計判断

サーバーとクライアントでスキーマ内容が異なる4ルートでは、サーバー側のフルスキーマを `schemas.ts` に配置し共有する。理由: サーバー側のスキーマがバリデーションの正であり、Conform はフルスキーマでも正常動作するため。詳細は `adr.md` を参照。

## リスクと注意点

- **クライアント側バリデーションの変化**: features, security/login, acl, system-mail の4ルートではクライアント側のバリデーションが厳密になる。ただし Conform はフォームに存在しないフィールドを無視するため実害なし
- **`z.coerce.number()` のクライアント動作**: security/login の数値フィールド（`userPasswordMinLength`, `adminPasswordMinLength`, `lockoutAttempts`）が `<select>` 要素と組み合わさるが、`coerce` は文字列→数値変換を行うので問題なし。`getZodConstraint` が number スキーマに対して `type: "number"` 等の制約を生成する可能性があるが、現状 `index.tsx` では `getInputProps` を使わず手動で `name` を付与しているため、制約属性がHTML要素に直接反映されない。実装後に手動確認が必要
- **system-mail の `externalPort`**: `z.coerce.number().int().positive().optional()` であり、BUILTIN選択時にフォームに存在しない場合も `.optional()` により `undefined` で通過するため問題なし
- **system-mail のインライン loader**: `system-mail/index.tsx` はインライン loader でサーバー専用モジュール（`container`, `requireAuth` 等）を直接インポートしている。React Router v7 では loader export のあるルートモジュールはサーバーバンドルに適切に分離されるため、今回のスキーマ移動には影響しない。ビルドエラー発生時にこの既存問題と混同しないよう注意
- **バンドルサイズ**: フルスキーマ共有によるクライアントバンドル増加は数百バイト程度で無視可能

## テスト方針

- `pnpm typecheck` — 型の整合性確認
- `pnpm lint:fix` / `pnpm format` — コードスタイル確認
- `pnpm test` — 既存テスト通過確認
- `pnpm build` — ビルド成功確認（サーバー専用モジュールのクライアント混入防止）
- 手動確認（スキーマ乖離4ルート）:
  - `security/login`: `<select>` 要素が `z.coerce.number()` スキーマで正常動作すること
  - `features`: checkbox フィールドのフルスキーマ共有でフォーム送信・バリデーションが正常なこと
  - `acl`: `addPermissionSchema` への切り替えでフォーム動作が正常なこと
  - `system-mail`: BUILTIN/EXTERNAL 切り替え時のフォーム動作が正常なこと

## レビュー反映

### 修正した点
- P: system-mail の `externalPort`（`z.coerce.number().int().positive().optional()`）をリスクと注意点に追記
- P: system-mail のインライン loader の特殊性（サーバー専用モジュールのインポート）をリスクと注意点に追記
- P: customize の `SCOPE_MAP_TO_BACKEND` を action.server.ts に残す旨をステップ1に明記
- P: security/login の `z.coerce.number()` と Conform `getZodConstraint` の相互作用の手動確認をテスト方針に追記
- P: `passwordComplexityValues` を schemas.ts に含める理由（スキーマ定義で使用）を明記

### 取り込んだ改善提案
- S: カテゴリB/Cの各ルートでも `import { z } from "zod"` の削除を明記
- S: acl ルートで `index.tsx` がインポートするのは `addPermissionSchema` のみと明記
- S: system-mail ルートの `index.tsx` のインライン loader に触れない旨を明記
- S: `passwordComplexityValues` の `index.tsx` での型活用は本Issueスコープ外と注記

### 見送った提案とその理由
- S: カテゴリAをテーブル形式にする — 各ルートのスキーマ名が異なり、補足情報もあるため個別記載の方が実装時に見やすい
- S: カテゴリCの具体的なコード例の追記 — 既存パターン（localization等）を参照すれば十分であり、plan.md の肥大化を避ける

## 参考: エージェント比較

| 観点 | エージェント1 (アーキテクチャ) | エージェント2 (保守性) | エージェント3 (シンプルさ) |
|------|-------------------------------|------------------------|---------------------------|
| ベース採用 | x | x | o |
| 取り込んだ点 | リスク分析（z.coerce.number()、バンドルサイズ） | 命名規則、passwordComplexityValuesの扱い | ベースアプローチ |
