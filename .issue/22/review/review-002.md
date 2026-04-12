# PR Review #002 — fix: seed.ts の customer_rank DROP_DOWN options 形式をドメイン型に合わせて修正

**PR:** #26
**Date:** 2026-04-13
**Round:** 2回目

---

## Summary

- Blockers: 0
- Warnings: 0
- Notes: 9
- Verdict: **APPROVED**

---

### Infrastructure / Adapter

#### Blockers

なし

#### Warnings

なし

前回指摘の W-001（型安全性）・W-004（fieldRows 型注釈）は Issue #27 として別途起票済み。前回指摘 W-002（`defaultValue` 削除の根拠）は plan.md に「`DropDownProperties` 型にこのプロパティは存在しない」と明記されており、`valueObject.ts:1409-1412` の `_DropDownProperties` 型定義を確認しても `defaultValue` プロパティは存在しないため、削除は正当。

#### Notes

- **[N-001]** 修正内容が計画（`plan.md`）と完全に一致している。
- **[N-002]** `_DropDownProperties` 型は `type`・`options` の2プロパティのみを持ち、`defaultValue` は存在しない。今回の削除はドメイン型定義との厳密な整合を取る正しい対処。
- **[N-003]** `index` の値が 0-based 連番で一貫して設定されており、バリデーションが正しく動作するようになった。
- **[N-004]** 変更は `seed.ts` の1箇所1フィールドに厳密に限定されており、スコープ管理が適切。

---

### データ整合性 / ドメイン型適合性

#### Blockers

なし

#### Warnings

なし

#### Notes

- **[N-005]** `options` の修正形式 `{ label: "A", index: 0 }` ... は `_SelectOption = Readonly<{ label: string; index: number }>` と完全に一致している。
- **[N-006]** `recordValidationService.ts:293` の `props.options.map((o) => o.label)` が修正後の `SelectOption[]` 形式を正しく消費できる。旧来の文字列配列では `o.label` が `undefined` になっていたバグが解消。
- **[N-007]** `defaultValue: null` の削除は正当。`defaultValue` は `schema.ts` で独立した DB 列として管理されており、`properties` 内に置くものではない。
- **[N-008]** 前回レビューの全 Warnings（W-001〜W-004）は構造的 pre-existing 問題またはスコープ外改善として整理済み。今回の変更で新たに悪化した点はない。
- **[N-009]** seed.ts 内で DROP_DOWN 型を持つフィールドは `customer_rank` の1箇所のみ。同種の不一致を持つ他フィールドは存在しない。

---

## Design Decisions

特になし

---

## 完了判定

2回連続 Blocker 0件 かつ Warning 0件 → **レビュー完了**
