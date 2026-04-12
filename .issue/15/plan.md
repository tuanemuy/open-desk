# 実装計画 — Issue #15: バグ: レコード作成フォームの fax/notes フィールドが DB に未定義

**Issue:** #15
**作成日:** 2026-04-12

---

## 目的

レコード作成フォームに存在する fax と notes の入力欄に対応するフィールド定義が DB の fields テーブルに存在しないため、これらのフィールドに値を入力してフォームを送信すると `RecordValidationService` がバリデーションエラーを返す問題を修正する。

## スコープ

### 含まれるもの
- seed.ts に fax と notes のフィールド定義を追加
- seed.ts のフォームレイアウトに fax と notes を追加
- seed.ts のデフォルトビューに fax と notes を追加
- seed.ts のサンプルレコードに fax と notes のデータを追加

### 含まれないもの
- レコード編集ページの修正（fax/notes は新規作成フォームのみに存在）
- DB マイグレーション（seed.ts はシードスクリプトでありスキーマ変更ではない）
- フォーム・action・schema の変更（これらは既に正しく実装されている）

## 設計判断

Issue に3つの対応案が提示されていたが、**案1: seed.ts にフィールド定義を追加する** を採用する。

理由:
- フォーム UI (index.tsx)、バリデーションスキーマ (schemas.ts)、サーバーアクション (action.server.ts) が既に fax/notes を正しく実装している
- fax は `SINGLE_LINE_TEXT` 型、notes は `MULTI_LINE_TEXT` 型として action.server.ts で設定されている
- 不足しているのは seed.ts のフィールド定義のみ
- フォームの設計意図（FAX番号と備考欄）を尊重する

## 実装ステップ

### 1. seed.ts にフィールド定義を追加

- **対象ファイル:** `app/core/adapters/drizzleSqlite/seed.ts`
- **変更内容:**
  - `fax` フィールド（SINGLE_LINE_TEXT型）の定義を追加（tel の後に配置）
  - `notes` フィールド（MULTI_LINE_TEXT型）の定義を追加（email の後に配置）
  - フィールドID用の変数 `faxFieldId`, `notesFieldId` を追加
  - コンソールログのフィールド数を 8 → 10 に更新
- **理由:** フォームが参照するフィールドコードが DB に存在しないとバリデーションエラーになるため

### 2. seed.ts のフォームレイアウトに追加

- **対象ファイル:** `app/core/adapters/drizzleSqlite/seed.ts`
- **変更内容:**
  - layoutRows に fax（SINGLE_LINE_TEXT, tel の後）と notes（MULTI_LINE_TEXT, email の後）の行を追加
- **理由:** フォームレイアウトにフィールドが含まれていないと、フォーム表示時にレイアウトと定義に不整合が生じる可能性がある

### 3. seed.ts のデフォルトビューに追加

- **対象ファイル:** `app/core/adapters/drizzleSqlite/seed.ts`
- **変更内容:**
  - views の fields 配列に `"fax"` と `"notes"` を追加
- **理由:** 一覧表示でも fax と notes を確認できるようにする

### 4. seed.ts のサンプルレコードに追加

- **対象ファイル:** `app/core/adapters/drizzleSqlite/seed.ts`
- **変更内容:**
  - 3件のサンプルレコードの fieldValues に fax（SINGLE_LINE_TEXT）と notes（MULTI_LINE_TEXT）のデータを追加
- **理由:** テスト用データとしてフィールド値を含めておく

## リスクと注意点

- seed.ts の変更のみであり、既存のDBスキーマやマイグレーションには影響しない
- 既にシードされたDBには変更が反映されない（再シードが必要）
- フォームレイアウトの行順序は既存パターンに合わせる

## テスト方針

- `pnpm typecheck` で型チェック
- `pnpm lint:fix` と `pnpm format` でコード品質確認
- `pnpm test` で既存テストが壊れていないことを確認
