# 実装計画 — Issue #22: バグ: seed.ts の customer_rank フィールドの options 形式がドメイン型と不一致

**Issue:** #22
**作成日:** 2026-04-13

---

## 目的

`seed.ts` の `customer_rank` DROP_DOWN フィールドの `options` フォーマットを、ドメイン型 `DropDownProperties.options: readonly SelectOption[]` に合わせて修正する。

## スコープ

### 含まれるもの
- `seed.ts` の `customer_rank` フィールド `properties.options` を `SelectOption[]` 形式に修正
- `seed.ts` の `customer_rank` フィールド `properties` 内の不要な `defaultValue: null` を削除

### 含まれないもの
- その他フィールドの修正（今回発見されたのは `customer_rank` のみ）
- `recordValidationService.ts` の変更（バグの原因は seed.ts 側）
- スキーマ定義や DB マイグレーションの変更

## 実装ステップ

### 1. seed.ts の customer_rank フィールド options を修正

- **対象ファイル:** `app/core/adapters/drizzleSqlite/seed.ts`
- **変更内容:**
  - `options: ["A", "B", "C", "D"]` を `options: [{ label: "A", index: 0 }, { label: "B", index: 1 }, { label: "C", index: 2 }, { label: "D", index: 3 }]` に変更
  - `properties` 内の `defaultValue: null` を削除（`DropDownProperties` 型にこのプロパティは存在しない）
- **理由:** `DropDownProperties.options` は `readonly SelectOption[]`（`{ label: string; index: number }[]`）を期待しており、文字列配列では `recordValidationService.ts` の `props.options.map((o) => o.label)` が `undefined` を返してバリデーションエラーが発生する

## リスクと注意点

- seed.ts はテスト・開発用シードデータのみを対象としており、本番データには影響しない
- 既存の seed データが DB に入っている場合は再シードが必要

## テスト方針

- `pnpm typecheck` で型エラーがないことを確認
- `pnpm lint` でリンターエラーがないことを確認
