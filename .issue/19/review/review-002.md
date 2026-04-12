# PR Review #002 — fix: add integer validation for lockoutDuration and expirationDays

**PR:** #23
**Date:** 2026-04-12
**Round:** 2回目

---

## Summary

- Blockers: 0
- Warnings: 0
- Notes: 9
- Verdict: **APPROVED**

---

### Domain（値オブジェクト・バリデーション）

#### Blockers

なし

#### Warnings

なし

#### Notes

- **[N-D001]** `lockoutDuration` と `expirationDays` の両バリデーション修正は計画書と完全一致。条件式 `(value <= 0 || !Number.isInteger(value))` で既存チェックを壊さず整数チェックを追加。
- **[N-D002]** `Number.isInteger()` により NaN・Infinity・-Infinity もすべて正しく拒否される。テストでもカバー済み。
- **[N-D003]** 前回レビュー (review-001) の Blocker 2件・Warning 4件中3件が適切に対応済み。
- **[N-D004]** `null` ガード (`!== null`) が `Number.isInteger` の前にあるため安全。
- **[N-D005]** バリデーション順序（範囲チェック → 整数チェック → 矛盾チェック）が維持されており、相互作用テストでも検証済み。

---

### Test（テスト設計・網羅性）

#### Blockers

なし

#### Warnings

なし

#### Notes

- **[N-T001]** 前回レビューの4件の指摘（B-T001, B-T002, W-T002, W-T003）はすべて適切に対応。
- **[N-T002]** `validParams` パターンにより `PasswordPolicy` テストの可読性が高い。
- **[N-T003]** 矛盾チェック相互作用テスト（`maxFailedAttempts: null, lockoutDuration: 3.7`）でバリデーション順序の回帰テストとして有効。
- **[N-T004]** 前回の W-T004（負の浮動小数点数テスト）は `<= 0` で拒否されるパスが既存テストでカバー済みのため見送り妥当。

---

## Design Decisions

特になし
