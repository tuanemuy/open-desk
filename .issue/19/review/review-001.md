# PR Review #001 — fix: add integer validation for lockoutDuration and expirationDays

**PR:** #23
**Date:** 2026-04-12
**Round:** 1回目

---

## Summary

- Blockers: 2
- Warnings: 7
- Notes: 7
- Verdict: **BLOCKED**

---

### Domain（値オブジェクト・バリデーション）

#### Blockers

なし

#### Warnings

- **[W-D001]** `maxFailedAttempts` に整数チェックがないが、計画で意図的に除外された理由が弱い
  - 場所: `app/core/domain/identity/valueObject.ts:754-763`
  - 理由: `maxFailedAttempts: 5.5` のような浮動小数点数が通過する。Issue #19 のスコープ外として別 Issue で対応するのは妥当。
  - 提案: 別 Issue を起票して追跡する → スコープ外のため Phase 4 で対応

- **[W-D002]** `PasswordPolicy` の `minLength` と `historyCount` にも整数チェックがない
  - 場所: `app/core/domain/identity/valueObject.ts:552-569`
  - 理由: 同種の問題。Issue #19 のスコープ外。
  - 提案: 別 Issue で追跡 → Phase 4 で対応

- **[W-D003]** `SessionPolicy.timeoutMinutes` にも整数チェックがない
  - 場所: `app/core/domain/identity/valueObject.ts:804-815`
  - 理由: 同種の問題。Issue #19 のスコープ外。
  - 提案: 別 Issue で追跡 → Phase 4 で対応

#### Notes

- **[N-D001]** `lockoutDuration` と `expirationDays` のバリデーション修正は計画と完全一致。`Number.isInteger()` で NaN/Infinity も拒否される副次効果あり。
- **[N-D002]** 矛盾チェックとの相互作用テストは防御的で良いテスト設計。
- **[N-D003]** `<= 0 || !Number.isInteger(...)` の条件順序は短絡評価の観点で効率的。

---

### Test（テスト設計・網羅性）

#### Blockers

- **[B-T001]** `PasswordPolicy.create` の `expirationDays: null` 正常系テストが欠落
  - 場所: `app/core/domain/identity/valueObject.test.ts` (PasswordPolicy.create describe)
  - 理由: `Number.isInteger(null)` は `false` を返すため、`null` ガード条件の正常動作は回帰テストとして検証すべき
  - 提案: `expirationDays: null` の正常系テストを追加

- **[B-T002]** `PasswordPolicy.create` の既存バリデーション回帰テストが欠落
  - 場所: `app/core/domain/identity/valueObject.test.ts` (PasswordPolicy.create describe)
  - 理由: `expirationDays: 0` と `expirationDays: -1` のテストがない。OR条件に書き換えたが左辺の回帰テストなし
  - 提案: `expirationDays: 0` と `expirationDays: -1` のテストを追加

#### Warnings

- **[W-T001]** `lockoutDuration: 1.0` のテストが不要（JSでは `1 === 1.0`）
  - 場所: N/A
  - 理由: 実質的リスク低。スキップしてOK。

- **[W-T002]** `PasswordPolicy.create` の正常系テストが薄い
  - 場所: `app/core/domain/identity/valueObject.test.ts:228-248`
  - 理由: 最小正整数境界 (`expirationDays: 1`) のテストがない
  - 提案: `expirationDays: 1` の正常系テストを追加

- **[W-T003]** `NaN` や `Infinity` のテストケースが欠落
  - 場所: `app/core/domain/identity/valueObject.test.ts`
  - 理由: 計画書で副次的メリットとして言及した挙動にテストがない
  - 提案: `lockoutDuration: NaN` と `expirationDays: Infinity` のテストを追加

- **[W-T004]** 負の浮動小数点数のテストケースが欠落
  - 場所: `app/core/domain/identity/valueObject.test.ts`
  - 理由: `-3.7` は `<= 0` で拒否されるが条件分岐の組合せテストとして抜けている
  - 提案: 必須ではないが追加推奨

#### Notes

- **[N-T001]** テストスタイルと命名規則は既存テストと完全一貫。
- **[N-T002]** `validParams` パターンで可読性を保っている。
- **[N-T003]** 矛盾チェックとの相互作用テストは良い追加。
- **[N-T004]** 計画書との整合性は概ね取れている。

---

## Design Decisions

特になし
