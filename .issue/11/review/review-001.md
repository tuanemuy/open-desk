# PR Review #001 — fix: remove try-catch around requireAuth to allow redirect

**PR:** #17
**Date:** 2026-04-12
**Round:** 1回目

---

## Summary

- Blockers: 0
- Warnings: 0
- Notes: 10
- Verdict: **APPROVED**

---

### Security（認証・認可）

#### Blockers

なし

#### Warnings

なし

#### Notes

- **[N-001]** 修正は正確かつ必要十分。`requireAuth` は認証失敗時に `throw redirect("/login")` を実行する。修正前の `try-catch` はこの Response オブジェクトも捕捉してしまい、未認証ユーザーが保護されたページに留まれてしまうセキュリティ上の問題があった。修正は適切。

- **[N-002]** 修正後のパターンはコードベース全体の他の action.server.ts と一貫している。

- **[N-003]** `requireAuth` は `handleUseCase` コールバックの外側で呼ばれており、`ResultAsync.fromPromise` に捕捉されるリスクはない。

- **[N-004]** `createCompositeAction` にも try-catch が存在しないことを確認済み。redirect Response はフレームワークに正しく伝播する。

- **[N-005]** `requireAuth` の実装自体は堅牢。セッションCookie不在、セッション未検出、期限切れ、ユーザー非アクティブのすべてのケースで `throw redirect("/login")` が実行される。

---

### Framework Integration（React Router v7 フレームワーク連携）

#### Blockers

なし

#### Warnings

なし

#### Notes

- **[N-006]** redirect の伝播経路が正しく確保されている。`defineHandler` は try-catch を含まず、`createCompositeAction` のハンドラー呼び出し箇所にも try-catch は一切ない。redirect Response はフレームワーク層で正しく処理される。

- **[N-007]** `handleUseCase` の `ResultAsync.fromPromise` が redirect を捕捉するリスクはない。4ファイルすべてで `requireAuth` は `handleUseCase` の外側で呼ばれている。

- **[N-008]** 既存の正しいパターン（`settings/action.server.ts`、`admin/directory/action.server.ts` 等）との一貫性が確保されている。

- **[N-009]** `let` から `const` への変更は型安全性の向上に寄与。TypeScript の型推論で自然に `AuthUser` 型が付き、再代入不可能になった。

- **[N-010]** `.issue/11/plan.md` との整合性は完全に取れている。

---

## Design Decisions

特になし
