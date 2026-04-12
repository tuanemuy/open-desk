# 実装計画 — Issue #2: バグ: スペース作成・アプリ作成ページのルートが未実装

**Issue:** #2
**作成日:** 2026-04-12

---

## 目的

ポータルのメニューからリンクされている `/spaces/new`（スペース作成）と `/apps/store`（アプリストア）のルートを実装し、404/Internal Server Error を解消する。

## スコープ

### 含まれるもの
- `app/routes.ts` へのルート定義追加（2ルート）
- `/spaces/new` のスペース作成フォームページ（通常/ゲスト切替対応）
- `/apps/store` のアプリストアページ（テンプレート一覧 + はじめから作成）
- 既存ユースケース（createSpace, createGuestSpace, createAppBlank, listAppTemplates）の接続

### 含まれるもの（追加）
- ポータルの Spaces/Apps セクション「Create space」「Create app」ボタンを `<button>` → `<Link>` に修正（Issue 再現手順 Step 4 の完全カバー）

### 含まれないもの
- メンバー検索・追加UI（作成者のみ自動追加のMVP）
- カバー画像選択UI（CoverImage.default() を使用）
- テンプレートからのアプリ作成フロー（テンプレート一覧は表示のみ）
- フォームデザイナー（DnD）等の高度なUI

## 実装ステップ

### 1. ルート定義の追加

- **対象ファイル:** `app/routes.ts`
- **変更内容:** `layout("routes/layout.tsx", [...])` 内に2ルートを追加
  - `route("spaces/new", "routes/spaces/new/index.tsx")` — `spaces/:spaceId` の前に配置
  - `route("apps/store", "routes/apps/store/index.tsx")` — `apps/:appId` の前に配置
- **理由:** React Router v7 はルート定義順でマッチングするため、パラメータルートより前に静的パスを配置しないと `new` や `store` がパラメータとして解釈される

### 2. スペース作成ページ — schemas.ts

- **対象ファイル:** `app/routes/spaces/new/schemas.ts`（新規）
- **変更内容:** Zod スキーマ `createSpaceSchema` を定義
  - `name`: z.string().min(1).max(128) — 必須
  - `isPrivate`: z.coerce.boolean().default(false)
  - `useMultiThread`: z.coerce.boolean().default(false)
  - `fixedMember`: z.coerce.boolean().default(false)
  - `isGuest`: z.coerce.boolean().default(false) — hidden field
- **理由:** ドメインの SpaceName（1-128文字）に合わせたバリデーション。boolean フィールドは `.default(false)` で Zod パース後に必ず `boolean` 型を返す（ユースケースが `boolean` 必須のため）。schemas.ts 分離は既存パターンに準拠

### 3. スペース作成ページ — loader.server.ts

- **対象ファイル:** `app/routes/spaces/new/loader.server.ts`（新規）
- **変更内容:**
  - `requireAuth` で認証チェック
  - URL クエリパラメータ `?guest=true` を読み取り `isGuest` フラグとして返す
- **理由:** ポータルから `/spaces/new?guest=true` でゲストスペース作成画面にもアクセスする（portal/index.tsx のリンク参照）

### 4. スペース作成ページ — action.server.ts

- **対象ファイル:** `app/routes/spaces/new/action.server.ts`（新規）
- **変更内容:**
  - `defineHandler` + `createCompositeAction` パターンで `createSpace` intent を定義
  - `isGuest` フラグに応じて `createSpace` / `createGuestSpace` ユースケースを呼び分け
  - メンバー構築: `auth.user.loginName` を使って `MemberEntity.create({ type: MemberEntityType.User, id: auth.userId, code: auth.user.loginName })` で作成者を管理者メンバーとして追加
  - **通常スペース**: CoverImage.default()、AppCreationPermission.Everyone をデフォルト値に使用。`isPrivate`, `useMultiThread`, `fixedMember` はフォームの値を渡す
  - **ゲストスペース**: `createGuestSpace` は `isPrivate` フィールドを受け取らない（ドメイン内部で `isPrivate: true` が強制される）。フォームの `isPrivate` 値は action では使用しない
  - 成功時は `{ spaceId }` を返す
- **理由:** 通常/ゲスト作成を同一ルートで処理。既存の compositeAction パターンに準拠

### 5. スペース作成ページ — index.tsx

- **対象ファイル:** `app/routes/spaces/new/index.tsx`（新規）
- **変更内容:**
  - loader/action を re-export
  - Conform + useCompositeAction でフォーム構成
  - フィールド: スペース名（必須）、非公開チェックボックス、マルチスレッドチェックボックス
  - ゲストモード時は isPrivate を固定ON・変更不可
  - 成功時は `/spaces/${spaceId}` にナビゲート
  - キャンセルで `/portal` に戻る
- **理由:** spec/flows/space-create.md の基本設定タブに対応。TC-001〜TC-011の基本フローをカバー

### 6. アプリストアページ — schemas.ts

- **対象ファイル:** `app/routes/apps/store/schemas.ts`（新規）
- **変更内容:** `createAppBlankSchema` を定義
  - `name`: z.string().default("新しいアプリ") — Zod パース後に必ず `string` を返す
- **理由:** `createAppBlank` は `name: string` を必須で要求するため、`.default()` でスキーマレベルでデフォルト値を設定。schemas.ts 分離パターンに準拠

### 7. アプリストアページ — loader.server.ts

- **対象ファイル:** `app/routes/apps/store/loader.server.ts`（新規）
- **変更内容:**
  - `requireAuth` で認証チェック
  - `listAppTemplates` ユースケースでテンプレート一覧を取得
- **理由:** アプリストア画面にテンプレートを表示するため

### 8. アプリストアページ — action.server.ts

- **対象ファイル:** `app/routes/apps/store/action.server.ts`（新規）
- **変更内容:**
  - `createBlank` intent: `createAppBlank` ユースケースを呼び出し
  - `spaceId: null`, `threadId: null` を渡す（スペースに紐づかない独立アプリとして作成）
  - `creatorId` は `auth.userId` を使用
  - 成功時は `{ appId }` を返す
- **理由:** 「はじめから作成」ボタンからアプリを作成するため

### 9. アプリストアページ — index.tsx

- **対象ファイル:** `app/routes/apps/store/index.tsx`（新規）
- **変更内容:**
  - loader/action を re-export
  - 「はじめから作成」ボタン（formでsubmit）
  - テンプレート一覧カード（loaderData の templates を表示、閲覧のみ）
  - 成功時は `/apps/${appId}/settings` にナビゲート
- **理由:** spec/flows/app-create.md のアプリストア画面に対応。TC-001, TC-002, TC-012 をカバー
- **注記:** 成功時の遷移先はフォーム設計画面（spec 記載: `/k/admin/app/flow?app={id}#section=form`）が未実装のため、暫定的にアプリ設定画面 `/apps/${appId}/settings` にナビゲートする

### 10. ポータルの Create ボタン修正

- **対象ファイル:** `app/routes/portal/index.tsx`
- **変更内容:**
  - Spaces セクション下部の「Create space」`<button>` → `<Link to="/spaces/new">`
  - Apps セクション下部の「Create app」`<button>` → `<Link to="/apps/store">`
- **理由:** Issue の再現手順 Step 4「ポータル画面の Apps セクション『Create app』ボタンはクリックしても何も起きない」を解消。ルート実装と同時に修正することで Issue を完全にカバーする

## 設計判断

1. **独立ページ vs ダイアログ**: 独立ページとして実装。ポータルのリンクが `/spaces/new` を指しており、ダイアログ化はポータル側の大幅改修が必要。詳細は adr.md 参照
2. **通常/ゲストスペースを同一ルート**: クエリパラメータ `?guest=true` で切替。ポータルのリンクが既にこのパターン
3. **メンバー管理は作成者のみMVP**: メンバー検索UIは複雑。作成後のスペース設定で追加可能

## リスクと注意点

- ルート順序: `/spaces/new` は `/spaces/:spaceId` より前に必須。逆だと `new` がパラメータ扱い
- createSpace は members に少なくとも1人の管理者が必須（NoAdminMember エラー回避）
- ゲストスペース作成は `guestSpaceCreate` 権限が必要。権限不足時のエラーハンドリング要
- テンプレート一覧が空の環境でも「はじめから作成」が常に動作すること
- アプリ上限（1000件）到達時のエラーメッセージ表示

## テスト方針

- `pnpm typecheck` / `pnpm lint:fix` / `pnpm format` でコード品質確認
- 手動テスト: `/spaces/new` と `/apps/store` で 404 が解消されることを確認
- spec/manual-tests/space-create.md の TC-001, TC-007, TC-010 を優先確認
- spec/manual-tests/app-create.md の TC-001, TC-002, TC-012 を優先確認
- `pnpm test` で既存テストが壊れていないことを確認

## 参考: エージェント比較

| 観点 | エージェント1 (アーキテクチャ) | エージェント2 (保守性) | エージェント3 (シンプルさ) |
|------|-------------------------------|------------------------|---------------------------|
| ベース採用 | × | × | ○ |
| 取り込んだ点 | createFromTemplate intent の検討、パフォーマンス考慮 | テストケースマッピングの詳細さ、schemas.ts をアプリストアにも適用 | — |

## レビュー反映

### 修正した点
- P-001: MemberEntity.create に `auth.user.loginName` を使用する具体的な構築手順をステップ4に追記
- P-002: `createAppBlank` の `spaceId: null`, `threadId: null` をステップ8に明記
- P-003: `createGuestSpace` が `isPrivate` を受け取らないことをステップ4に明記（ドメイン内部で強制 true）
- P-004: boolean スキーマフィールドを `.optional()` → `.default(false)` に変更（ステップ2）
- P-005: `createAppBlankSchema` の `name` を `.optional()` → `.default("新しいアプリ")` に変更（ステップ6）
- 成功時遷移先の注記をステップ9に追加（フォーム設計画面未実装のため暫定的に設定画面へ）

### 取り込んだ改善提案
- S-002/S-003: ポータルの Spaces/Apps セクション「Create space」「Create app」ボタンを `<button>` → `<Link>` に修正するステップ10を追加（1行修正で Issue をより完全にカバー）

### 見送った提案とその理由
- S-001 (R1): `createSpace` 成功時に `defaultThreadId` を使って遷移 → スペース詳細ページ側の挙動次第。現時点ではシンプルに `/spaces/${spaceId}` で十分
- S-003 (R2): `appCreationPermission` の管理者限定チェックボックス追加 → MVP スコープを超える。spec との乖離は認識するが、Issue の核心は 404 解消
