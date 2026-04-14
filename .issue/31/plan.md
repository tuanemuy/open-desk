# 実装計画 — Issue #31: Implement record detail edit/delete/reuse flows

**Issue:** #31
**作成日:** 2026-04-14

---

## 目的

レコード詳細画面から既存レコードの編集・削除・再利用フローに入れるようにし、`spec/manual-tests/record-crud.md` の TC-006 から TC-009 を実施可能にする。

## スコープ

### 含まれるもの
- レコード詳細画面の `Edit record` / `Reuse record` / 削除導線の接続
- 既存レコードを編集するための画面・loader・action の追加
- レコード再利用時に既存値を初期値として新規作成画面へ流し込む処理
- レコード詳細画面からの削除確認ダイアログと削除 action の追加

### 含まれないもの
- レコード一覧画面の `Edit` / `Delete` ボタンの接続
- フィールド定義に応じた汎用フォーム化
- 添付ファイルの実アップロードや詳細画面の前後移動ボタンの接続

## 実装ステップ

### 1. レコードフォームの入出力変換を共通化する

- **対象ファイル:** `app/routes/apps/app/records/new/action.server.ts`, `app/routes/apps/app/records/new/loader.server.ts`, `app/routes/apps/app/records/new/index.tsx`
- **変更内容:** 顧客リスト用フォームの値と `FieldValue` の相互変換、ランク選択肢、初期値生成を共通関数に切り出し、新規作成画面が外部から初期値を受け取れるようにする。
- **理由:** 編集画面と再利用フローでも同じフィールドセットを扱うため、個別実装にするとマッピング漏れが起きやすい。

### 2. 既存レコード編集画面を追加する

- **対象ファイル:** `app/routes.ts`, `app/routes/apps/app/records/edit/*`（新規）, 必要に応じて共通フォームファイル
- **変更内容:** `apps/:appId/records/:recordId/edit` ルートを追加し、既存レコードを loader で取得してフォーム初期値に変換、`updateRecord` を呼ぶ action を実装する。保存成功後は詳細画面へ戻す。
- **理由:** 新規作成画面の UI を再利用しつつ、Issue の完了条件である「詳細から編集画面へ遷移」と「保存後に詳細へ戻る」を素直に満たせる。

### 3. 再利用フローを新規作成画面に接続する

- **対象ファイル:** `app/routes/apps/app/records/record/index.tsx`, `app/routes/apps/app/records/new/loader.server.ts`
- **変更内容:** 詳細画面の `Reuse record` を `records/new?reuseRecordId=...` に接続し、new loader が `reuseRecord` を呼んで初期値を埋める。
- **理由:** 再利用は「保存済みレコードの複製」ではなく「値コピー済みの新規作成画面を開く」要件なので、既存の作成フローに初期値注入するのが最小変更。

### 4. 詳細画面に削除確認ダイアログと削除 action を追加する

- **対象ファイル:** `app/routes/apps/app/records/record/action.server.ts`, `app/routes/apps/app/records/record/index.tsx`, `app/routes/apps/app/records/record/loader.server.ts`, `app/routes/apps/app/records/record/schemas.ts`
- **変更内容:** 詳細 loader で revision を返し、`deleteRecord` intent を追加して `deleteRecords` を1件削除に利用する。画面側は確認ダイアログを表示し、成功時に一覧へ遷移する。
- **理由:** 削除確認とキャンセル導線は詳細画面内で完結させるのが最も自然で、既存の composite action と整合する。

### 5. 手動テスト仕様に沿って型チェックと動作確認を行う

- **対象ファイル:** `.issue/31/testing.md`
- **変更内容:** `pnpm typecheck` を実行し、`pnpm db:seed` と `pnpm dev` を使うブラウザ確認手順に従って TC-006 から TC-009 を確認する。自動テスト追加が難しい場合は理由を明示する。
- **理由:** 今回の主対象は UI ルート接続であり、少なくとも型安全性と手動シナリオの成立を確認する必要がある。

## 設計判断

- 編集は詳細画面のインライン編集ではなく専用の edit ルートを追加する
- 再利用は専用保存処理を増やさず、新規作成画面へ初期値を渡す方式を採用する
- 削除は新規 route を増やさず、詳細画面の composite action に集約する

## リスクと注意点

- `new` 画面は顧客リストアプリ向けの固定フォームであるため、編集画面も同じ前提に合わせる必要がある
- `reuseRecord` の返却値にはシステムフィールドが含まれない前提なので、画面側で hidden な補正を入れない
- 削除後の一覧確認は一覧取得アダプタの実装状況に影響されるため、詳細から一覧遷移と not found の回避も併せて見る

## テスト方針

- `pnpm typecheck` でルート追加と共通化による型崩れがないことを確認する
- `pnpm db:seed` 後に `pnpm dev` で顧客リストの既存レコードを使い、TC-006 から TC-009 を手動で確認する
- 可能なら対象 use case の既存単体テストが引き続き通ることを限定実行で確認する
