# PR Review #002 — fix: add /spaces/new and /apps/store routes

**PR:** #10
**Date:** 2026-04-12
**Round:** 2回目

---

## Summary

- Blockers: 0
- Warnings: 4 (うち2件は既存パターンで今回スコープ外、2件は修正対象)
- Notes: 13
- Verdict: **APPROVED with minor fixes**

---

### Frontend

#### Blockers
なし

#### Warnings
- **[W-001]** `fetcher.Form` で action URL に query params が引き継がれない可能性
  - 場所: `app/routes/spaces/new/index.tsx:70`
  - 理由: ゲストモード時、action側で `args.request.url` の `?guest=true` を読むが、`fetcher.Form` に `action` prop がないため query params が含まれない可能性がある
  - 提案: `<fetcher.Form method="post" action={isGuest ? "?guest=true" : undefined}>` を明示

- **[W-002]** `fields.name.errors` の配列レンダリング（既存パターンへの追従、スコープ外）

#### Notes
- 前回の B-001, W-001, W-002, W-003 は全て修正確認済み

### Security

#### Blockers
なし

#### Warnings
- 前回の W-004 (requireAuth redirect) と W-001 (createAppBlank permission) は既存パターン/設計、スコープ外

#### Notes
- B-002 (isGuest改ざん) は完全に修正済み。URL params + ユースケース層の権限チェックでdefense-in-depth確保

### Interface Adapter

#### Blockers
なし

#### Warnings
- **[W-003]** `createAppBlankSchema` に `max(64)` 制約がない
  - 場所: `app/routes/apps/store/schemas.ts:4`
  - 理由: ドメインの `APP_NAME_MAX_LENGTH = 64` に合わせるべき
  - 提案: `z.string().min(1).max(64).default("New App")`

#### Notes
- 前回の W-005, W-006, W-007 は修正確認済み
- ルート順序、loader/action パターン、型安全性は全て適切

---

## Design Decisions

特になし
