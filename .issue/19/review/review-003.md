# PR Review #003 — fix: add integer validation for lockoutDuration and expirationDays

**PR:** #23
**Date:** 2026-04-12
**Round:** 3回目

---

## Summary

- Blockers: 0
- Warnings: 0
- Notes: 5
- Verdict: **APPROVED** (2回連続クリーン達成)

---

### Domain（値オブジェクト・バリデーション）

#### Blockers

なし

#### Warnings

なし

#### Notes

- **[N-D001]** `!== null` ガードの内側に `!Number.isInteger()` をOR条件で追加しており、`null` のスキップ設計を壊していない。
- **[N-D002]** `NaN <= 0` がJSで `false` を返すが、`!Number.isInteger(NaN)` が `true` を返すためOR条件の右辺で正しく拒否。ロジックに穴なし。

---

### Test（テスト設計・網羅性）

#### Blockers

なし

#### Warnings

なし

#### Notes

- **[N-T001]** review-001 の全指摘（B-T001, B-T002, W-T002, W-T003）は対応済み。
- **[N-T002]** `LockoutPolicy` テスト: 正常系5件 + 異常系12件。`PasswordPolicy` テスト: 正常系3件 + 異常系6件。変更したバリデーション条件の全分岐をカバー。
- **[N-T003]** 全328テスト PASS 確認済み。

---

## Design Decisions

特になし
