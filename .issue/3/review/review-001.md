# PR Review #001 — fix: implement account lockout functionality

**PR:** #12
**Date:** 2026-04-12
**Round:** 1回目

---

## Summary

- Blockers: 0
- Warnings: 7 (4 unique after dedup)
- Notes: 16
- Verdict: **APPROVED** (no blockers, warnings to fix)

---

## Domain

### Blockers
なし

### Warnings
- **[W-D001]** `new Date("9999-12-31")` がマジックリテラル
  - 場所: `app/core/domain/identity/services/authenticationService.ts:143`
  - 提案: `LockoutPolicy` 値オブジェクトに `PERMANENT_LOCK_DATE` 定数を追加

- **[W-D002]** `SystemSetting.getTypedValue()` が2回呼ばれている
  - 場所: `app/core/application/identity/login.ts:57-64`
  - 提案: 結果をローカル変数に格納

- **[W-D003]** `LockoutPolicy.create()` が矛盾した状態を許容（maxFailedAttempts: null, lockoutDuration: 30等）
  - → 既存コードの問題のためスコープ外

- **[W-D004]** `AccountLockedError.unlockAt` が `Date | null` だが実装上 null にならない
  - → spec との整合性を優先、現状維持

### Notes
- [N-D001] ロックアウトチェックを lockoutPolicy に関係なく常に実行する設計は適切
- [N-D002] DomainResult パターンを完全に遵守
- [N-D003] clearFailedLogin の条件ガードが効率的

---

## Infrastructure

### Blockers
なし

### Warnings
- **[W-I001]** `updatedAt: new Date()` と `$onUpdate` の重複 → 既存パターンに従っており変更不要
- **[W-I002]** `lockedUntil ?? null` の `?? null` が冗長 → 防御的コーディングとして許容

### Notes
- [N-I001] エラーハンドリングパターン完全遵守
- [N-I002] Drizzle ORM の使い方が正確
- [N-I003] SQLite タイムスタンプ変換が正しい
- [N-I004] save メソッドがロックアウト状態を含めない責務分離が適切

---

## Use Case & Test

### Blockers
なし

### Warnings
- **[W-T001]** ロック期限切れ後に再度パスワードを間違えた場合の再ロックテストがない
  - 場所: `app/core/application/identity/login.test.ts`
  - 提案: テストケース追加

- **[W-T002]** 永久ロック（lockoutDuration: null）のテストケースがない
  - 場所: `app/core/application/identity/login.test.ts`
  - 提案: テストケース追加

- **[W-T003]** AccountLocked エラー時に InvalidCredentials コードを使用 → 既存設計判断、セキュリティ上の意図をコメントで明記

### Notes
- [N-T001] テストヘルパーの設計が良好
- [N-T002] トランザクションスコープが適切
- [N-T003] 6テストケースが計画と正確に対応
