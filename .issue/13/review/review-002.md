# PR Review #002 — fix: add validation for inconsistent LockoutPolicy settings

**PR:** #18
**Date:** 2026-04-12
**Round:** 2回目

---

## Summary

- Blockers: 0
- Warnings: 3
- Notes: 13
- Verdict: **APPROVED** (Blocker 0件、Warningは軽微で対応可能)

---

### Domain

#### Blockers

なし

#### Warnings

- **[W-D001]** lockoutDuration のエラーメッセージに "must be a positive integer" とあるが `Number.isInteger` チェックが未実装（既存問題）
  - 場所: `app/core/domain/identity/valueObject.ts:761-765`
  - 理由: 既存の実装不備。今回のPRスコープ外。
  - 提案: 別Issueとして起票

#### Notes

- **[N-D001]** 計画との整合性は完全
- **[N-D002]** バリデーション順序が正しい
- **[N-D003]** エラーコード命名が適切
- **[N-D004]** エラーメッセージはRound 1修正後、既存スタイルと一貫
- **[N-D005]** 永久ロックの判断は妥当
- **[N-D006]** 型定義と実行時バリデーションの組み合わせは既存パターンと一貫

---

### Test

#### Blockers

なし

#### Warnings

- **[W-T001]** `BusinessRuleError` が未使用インポート
  - 場所: `app/core/domain/identity/valueObject.test.ts:2`
  - 提案: 削除するか、型検証に利用する

- **[W-T002]** 異常系テストでスローされるエラーの型を検証していない（低優先度）
  - 場所: 全異常系テスト
  - 提案: `expect.objectContaining` に `name: "BusinessRuleError"` を追加

#### Notes

- **[N-T001]** Round 1 の指摘はすべて適切に修正済み
- **[N-T002]** 12テストケースで十分なカバレッジ
- **[N-T003]** フレイキーリスクなし
- **[N-T004]** ドメイン層初のユニットテストとしてリファレンスになる

---

## Design Decisions

特になし
