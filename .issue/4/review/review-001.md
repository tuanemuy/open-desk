# PR Review #001 — fix: correct field code mismatches in record creation form

**PR:** #14
**Date:** 2026-04-12
**Round:** 1回目

---

## Summary

- Blockers: 3
- Warnings: 3
- Notes: 4
- Verdict: **BLOCKED**

---

### Interface Adapter

#### Blockers

なし

#### Warnings

- **[W-001]** email フィールドの `type: "LINK"` が seed.ts の `fieldType: "SINGLE_LINE_TEXT"` と不一致
  - 場所: `app/routes/apps/app/records/new/action.server.ts:79`
  - 理由: バリデーションサービスが `appType !== valueType` で拒否するため、email入力時にランタイムエラーとなる
  - 提案: `type: "LINK"` を `type: "SINGLE_LINE_TEXT"` に修正

- **[W-002]** `fax` と `notes` のフィールドコードがDBに存在しない
  - 場所: `app/routes/apps/app/records/new/action.server.ts:60,84`
  - 理由: バリデーションで `Field code "fax" does not exist` エラーとなる
  - 提案: 別Issue起票（フィールド追加 or フォーム削除の設計判断が必要）

- **[W-003]** seed.ts の DROP_DOWN options が string[] だがドメイン型は `SelectOption[]`
  - 場所: seed.ts の customer_rank フィールド
  - 理由: `opt.label` が undefined になる可能性あり
  - 提案: 別Issue起票

#### Notes

- **[N-001]** 計画との整合性は完全。4箇所の修正が過不足なく実施されている
- **[N-002]** フォームスキーマのプロパティ名とDBフィールドコードを分離する設計判断は正しい

---

### Data Consistency

#### Blockers

- **[B-001]** レコード一覧画面の `getText("company")` と `getText("person")` がDB定義と不一致
  - 場所: `app/routes/apps/app/loader.server.ts:106,108`
  - 理由: 会社名と担当者名が常に空文字列として表示される
  - 提案: `getText("company_name")` と `getText("contact_name")` に修正
  - → **このPRで修正する**（同じ根本原因）

- **[B-002]** email フィールドの fieldType が DB 定義と不一致
  - 場所: `app/routes/apps/app/records/new/action.server.ts:79`
  - 理由: `validateFieldTypeConsistency()` が `SINGLE_LINE_TEXT !== LINK` で拒否
  - 提案: `type: "LINK"` → `type: "SINGLE_LINE_TEXT"` に修正
  - → **このPRで修正する**

- **[B-003]** `fax` と `notes` のフィールドコードがDBに存在しない
  - 場所: `app/routes/apps/app/records/new/action.server.ts:60,84`
  - 理由: バリデーションで拒否される
  - 提案: 別Issue起票（設計判断が必要）
  - → **別Issueで対応する**

#### Warnings

- **[W-001]** 計画書で「含まれないもの」とされた項目が実際には実行時エラーを引き起こす
  - 場所: `.issue/4/plan.md:21-23`
  - 理由: バリデーションサービスの存在が計画策定時に考慮されていなかった
  - 提案: B-002はこのPRで修正、B-003は別Issue

#### Notes

- **[N-001]** PRの変更自体（4箇所のフィールドコード修正）は正確
- **[N-002]** seed.ts 内部のデータ整合性は良好

---

## Design Decisions

- B-001(一覧画面)とB-002(emailの型)はIssue #4と同じ根本原因のため、このPRに含める
- B-003(fax/notes)はフィールド定義自体の欠如であり、設計判断が必要なため別Issue起票する
