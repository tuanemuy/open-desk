# PR Review #006 — Implement record detail edit/delete/reuse flows

**PR:** #39
**Date:** 2026-04-17
**Round:** 6回目 (Round 3 相当)

---

## Summary

- Blockers: 0
- Warnings: 1 (このラウンドで追加修正済み)
- Notes: 多数
- Verdict: **Pending final verification**

---

## Frontend

### Blockers
なし

### Warnings
- **[W-F-R3-001]** (このラウンドで追加修正済み) 削除成功時にダイアログを明示的に閉じていない
  - 場所: `app/routes/apps/app/records/record/index.tsx` `fetcher.register("deleteRecord", ...)`
  - 修正: `onSuccess` で `setIsDeleteDialogOpen(false)` を追加してからナビゲート
- **[W-F-R3-002]** (既存パターン整合) `errors && errors[0]` で空配列時に空 div が描画される可能性
  - 同リポジトリの `app/routes/login/index.tsx:79` も同パターンで統一済 → Note 扱い
- **[W-F-R3-003]** (現仕様上問題なし) `getStringValue` の `typeof` ガードで silent data loss のリスク
  - 現状 customer_list アプリ固定のフォームで、form.ts 上の `toRecordFormValues` が対象にする 10 fieldCode は SINGLE_LINE_TEXT / MULTI_LINE_TEXT / DROP_DOWN のみ。`form.ts:74-78` の JSDoc でも明示済 → Note 扱い
- **[W-F-R3-004]** (既存パターン整合) ダイアログの厳密なフォーカストラップ未実装
  - `admin/system/customize/index.tsx` の AddFileDialog も未実装 → Note 扱い

### Notes
- Round 2 までの解消 (ESC/バックドロップ/ARIA/Cancelフォーカス/Options dropdown/errors[0]) はすべて維持
- `getStringValue` の Round 3 修正は Frontend 表示に悪影響なし、むしろ安全側
- `form.errors` と `fields.X.errors` で truthy 判定の書き方が一貫しない軽微な点は将来統一候補

## Interface Adapter

### Blockers
なし

### Warnings
なし

### Notes
- `new/loader.server.ts` の baseDataPromise は両分岐で必ず await されるため unhandledRejection は起こらない (W-IA-R2-001 は誤検知確定)
- Promise.all 並列化は edit/new 両方で正しく機能、型推論 OK
- `getStringValue` の Round 3 修正は adapter 境界契約に影響なし

## Use Case / Domain

### Blockers
なし

### Warnings
なし

### Notes
- `getStringValue` は FieldValue 判別共用体 30 variant すべてに対して安全動作を確認:
  - string 系 (14+): `String(value.value)` で OK
  - string-or-null (DATE/TIME/DATETIME): null 早期 return
  - string[] 系 (CHECK_BOX/MULTI_SELECT/CATEGORY): filter join
  - オブジェクト配列 (USER_SELECT/ORGANIZATION_SELECT/GROUP_SELECT/FILE/STATUS_ASSIGNEE/SUBTABLE/REFERENCE_TABLE): filter で空配列 → ""
  - 単体オブジェクト (CREATOR/MODIFIER): typeof object で ""
  - LOOKUP (string | readonly string[]): 両ケース OK
- DROP_DOWN の空文字許容は `valueObject.ts:348-351` で確認済
- form.test.ts が 7 ケースまでカバー拡充

## Test & Type Safety

### Blockers
なし

### Warnings
なし

### Notes
- `pnpm typecheck` PASS、`pnpm test` 147 files / 1330 tests PASS
- 新規 cast は追加なし (既存 `as EditableFieldValue` のみ)
- テストの `as unknown as FieldValue` は異常値再現の意図的局所キャスト

---

## Design Decisions

追加 ADR は不要。
