# PR Review #002 — fix: correct field code mismatches in record creation form

**PR:** #14
**Date:** 2026-04-12
**Round:** 2回目

---

## Summary

- Blockers: 0
- Warnings: 0
- Notes: 6
- Verdict: **APPROVED**

---

### Interface Adapter

#### Blockers

なし — 前回の B-001 (一覧画面), B-002 (email type) はすべて修正済み

#### Warnings

なし — W-001 (branded type), W-002 (2回のtransaction) は既存コードの問題でこのPRスコープ外

#### Notes

- **[N-001]** 前回レビューの全 Blocker が正しく修正されている
- **[N-002]** action.server.ts の全8フィールドが seed.ts のフィールド定義と完全に一致
- **[N-003]** フォームスキーマのプロパティ名とDBフィールドコードの分離は適切な設計

---

### Data Consistency

#### Blockers

なし

#### Warnings

なし

#### Notes

- **[N-001]** フィールドコード・フィールドタイプの全件照合結果:

  | action.server.ts | seed.ts fieldCode | seed.ts fieldType | 一致 |
  |---|---|---|---|
  | `"company_name"` / `SINGLE_LINE_TEXT` | `company_name` | `SINGLE_LINE_TEXT` | OK |
  | `"department"` / `SINGLE_LINE_TEXT` | `department` | `SINGLE_LINE_TEXT` | OK |
  | `"contact_name"` / `SINGLE_LINE_TEXT` | `contact_name` | `SINGLE_LINE_TEXT` | OK |
  | `"postal_code"` / `SINGLE_LINE_TEXT` | `postal_code` | `SINGLE_LINE_TEXT` | OK |
  | `"tel"` / `SINGLE_LINE_TEXT` | `tel` | `SINGLE_LINE_TEXT` | OK |
  | `"address"` / `SINGLE_LINE_TEXT` | `address` | `SINGLE_LINE_TEXT` | OK |
  | `"customer_rank"` / `DROP_DOWN` | `customer_rank` | `DROP_DOWN` | OK |
  | `"email"` / `SINGLE_LINE_TEXT` | `email` | `SINGLE_LINE_TEXT` | OK |

- **[N-002]** loader.server.ts (一覧) の getText() 呼び出し4件すべてseed.tsと一致確認済み
- **[N-003]** routesディレクトリ配下の全 .server.ts ファイルで旧フィールドコードの残存なし

---

## Design Decisions

特になし
