# PR Review #007 — Implement record detail edit/delete/reuse flows

**PR:** #39
**Date:** 2026-04-17
**Round:** 7回目 (最終 / Round 4 相当)

---

## Summary

- Blockers: 0
- Warnings: 0
- Notes: 多数
- Verdict: **APPROVED** (2回連続 Blocker/Warning 0 を満たす見込み)

---

## Frontend

### Blockers
なし

### Warnings
なし

### Notes
- 削除ダイアログ: ESC/バックドロップ/ARIA (role=dialog, aria-modal, aria-labelledby) / Cancel 初期フォーカス / 成功時に `setIsDeleteDialogOpen(false)` → `navigate` の順が適切。
- Options dropdown: 外側クリック/ESC で閉じる、aria-haspopup=menu, aria-expanded, role=menu, role=menuitem が揃っており、ESC 時 trigger へフォーカス復帰。
- errors[0] 統一: edit/new 全体で一貫。
- hidden revision input で楽観ロック成立。
- フォーカストラップ未実装: `admin/system/customize/index.tsx` と同パターンで既存整合、Note 扱い。
- 空 `errors && errors[0]` の空 div: `login/index.tsx:79` と同パターンで既存整合、Note 扱い。

## Interface Adapter

### Blockers
なし

### Warnings
なし

### Notes
- Promise.all 並列化は edit/new 両方で正しく機能、型推論 OK。
- reuseRecord を GET で呼んでいるが `Record.reuse` は副作用なし。既存 use case シグネチャを保ったまま動作。
- deleteRecord は `revisions: new Map([[recordId, value.revision]])` で楽観ロックが流し込まれている。
- form.server.ts のリポジトリ直叩きと FieldDefinition 独自型定義は既存 record loader と同形状。別 Issue 候補 (Note)。

## Use Case / Domain

### Blockers
なし

### Warnings
なし

### Notes
- `updateRecord` に `revision` + `modifierId` が正しく渡り、entity の `Record.checkRevision` が発火。
- `deleteRecords` の単一削除利用は bulk API 仕様に整合、100件上限にも抵触しない。
- `reuseRecord` の draft は未保存、`toRecordFormValues` → `createRecord` で新規保存の流れ。
- `getStringValue` は FieldValue 判別共用体 30 variant すべてに対して安全動作確認済 (string / null / string[] / オブジェクト配列 / 単体オブジェクト / LOOKUP)。

## Test & Type Safety

### Blockers
なし

### Warnings
なし

### Notes
- `form.test.ts` 6 ケース PASS (emptyRecordFormValues / scalar / create は空省略 / 配列・null・missing / オブジェクト・オブジェクト配列 / update は空文字保持)
- `pnpm typecheck` PASS (react-router typegen + tsgo クリーン完走)
- `pnpm test` 147 files / 1330 tests PASS (既存回帰なし)
- 新規 cast 追加なし、既存 `as EditableFieldValue` のみ

---

## Design Decisions

追加 ADR は不要。既存 `.issue/31/adr.md` で ADR-001 / ADR-002 が整理済み。

---

## 完了判定

- review-006 (Round 3): 実質 Warning 0 (修正済み / Notes 扱い)
- review-007 (Round 4): Warning 0
- **2回連続 Blocker/Warning 0 に達したので、PR レビュー完了**
