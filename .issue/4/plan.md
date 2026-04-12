# 実装計画 — Issue #4: バグ: レコード作成フォームのフィールドコードが DB 定義と不一致

**Issue:** #4
**作成日:** 2026-04-12
**複雑度:** 小規模

---

## 目的

レコード追加フォームの action.server.ts と loader.server.ts で使用しているフィールドコードが、DB (seed.ts) に格納されている実際のフィールドコードと一致していないバグを修正する。これにより顧客ランクドロップダウンが空になる問題、およびフィールド値が正しく保存されない問題を解消する。

## スコープ

### 含まれるもの
- action.server.ts のフィールドコード修正（3箇所）
- loader.server.ts のフィールドコード修正（1箇所）

### 含まれないもの
- フォームスキーマ (schemas.ts) のプロパティ名変更（フォームのフィールド名はUIの関心事であり、DBフィールドコードと一致する必要はない）
- action.server.ts に存在するが seed.ts にないフィールド（fax, notes）の対応（別Issue起票予定）

## 実装ステップ

### 1. action.server.ts のフィールドコード修正

- **対象ファイル:** `app/routes/apps/app/records/new/action.server.ts`
- **変更内容:**
  - L30: `fieldValues.set("company", ...)` → `fieldValues.set("company_name", ...)`
  - L42: `fieldValues.set("person", ...)` → `fieldValues.set("contact_name", ...)`
  - L71: `fieldValues.set("rank", ...)` → `fieldValues.set("customer_rank", ...)`
- **理由:** DB の fields テーブルに登録されている fieldCode と一致させる必要がある

### 2. loader.server.ts のフィールドコード修正

- **対象ファイル:** `app/routes/apps/app/records/new/loader.server.ts`
- **変更内容:**
  - L66: `field.fieldCode === "rank"` → `field.fieldCode === "customer_rank"`
- **理由:** DB の fields テーブルの顧客ランクフィールドのコードは `customer_rank` であるため

### 3. 一覧画面 loader.server.ts のフィールドコード修正（レビュー指摘追加）

- **対象ファイル:** `app/routes/apps/app/loader.server.ts`
- **変更内容:**
  - L106: `getText("company")` → `getText("company_name")`
  - L108: `getText("person")` → `getText("contact_name")`
- **理由:** 一覧画面でも同様の不一致があり、会社名と担当者名が空表示になる

### 4. email フィールドの type 修正（レビュー指摘追加）

- **対象ファイル:** `app/routes/apps/app/records/new/action.server.ts`
- **変更内容:**
  - L79: `type: "LINK"` → `type: "SINGLE_LINE_TEXT"`
- **理由:** DB 定義では email は SINGLE_LINE_TEXT だが、LINK として保存しようとするとバリデーションエラーになる

### 5. コード品質チェック

- `pnpm typecheck` で型チェック
- `pnpm lint:fix && pnpm format` でコード品質確認

## リスクと注意点

- フォームの Zod スキーマ (schemas.ts) のプロパティ名 (`company`, `person`, `rank` 等) はそのまま維持する。これらはフォーム入力の名前であり、action.server.ts 内で DB フィールドコードに変換するのが正しい設計
- 他のルート（レコード編集等）に同様の不一致がないか確認すべきだが、Issue #4 のスコープは新規作成フォームに限定する

## テスト方針

- 型チェック・lint が通ることを確認
- 開発サーバーで顧客ランクドロップダウンに選択肢が表示されることを確認
- フォーム送信後、DB に正しいフィールドコードで値が保存されることを確認
