# PR Review #005 — Implement record detail edit/delete/reuse flows

**PR:** #39
**Date:** 2026-04-17
**Round:** 5回目 (今回修正後の 2nd round)

---

## Summary

- Blockers: 0
- Warnings: 4 (うち 1 件は誤検知判定、2 件はこのラウンドで追加修正済み、1 件は仕様上問題なし)
- Notes: 多数
- Verdict: **Pending follow-up review** (修正が入っているのでもう1ラウンド)

---

## Frontend

### Blockers
なし

### Warnings
なし (Round 1 の W-F1〜W-F5 はすべて解消)

### Notes
- **[N-F1]** 削除ダイアログの ESC / バックドロップ / ARIA / フォーカス (Cancel) / Options dropdown の外側クリック + ESC + ARIA / errors[0] 化、すべて実装済み。
- **[N-F2]** Dialog 閉じた時のフォーカス復帰が未実装 (既存 `admin/system/customize/index.tsx` も同様なのでコードベース内整合)。
- **[N-F3]** 依存配列・cleanup ともに適切。React 警告なし。

## Interface Adapter

### Blockers
なし

### Warnings
- **[W-IA-R2-001]** (誤検知判定) `new/loader.server.ts:30-39` の baseDataPromise が浮く可能性 ← 反証済み
  - 理由: `if (!reuseRecordId)` 分岐で `await baseDataPromise` されるか、`Promise.all` に渡されるかのいずれかで必ず await されるため、unhandled rejection は発生しない。誤検知として除外。

### Notes
- **[N-IA1]** Promise.all 並列化は edit/new 両方で正しく動く。
- **[N-IA2]** `toUpdateRecordFieldValues` の JSDoc は適切。
- **[N-IA3]** `NewRecordLoaderData` に `reusedFromRecordId` フィールドは作業ツリー側にもないので差分懸念なし。

## Use Case / Domain

### Blockers
なし

### Warnings
- **[W-UD-R2-001]** (このラウンドで追加修正済み) `getStringValue` がオブジェクト配列 (USER_SELECT/FILE 等) を `"[object Object]"` 化していた
  - 修正: `Array.isArray` ブランチで `filter((v) => typeof v === "string")` を追加
- **[W-UD-R2-002]** (このラウンドで追加修正済み) `getStringValue` が非配列オブジェクト (CREATOR/MODIFIER) を `"[object Object]"` 化していた
  - 修正: `typeof value.value !== "string" && typeof value.value !== "number"` で "" を返す防御
- **[W-UD-R2-003]** (仕様上問題なし) `DROP_DOWN` の空文字上書き
  - `valueObject.ts:348-351` で `DropDownFieldValue.value: string` なので空文字は型的に許容

### Notes
- **[N-UD1]** form.test.ts に追加テスト (配列・null・missing) は網羅済み。今回さらに CREATOR/USER_SELECT のケースを追加。
- **[N-UD2]** `toRecordFormValues` が `getStringValue` 経由で `fieldValues.get(fieldCode)` の代わりに全走査している軽微な性能点 (フィールド 10 件規模なので実害なし)

## Test & Type Safety

### Blockers
なし

### Warnings
なし

### Notes
- **[N-TS1]** `pnpm typecheck` PASS、`pnpm test` 147 files / 1330 tests PASS (form.test.ts は 6 tests → 7 tests に増加予定)
- **[N-TS2]** 新規 cast は無し。既存 `as EditableFieldValue` のみ。
- **[N-TS3]** form.test.ts の as unknown as FieldValue は判別共用体外のケース再現のための局所キャストで許容範囲。

---

## Design Decisions

追加 ADR は不要。
