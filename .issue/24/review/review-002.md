# PR Review #002 — fix: add integer validation checks to numeric policy fields

**PR:** #28
**Date:** 2026-04-13
**Round:** 2回目

---

## Summary

- Blockers: 0
- Warnings: 3（うち2件を修正、1件を別Issue起票）
- Notes: 10
- Verdict: **APPROVED**

---

### Domain

#### Blockers

なし

#### Warnings

- **[W-D001]** `expirationDays` / `lockoutDuration` の整数チェック条件順序が今回修正した他フィールドと非対称
  - 場所: `app/core/domain/identity/valueObject.ts:573–574`, `769`
  - 理由: Issue #19 で導入されたパターンが今回と異なる順序のまま残っている
  - 対応: 別 Issue #29 で追跡

#### Notes

- **[N-001]** 前回レビュー全4件（W-D001・W-D002・W-T001・W-T002）が解消済み
- **[N-002]** 条件順序が `!Number.isInteger(x) || x < MIN || x > MAX` に統一され、NaN の暗黙的な挙動依存がなくなった

### Test

#### Blockers

なし

#### Warnings

- **[W-T001]** `maxFailedAttempts` の Infinity テストで `lockoutDuration: null` を使用しており暗黙の前提がある
  - 場所: `app/core/domain/identity/valueObject.test.ts`
  - 対応: 動作的には正しく NaN テストと同パターンなので現状維持。意図的な選択として許容

- **[W-T002]** `PasswordPolicy.minLength`・`historyCount` に範囲外異常系テストが欠落
  - 場所: `app/core/domain/identity/valueObject.test.ts`
  - 対応: このラウンドで修正済み（minLength=2/16, historyCount=-1/16 を追加）

#### Notes

- **[N-001]** 前回 W-T001（境界値）・W-T002（Infinity）が全解消
- **[N-002]** `SessionPolicy` の describe ブロックが正常系・境界値・範囲外・非整数を網羅した手本として機能
- **[N-003]** 全376テスト → 380テスト PASS（4件追加）

---

## Design Decisions

特になし
