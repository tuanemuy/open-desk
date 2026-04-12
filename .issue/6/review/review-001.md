# PR Review #001 — refactor: extract Zod schemas to schemas.ts for remaining 11 routes

**PR:** #8
**Date:** 2026-04-12
**Round:** 1回目

---

## Summary

- Blockers: 0
- Warnings: 1
- Notes: 17
- Verdict: **APPROVED**

---

### Schema Pattern Consistency

#### Blockers
なし

#### Warnings
- **[W-001]** `passwordComplexityValues` を `schemas.ts` にエクスポートしているのは既存の8つの `schemas.ts` にはないパターン（全て `z.object(...)` のエクスポートのみ）
  - 場所: `app/routes/admin/security/login/schemas.ts:3`
  - 理由: 既存パターンとの一貫性がわずかに異なる。ただし `passwordComplexityValues` は `z.enum(passwordComplexityValues)` でスキーマ定義に不可欠な依存であるため合理的
  - 提案: ADR-001 に記録済みの判断通り。スキーマ定義の依存として `schemas.ts` に含めるのは正しい判断であり、変更不要。対応: 許容

#### Notes
- [N-001] 全11個の schemas.ts のファイル構造が既存パターンと完全に一致
- [N-002] スキーマ名のリネームが計画通りに正確に実施
- [N-003] `import { z } from "zod"` の削除が全22ファイルで正しく完了
- [N-004] `action.server.ts` の `defineHandler({ schema: ... })` 引数の更新が全11ルートで正確
- [N-005] `index.tsx` の `getZodConstraint` / `parseWithZod` の引数が全ルートで正確に更新
- [N-006] `acl/index.tsx` は `addPermissionSchema` のみインポート（計画通り）
- [N-007] `customize/action.server.ts` の `SCOPE_MAP_TO_BACKEND` が正しく残存
- [N-008] `security/login` の `parseLockoutDuration` / `parseSessionTimeout` が正しく残存

### Category C Correctness

#### Blockers
なし

#### Warnings
なし

#### Notes
- [N-009] features: 全10フィールドがサーバー側スキーマと完全一致
- [N-010] security/login: `passwordComplexityValues` + 全8フィールドのスキーマが正確
- [N-011] acl: 3スキーマ全てのフィールドが元の action.server.ts と完全一致
- [N-012] system-mail: 全7フィールド（`externalPort` の `z.coerce.number()` 含む）が正確
- [N-013] system-mail のインライン loader に一切の変更なし

### Import/Bundle Safety

#### Blockers
なし

#### Warnings
なし

#### Notes
- [N-014] 全11個の schemas.ts は `import { z } from "zod"` のみを外部インポートとして持つ
- [N-015] 全11個の action.server.ts からスキーマ定義の残骸なし
- [N-016] 全11個の index.tsx からローカルスキーマ定義の残骸なし
- [N-017] 全インポートパスが `"./schemas"` で統一

---

## Design Decisions

特になし（ADR-001, ADR-002 の計画時判断で全てカバー済み）
