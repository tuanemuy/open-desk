# PR Review #001 — Implement record detail edit/delete/reuse flows

**PR:** #39
**Date:** 2026-04-14
**Round:** 1回目

---

## Summary

- Blockers: 1
- Warnings: 0
- Notes: 2
- Verdict: **BLOCKED**

---

### Frontend

#### Blockers
- **[B-001]** Browser-imported form helpers are mixed with server-only dependencies
  - 場所: `app/routes/apps/app/records/form.ts:1-5`, `app/routes/apps/app/records/new/schemas.ts:1`, `app/routes/apps/app/records/edit/schemas.ts:1-2`
  - 理由: `new/index.tsx` と `edit/index.tsx` は schema 経由で `../form` を読み込むため、`form.ts` に入った `container/server.instance` / repository 依存までクライアントバンドルに伝播する。これは route component の server/client 境界を壊し、production build やブラウザ実行時の不正な依存混入につながる。
  - 提案: schema・値変換などの client-safe helper と、`loadRecordFormBaseData` のような server-only loader helper を別モジュールに分離する。

#### Warnings
- なし

#### Notes
- edit / reuse / delete の導線自体は要件どおり detail 画面に接続されている。

### Interface Adapter

#### Blockers
- なし

#### Warnings
- なし

#### Notes
- `updateRecord`, `deleteRecords`, `reuseRecord` への接続方針は既存 use case の責務に収まっている。

### Test

#### Blockers
- なし

#### Warnings
- なし

#### Notes
- 既存の application test は通っているが、この時点では browser bundle 境界の破綻を防ぐ確認が不足している。

---

## Design Decisions

`ADR-001` として `.pr/39/adr.md` に記録する。
