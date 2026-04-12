# PR Review #001 — fix: add integer validation checks to numeric policy fields

**PR:** #28
**Date:** 2026-04-13
**Round:** 1回目

---

## Summary

- Blockers: 0
- Warnings: 4
- Notes: 7
- Verdict: **APPROVED** (Warnings対応後)

---

### Domain

#### Blockers

なし

#### Warnings

- **[W-D001]** `PasswordPolicy.minLength` / `PasswordPolicy.historyCount` / `LockoutPolicy.maxFailedAttempts` に対して `Infinity` のテストが存在しない
  - 場所: `app/core/domain/identity/valueObject.test.ts`
  - 理由: `SessionPolicy` には `Infinity` テストが追加されているが、他3フィールドには NaN 止まり。テストカバレッジに非対称性がある
  - 提案: 3フィールドにも `should throw BusinessRuleError when X is Infinity` テストを追加する

- **[W-D002]** `minLength` / `historyCount` の整数チェック条件順序が既存パターンと非対称
  - 場所: `app/core/domain/identity/valueObject.ts:553–555`, `563–565`
  - 理由: `lockoutDuration` は整数チェックを同一条件式に凝縮しているが、今回の追加は「範囲 OR 非整数」という後付け構造。NaN が範囲チェックで false になることに依存しており可読性が低い
  - 提案: 条件の順序を `!Number.isInteger(x) || x < MIN || x > MAX` に揃える

### Test

#### Blockers

なし

#### Warnings

- **[W-T001]** `PasswordPolicy.create` の `minLength` と `historyCount` に境界値の正常系テストが追加されていない
  - 場所: `app/core/domain/identity/valueObject.test.ts`
  - 理由: plan.md に「境界値の整数値は通過することを確認する」と明記されているが、`minLength=3/15`・`historyCount=0/15` の境界値テストがない。`historyCount=0` は「制限なし」という仕様的に重要な境界値
  - 提案: minLength(3, 15)・historyCount(0, 15) の境界値通過テストを追加

- **[W-T002]** `LockoutPolicy.maxFailedAttempts`・`PasswordPolicy.minLength`・`PasswordPolicy.historyCount` に `Infinity` テストが欠落
  - 場所: `app/core/domain/identity/valueObject.test.ts`
  - 理由: `SessionPolicy` と `lockoutDuration` (既存) には `Infinity` テストがあり、他フィールドと非対称
  - 提案: 3フィールドにも `Infinity` テストを追加

#### Notes

- **[N-001]** 計画との整合性は完全。4フィールドすべてに整数チェックが追加されスコープ外の変更なし
- **[N-002]** エラーメッセージに "an integer" を追記した変更は開発者フレンドリーで好ましい
- **[N-003]** `SessionPolicy` の新規テストブロックは正常系・境界値・範囲外・非整数をすべてカバーした手本構成
- **[N-004]** `maxFailedAttempts` の NaN テストで `lockoutDuration: null` を使っている点は、他バリデーションを回避して対象を一点に絞っており適切
- **[N-005]** `validParams` スプレッドパターンは既存慣習と一致しており保守性が高い

---

## Design Decisions

特になし
