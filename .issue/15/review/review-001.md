# PR Review #001 — fix: add fax and notes field definitions to seed data

**PR:** #21
**Date:** 2026-04-12
**Round:** 1回目

---

## Summary

- Blockers: 0
- Warnings: 1 (既存問題、このPRのスコープ外)
- Notes: 13
- Verdict: **APPROVED**

---

### Infrastructure

#### Blockers

なし

#### Warnings

- **[W-001]** customer_rank の `options` がドメイン型 `SelectOption[]` と不整合（既存問題）
  - 場所: `app/core/adapters/drizzleSqlite/seed.ts:368`
  - 理由: `DropDownProperties.options` は `readonly SelectOption[]`（`{ label: string; index: number }`）を期待するが、seed では `["A", "B", "C", "D"]` と文字列配列で定義されている。`RecordValidationService.validateValueFormat` は `props.options.map((o) => o.label)` で検証するため、文字列要素に `.label` を呼ぶと `undefined` が返り、DROP_DOWN フィールドに正しい値を入力してもバリデーションエラーになる可能性がある。**このPRの変更ではない。**
  - 提案: 別Issueで対応

#### Notes

- **[N-001]** fax フィールド定義の `properties` が `SingleLineTextProperties` 型と完全一致
- **[N-002]** notes フィールド定義の `properties` が `MultiLineTextProperties` 型と完全一致
- **[N-003]** フォームレイアウトの type がフィールド定義と一致
- **[N-004]** サンプルレコードの fieldValues が正しい FieldValue 型に準拠
- **[N-005]** フィールド配置順序がレイアウト・ビュー・レコード間で一貫
- **[N-006]** console.log のフィールド数が正しく更新 (8 → 10)
- **[N-007]** plan.md の全4項目が漏れなく実装

---

### 整合性・完全性

#### Blockers

なし

#### Warnings

なし

#### Notes

- **[N-001]** フィールドコードが action.server.ts と seed.ts で完全一致
- **[N-002]** フィールドタイプが action.server.ts、seed.ts、schemas.ts 間で整合
- **[N-003]** フォームレイアウト順序が index.tsx のUI表示順序と整合
- **[N-004]** 計画の全4ステップが完全実装
- **[N-005]** スコープ外の変更なし（seed.ts + 計画ファイルのみ）
- **[N-006]** サンプルデータが現実的で適切

---

## Design Decisions

特になし
