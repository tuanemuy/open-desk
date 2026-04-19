# PR Review #004 — Implement record detail edit/delete/reuse flows

**PR:** #39
**Date:** 2026-04-17
**Round:** 4回目 (今回の再レビュー)

---

## Summary

- Blockers: 1 (PR HEAD に対する指摘。作業ツリーでは修正中・未 push)
- Warnings: 12 (PR HEAD) / 10 (作業ツリー反映後)
- Notes: 多数
- Verdict: **BLOCKED**

---

## 前提 (重要)

PR HEAD (`origin/issue/31/record-detail-actions`, commit `49d4e72`) と
ローカル作業ツリーには差がある:

- **PR HEAD**: `form.ts` に `container/server.instance` などサーバー専用依存が直接 import されている (client/server 境界違反の再発)
- **作業ツリー**: 未コミットで `form.server.ts` に分離済み、`form.test.ts` を追加済み、`edit/loader.server.ts` と `new/loader.server.ts` は `form.server.ts` を参照する形に修正済み

review-001 で B-001 として指摘され、review-002/003 では解消扱いになっていたが、
**PR にはまだ push されていない**ため、現時点の PR HEAD では再発扱い。

以降、「PR HEAD」と「作業ツリー反映後」の両方の観点で整理する。

---

## Blockers

- **[B-004-001]** Server-only 依存が client bundle に混入 (PR HEAD 限定。作業ツリーでは解消済み)
  - 場所: `app/routes/apps/app/records/form.ts:1-6` (HEAD)
  - 理由: `recordFormSchema` は `new/schemas.ts` / `edit/schemas.ts` から再 export され、route `index.tsx` (client bundle) で使われている。その上流に `container/server.instance` / `container.unitOfWorkProvider.transaction` が居座っているため、production build の browser bundle に混入する。review-001 の B-001 と同じ指摘。
  - 提案: 作業ツリーに既にある `form.server.ts` 分離をコミットし PR に push する。具体的には以下をコミット:
    - M `app/routes/apps/app/records/form.ts` (server-only 依存を除去)
    - M `app/routes/apps/app/records/edit/loader.server.ts` (import 先を `../form.server` に)
    - M `app/routes/apps/app/records/new/loader.server.ts` (同上)
    - A `app/routes/apps/app/records/form.server.ts`
    - A `app/routes/apps/app/records/form.test.ts`

---

## Frontend Warnings

- **[W-F1]** 削除確認ダイアログに ESC / バックドロップクリックで閉じる操作がない
  - 場所: `app/routes/apps/app/records/record/index.tsx:377-412`
  - 理由: `admin/system/customize/index.tsx:287-295` と `components/layout/BookmarkPanel.tsx:81-95` に確立されたパターンあり、本PRのみ外している。
  - 提案: `useEffect` で Escape `keydown` ハンドラ、バックドロップ別要素化。

- **[W-F2]** 削除ダイアログに `role="dialog"` / `aria-modal="true"` / `aria-labelledby` 欠落
  - 場所: `app/routes/apps/app/records/record/index.tsx:378-411`
  - 提案: コンテンツ div に ARIA 追加、`<h2 id="delete-record-title">` 化。

- **[W-F3]** 削除ダイアログのフォーカス制御未実装
  - 場所: 同上 377-412
  - 提案: 開いた時 Cancel にフォーカス、閉じたら Options へ戻す。

- **[W-F4]** Options ドロップダウン外側クリック/ESC/ARIA 欠落
  - 場所: `app/routes/apps/app/records/record/index.tsx:160-183`
  - 提案: `useRef` + `mousedown` で外側クリック検知、`aria-haspopup` / `aria-expanded` / `role="menu"`。

- **[W-F5]** `{fields.xxx.errors}` に配列を直接レンダしている
  - 場所: edit/index.tsx, new/index.tsx の各エラー表示
  - 提案: `errors[0]` に揃える (同リポジトリ `login/index.tsx:79` に準拠)

- **[W-F6]** edit/index.tsx と new/index.tsx の form JSX が ~320 行重複 (別Issue候補)
  - 場所: `edit/index.tsx:57-386` と `new/index.tsx:57-385`
  - 提案: `RecordFormFields` コンポーネント抽出。PR スコープ外として別Issue化。

## Interface Adapter Warnings

- **[W-IA1]** `form.server.ts` が route 配下で UoW/リポジトリ直叩き (既存パターン踏襲だが新規拡散)
  - 場所: `app/routes/apps/app/records/form.server.ts:17-69` (作業ツリー)
  - 提案: application layer への抽出は別Issue候補。

- **[W-IA2]** `FieldDefinition` 型を route 側で自前定義し cast している (型ドリフトリスク)
  - 場所: `form.server.ts:7-15,29` (作業ツリー) / `form.ts:53-62,76` (HEAD)
  - 提案: ドメインの `Field` / `FieldProperties` 判別共用体を直接使い narrowing を効かす。

- **[W-IA3]** `setFieldValue` の `as EditableFieldValue` が narrowing を失う
  - 場所: `form.ts:158-173`
  - 提案: 長期的には domain 側コンストラクタ。短期は `as` のままで許容範囲 (局所 narrow)。別Issue候補。

- **[W-IA4]** `reuseRecord` に loader (GET) で `creatorId` を渡している
  - 場所: `new/loader.server.ts:40-49`, `app/core/application/record/reuseRecord.ts:9-36`
  - 提案: use case 側の整理は別Issue。本PRでは loader コメントで副作用無しを明示。

- **[W-IA5]** loader 内で `loadRecordFormBaseData` と `getRecord`/`reuseRecord` が直列
  - 場所: `edit/loader.server.ts:26-50`, `new/loader.server.ts:25-55`
  - 提案: `requireAuth` 後 `Promise.all`。

## Use Case / Domain Warnings

- **[W-UD1]** edit が「未入力 = 空文字上書き」になる設計 (仕様整合、要コメント化)
  - 場所: `form.ts:74-76,158-173`
  - 提案: JSDoc で「更新は画面全フィールドを現在値で送り返す」ことを明示。差分追跡化は別Issue候補。

- **[W-UD2]** `getStringValue` が null を `"null"` 文字列化する潜在バグ
  - 場所: `form.ts:175-192`
  - 理由: `String(null) === "null"`。`value.value ?? ""` の `??` は "value" プロパティの nullish ではなく、`value: null` で `String(null)` が通ってしまう。
  - 提案: `if (value.value == null) return "";` を Array.isArray チェックより先に挿入。

## Test & Type Safety Warnings

- **[W-TS1]** `getStringValue` の配列値分岐と null 分岐がテスト未カバー
  - 場所: `form.test.ts`
  - 提案: 配列値 / null 値 / 存在しない fieldCode のケース追加。

- **[W-TS2]** 手動動作確認が未実施 (PR 本文で明記)
  - 場所: `.issue/31/progress.md`
  - 提案: マージ前に `pnpm dev` で 3 導線をスモーク。

---

## Notes (抜粋)

- **[N-001]** `reuseRecord` を GET link にしたのは ADR-002 の設計判断通り、loader で not found を 404 化している。
- **[N-002]** revision 楽観ロックが form → action → use case → Record.checkRevision まで繋がっている。
- **[N-003]** `deleteRecords` の 1件利用、`createCompositeAction` パターンは既存規約と整合。
- **[N-004]** `typecheck` PASS、`form.test.ts` 4ケース PASS。
- **[N-005]** 新規導入の cast は `form.ts:172` の `as EditableFieldValue` のみで局所的。

---

## Design Decisions

追加 ADR は不要。既存 ADR-001 / ADR-002 で説明済み。
