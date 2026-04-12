# PR Review #001 — fix: add validation for inconsistent LockoutPolicy settings

**PR:** #18
**Date:** 2026-04-12
**Round:** 1回目

---

## Summary

- Blockers: 1
- Warnings: 5
- Notes: 8
- Verdict: **BLOCKED**

---

### Domain

#### Blockers

なし

#### Warnings

- **[W-D001]** テスト内の try-catch パターンがテスト失敗を隠蔽する可能性がある
  - 場所: `app/core/domain/identity/valueObject.test.ts:45-55`
  - 理由: try-catch 内の expect が実行されない場合にテストがサイレントにパスする。Test B-001 と重複。
  - 提案: `expect.objectContaining` パターンに統一

- **[W-D002]** エラーメッセージがプロパティ名（コード上の変数名）を直接使用しており、既存メッセージのスタイルと不一致
  - 場所: `app/core/domain/identity/valueObject.ts:770`
  - 理由: 既存メッセージは "Lockout duration must be..." のようにビジネス用語ベース。新メッセージ "lockoutDuration must be null..." はコード変数名ベース。
  - 提案: `"Lockout duration must not be set when lockout is disabled (maxFailedAttempts is null)"` のように修正

#### Notes

- **[N-D001]** 計画との整合性は完全に取れている
- **[N-D002]** エラーコード `InconsistentLockoutPolicy` の命名は適切（フィールド間の矛盾を表す）
- **[N-D003]** `maxFailedAttempts: 非null, lockoutDuration: null`（永久ロック）を有効とする判断は妥当
- **[N-D004]** バリデーション順序が適切（個別チェック→矛盾チェック）
- **[N-D005]** 4パターン全て網羅、見落としなし

---

### Test

#### Blockers

- **[B-T001]** 異常系テストでエラーコード検証が try-catch パターンに依存しており、例外未発生時にサイレントパスする
  - 場所: `app/core/domain/identity/valueObject.test.ts:45-55`
  - 理由: catch に入らなかった場合、エラーコードの検証が実行されずテスト成功扱い。同じ入力で2回呼び出すのも冗長。
  - 提案: `expect(() => ...).toThrow(expect.objectContaining({ code: ... }))` に統合

#### Warnings

- **[W-T001]** 既存バリデーション（maxFailedAttempts範囲外、lockoutDuration非正値）のテストが不足
  - 場所: ファイル全体
  - 提案: maxFailedAttempts: 2（MIN未満）、11（MAX超過）、lockoutDuration: 0、-1 のケースを追加

- **[W-T002]** 矛盾チェックと既存バリデーションの相互作用テストが不足
  - 場所: ファイル全体
  - 提案: maxFailedAttempts: null, lockoutDuration: -5 のケースを追加（InvalidLockoutDuration が先にスロー）

- **[W-T003]** 境界値テストが不足
  - 場所: ファイル全体
  - 提案: maxFailedAttempts: 3（MIN）, 10（MAX）, lockoutDuration: 1（最小正値）のケースを追加

- **[W-T004]** 異常系テストで lockoutDuration の値バリエーションが1つのみ（低優先度）
  - 場所: `app/core/domain/identity/valueObject.test.ts:37-55`
  - 提案: lockoutDuration: 1 でも同様にエラーになるケースを追加

#### Notes

- **[N-T001]** 計画の4テストケースはすべて実装済み
- **[N-T002]** テストスタイルは既存と一貫
- **[N-T003]** フレイキーリスクなし（同期関数、外部依存なし）

---

## Design Decisions

特になし
