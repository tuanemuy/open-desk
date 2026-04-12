# PR Review #002 — refactor: extract Zod schemas to schemas.ts for remaining 11 routes

**PR:** #8
**Date:** 2026-04-12
**Round:** 2回目

---

## Summary

- Blockers: 0
- Warnings: 0
- Notes: 7
- Verdict: **APPROVED**

---

### Final Verification

#### Blockers
なし

#### Warnings
なし

#### Notes
- [N-001] 全11ルートの schemas.ts の export 名と、action.server.ts / index.tsx の import 名が完全一致。不整合なし
- [N-002] 全 action.server.ts / index.tsx から `import { z } from "zod"` が正しく削除済み。未使用インポートなし
- [N-003] コメントアウト、TODO、FIXME、デバッグコードの残存なし
- [N-004] インポート順序が既存パターン（`./+types/index` → `./action.server` type → `./schemas`）と一貫
- [N-005] acl の action.server.ts は3スキーマ全て import、index.tsx は addPermissionSchema のみ import（計画通り）
- [N-006] 機械的なリファクタリングとして一貫性があり、ロジック変更を含まない
- [N-007] 1回目 W-001（passwordComplexityValues の export）は ADR-001 記録済みの判断として許容済み

---

## Design Decisions

特になし

---

**2回連続 Blocker 0 / Warning 0 → レビュー完了**
