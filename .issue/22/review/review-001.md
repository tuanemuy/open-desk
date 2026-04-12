# PR Review #001 — fix: seed.ts の customer_rank DROP_DOWN options 形式をドメイン型に合わせて修正

**PR:** #26
**Date:** 2026-04-13
**Round:** 1回目

---

## Summary

- Blockers: 0
- Warnings: 4
- Notes: 7
- Verdict: **APPROVED**

---

### Infrastructure / Adapter

#### Blockers

なし

#### Warnings

- **[W-001]** `seed.ts` の `properties` は型なしの plain object として DB に渡されており、TypeScript の型チェックが実際には効いていない
  - 場所: `app/core/adapters/drizzleSqlite/seed.ts:366-374`
  - 理由: `schema.ts` の `fields.properties` は `text("properties", { mode: "json" })` として定義されており型は `unknown` に近い。`fieldRepository.ts` でも `data.properties as unknown as FieldProperties` とキャストされており、スキーマ定義からドメイン型への型安全な変換が欠如している構造的問題。今回の修正でランタイムの正確性は改善されたが、型レベルの保護がない。
  - 提案: `seed.ts` 内で明示的に `DropDownProperties` 型を付与して渡すことで、将来の型変更時に検知できるようにする。スコープ外のため別 Issue で対応。

- **[W-002]** `defaultValue: null` を削除した根拠のトレーサビリティが diff からは不明
  - 場所: `app/core/adapters/drizzleSqlite/seed.ts`（削除された行）
  - 理由: `schema.ts` に `fields.defaultValue` 独立列が存在するため、「列 `defaultValue` に入れるべきものを `properties` に誤記した」のか「単に不要な誤記」なのかが追跡しにくい。
  - 提案: plan.md の記述（「DropDownProperties 型にこのプロパティは存在しない」）で十分説明されており、`defaultValue` 列は今回の seed では `null` のため問題なし。既に plan.md に記載済みなので対応不要。

#### Notes

- **[N-001]** 変更箇所は1ファイル・1フィールドに正確に限定されており、スコープの管理が適切。
- **[N-002]** `recordValidationService.ts:293` の `props.options.map((o) => o.label)` と修正後の options 形式が完全に一致している。
- **[N-003]** `index` の値が 0-based 連番 (0, 1, 2, 3) で適切に設定されている。

---

### データ整合性 / ドメイン型適合性

#### Blockers

なし

#### Warnings

- **[W-003]** `index` の意味と一意性・連続性の保証がない（型設計の構造的問題）
  - 場所: `app/core/adapters/drizzleSqlite/seed.ts:369-372`
  - 理由: `SelectOption` 型には `index` の一意性・連続性制約がなく、将来の options 追加時に誤った index が入り込む余地がある。今回のPRで新たに生じた問題ではなく、型定義側の設計上の制約。
  - 提案: スコープ外のため別 Issue で対応。`SelectOption` バリデーションの強化を検討。

- **[W-004]** `fieldRows` に型注釈がなく、`properties` の型整合性がコンパイラに保証されていない
  - 場所: `app/core/adapters/drizzleSqlite/seed.ts:237`（`fieldRows` 定義行）
  - 理由: `fieldRows` は型注釈なしの配列リテラルであり、`properties` フィールドへの代入が Drizzle の `json` カラムに対して型チェックされない。今回の修正前の誤ったフォーマットも型エラーとして検出できていなかった。同様の問題が再発するリスクが構造的に残っている。
  - 提案: `fieldRows` に `typeof fields.$inferInsert[]` の型注釈を付けるか、`properties` の代入に `satisfies FieldProperties` を使うことを別 Issue で検討。

#### Notes

- **[N-004]** 修正内容は `.issue/22/plan.md` と完全に一致している。
- **[N-005]** seed.ts 内に DROP_DOWN フィールドは `customer_rank` の1箇所のみで、同種バグを持つ他フィールドは存在しない。
- **[N-006]** `recordValidationService.ts` 側は変更不要。バグの根本原因は seed.ts の誤ったデータ形式であり、サービス側は正しく動作している。
- **[N-007]** 修正後、`recordValidationService.ts:294` の `validOptions.includes(fieldValue.value)` が "A"〜"D" の label を正しく検証できるようになる。

---

## Design Decisions

特になし — Warnings はすべて構造的な pre-existing 問題またはスコープ外の改善提案。
