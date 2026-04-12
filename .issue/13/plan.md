# 実装計画 — Issue #13: LockoutPolicy.create() が矛盾した設定値を許容する

**Issue:** #13
**作成日:** 2026-04-12

---

## 目的

`LockoutPolicy.create()` が `maxFailedAttempts: null`（ロックアウト無効）かつ `lockoutDuration: 非null`（ロック期間あり）のような矛盾した組み合わせを受け入れてしまうバグを修正する。

## スコープ

### 含まれるもの
- `LockoutPolicy.create()` に矛盾検出バリデーションを追加
- 対応するエラーコードの追加
- ユニットテストの追加

### 含まれないもの
- `LockoutPolicy` の他のロジック変更
- 他の値オブジェクトのバリデーション見直し

## 実装ステップ

### 1. エラーコードの追加

- **対象ファイル:** `app/core/domain/identity/errorCode.ts`
- **変更内容:** `InconsistentLockoutPolicy` エラーコード（値: `"IDENTITY_INCONSISTENT_LOCKOUT_POLICY"`）を追加する
- **理由:** 矛盾した設定値に対する専用エラーコードが必要

### 2. `LockoutPolicy.create()` にバリデーション追加

- **対象ファイル:** `app/core/domain/identity/valueObject.ts`
- **変更内容:** `LockoutPolicy.create()` 内の既存バリデーションの後に、以下の矛盾チェックを追加する:
  - `maxFailedAttempts` が `null` かつ `lockoutDuration` が非 `null` → `BusinessRuleError` をスロー
- **理由:** ロックアウト無効なのにロック期間が指定されている状態は矛盾しており、ビジネスルール違反

### 3. ユニットテストの追加

- **対象ファイル:** `app/core/domain/identity/valueObject.test.ts`（新規作成）
- **変更内容:** `LockoutPolicy.create()` のバリデーションに関するテストケースを作成
  - 正常系: `maxFailedAttempts: null, lockoutDuration: null` → OK
  - 正常系: `maxFailedAttempts: 5, lockoutDuration: 30` → OK
  - 正常系: `maxFailedAttempts: 5, lockoutDuration: null` → OK（永久ロック）
  - 異常系: `maxFailedAttempts: null, lockoutDuration: 30` → `BusinessRuleError` スロー
- **理由:** バグ修正のリグレッション防止

## リスクと注意点

- 既存のデータベースに矛盾した設定値が保存されている可能性があるが、Issue #3 のレビューで発見された未対応項目であり、実運用データに該当ケースが存在する可能性は低い
- `lockoutDuration: null` は「永久ロック」を意味するため、`maxFailedAttempts: 非null, lockoutDuration: null` は有効な組み合わせ

## テスト方針

- `pnpm test` でユニットテストを実行し、新規テストがPASSすることを確認
- `pnpm typecheck` で型エラーがないことを確認
- `pnpm lint:fix` と `pnpm format` でコード品質を確認
