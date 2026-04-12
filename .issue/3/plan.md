# 実装計画 — Issue #3: バグ: アカウントロックアウト機能が未実装

**Issue:** #3
**作成日:** 2026-04-12

---

## 目的

`authenticateByPassword` ドメインサービスにアカウントロックアウト機能を実装する。ログイン失敗時の `failedLoginAttempts` インクリメント、閾値超過時の `lockedUntil` 設定、ロックアウト状態でのログイン拒否、認証成功時のカウンターリセットを行う。

## スコープ

### 含まれるもの
- `UserRepository` ポートにロックアウト関連メソッドを追加
- Drizzle SQLite アダプターにロックアウト関連メソッドを実装
- `authenticateByPassword` にロックアウトチェック・失敗カウント・成功時リセットのロジックを追加
- `login` アプリケーションサービスにロックアウトポリシーの取得・受け渡しを追加
- ロックアウト関連のテスト追加

### 含まれないもの
- DBマイグレーション（`failedLoginAttempts` と `lockedUntil` カラムは既にスキーマに存在）
- フロントエンド変更（`login.ts` の `AccountLocked` エラーハンドリングは既に実装済み）
- 管理者によるロック解除機能
- タイミング攻撃対策
- `failedLoginMessage` の多言語カスタマイズ（system-settings に型定義は存在するが本Issueではスコープ外）
- `changePassword` でのロックアウトチェック（パスワード変更は別の認証フロー）

## 実装ステップ

### 1. UserRepository ポートにロックアウト関連メソッドを追加

- **対象ファイル:** `app/core/domain/identity/ports/userRepository.ts`
- **変更内容:**
  - `findCredentialsByLoginName` の返り値に `failedLoginAttempts: number` と `lockedUntil: Date | null` を追加
  - `recordFailedLogin(userId: UserIdType, failedAttempts: number, lockedUntil: Date | null): Promise<void>` メソッドを追加（失敗カウントとロック状態を一括更新）
  - `clearFailedLogin(userId: UserIdType): Promise<void>` メソッドを追加（成功時に `failedLoginAttempts = 0`, `lockedUntil = null` にリセット）
- **理由:** ドメインサービスがロックアウト判定と状態更新を行うために必要。`recordFailedLogin` で一括更新することでアトミックな状態遷移を保証する

### 2. Drizzle SQLite アダプターにロックアウト関連メソッドを実装

- **対象ファイル:** `app/core/adapters/drizzleSqlite/repositories/userRepository.ts`
- **変更内容:**
  - `findCredentialsByLoginName` の SELECT句に `failedLoginAttempts`, `lockedUntil` を追加し返り値に含める
  - `recordFailedLogin` を実装（`failedLoginAttempts` と `lockedUntil` を UPDATE）
  - `clearFailedLogin` を実装（`failedLoginAttempts = 0`, `lockedUntil = null` に UPDATE）
- **理由:** ポートインターフェースの具象実装。スキーマには既にカラムが存在するためDBマイグレーション不要

### 3. `authenticateByPassword` にロックアウトロジックを追加

- **対象ファイル:** `app/core/domain/identity/services/authenticationService.ts`
- **変更内容:**
  - `params` に `lockoutPolicy: LockoutPolicy`（identity ドメインの `LockoutPolicy` 値オブジェクト: `{ maxFailedAttempts: number | null; lockoutDuration: number | null }`）を追加
  - パスワード検証の**前**にロックアウトチェックを追加（**`lockoutPolicy` の値に関係なく常に実行**）:
    - `lockedUntil` が現在時刻より未来 → `AccountLocked` エラーを返す（`unlockAt` には `lockedUntil` の値をセット）
    - `lockedUntil` が過去（期限切れ）→ 認証を続行
  - パスワード検証**失敗**時:
    - `lockoutPolicy.maxFailedAttempts` が `null` でない場合のみカウント処理を実行
    - `failedLoginAttempts + 1` を計算
    - 閾値到達時: `lockedUntil` を算出し `recordFailedLogin` を呼ぶ
      - `lockoutDuration` が `null`（永久ロック）→ `new Date("9999-12-31")` を設定
      - `lockoutDuration` が非null → `now + lockoutDuration分` を設定
    - 閾値未到達時: `recordFailedLogin(userId, newCount, null)` を呼ぶ
    - `InvalidCredentials` エラーを返す
  - パスワード検証**成功**時:
    - `failedLoginAttempts > 0` または `lockedUntil !== null`（期限切れロック）の場合、`clearFailedLogin` を呼んでリセット
  - **注意**: `recordFailedLogin` / `clearFailedLogin` はドメインサービス内で `deps.userRepository` を通じて実行される副作用。これは既存の `sessionRepository.save` と同様のパターン。JSDoc にこの副作用を明記する
- **理由:** Issueの根本原因。認証フロー内でロックアウト判定と失敗カウントの更新が完全に欠落している

### 4. `login` アプリケーションサービスにロックアウトポリシーの取得と受け渡しを追加

- **対象ファイル:** `app/core/application/identity/login.ts`
- **変更内容:**
  - `authenticateByPassword` と**同一トランザクション内**で `ctx.systemSettingsRepository.findByKey("lockout_policy")` を呼び出してロックアウトポリシーを取得
  - null チェックを行い、設定が存在する場合は `SystemSetting.getTypedValue(setting, "lockout_policy")` で型安全に値を取り出す
  - system-settings の `lockoutDurationMinutes` を identity ドメインの `lockoutDuration` にマッピングして `LockoutPolicy.create()` で値オブジェクトを生成
  - `lockout_policy` 設定が見つからない場合は `LockoutPolicy.default()`（`{ maxFailedAttempts: null, lockoutDuration: null }` = ロックアウト無効）を使用
  - 擬似コード:
    ```
    const lockoutSetting = await ctx.systemSettingsRepository.findByKey("lockout_policy");
    const lockoutPolicy = lockoutSetting
      ? LockoutPolicy.create({
          maxFailedAttempts: SystemSetting.getTypedValue(lockoutSetting, "lockout_policy").maxFailedAttempts,
          lockoutDuration: SystemSetting.getTypedValue(lockoutSetting, "lockout_policy").lockoutDurationMinutes,
        })
      : LockoutPolicy.default();
    ```
- **理由:** ドメインサービスは純粋なロジックとしてポリシー値を受け取る設計にし、システム設定の取得はアプリケーション層の責務とする。既存の `sessionPolicy` の受け渡しパターンと一貫。system-settings と identity ドメイン間のフィールド名の差異（`lockoutDurationMinutes` vs `lockoutDuration`）はアプリケーション層でマッピングする

### 5. テストを追加

- **対象ファイル:** `app/core/application/identity/login.test.ts`
- **変更内容:**
  - `lockout_policy` のシードデータ挿入ヘルパーを追加
  - `createActiveUser` ヘルパーを拡張: `failedLoginAttempts` オーバーライドと、`lockedUntil` を実際に DB INSERT に含めるよう修正
  - テストケース追加:
    1. ログイン失敗で `failedLoginAttempts` がインクリメントされることを検証（DB直接参照）
    2. 閾値到達（例: 5回）で `lockedUntil` が設定されることを検証（DB直接参照）
    3. ロックアウト中のログイン試行で `UnauthenticatedError` がスローされることを検証
    4. ロック期限切れ後に正しいパスワードでログインが成功することを検証
    5. ログイン成功時に `failedLoginAttempts` がリセットされることを検証（DB直接参照）
    6. `lockout_policy` が未設定（ロックアウト無効）の場合、何度失敗してもロックされないことを検証
- **理由:** Issue TC-008 に対応し、リグレッション防止

## 設計判断

- **`lockoutPolicy` の型**: identity ドメインの既存 `LockoutPolicy` 値オブジェクトを使用。インライン型は定義しない
- **ロックアウトポリシーの取得場所**: アプリケーション層で取得して `params` として渡す。既存の `sessionPolicy` パターンと一貫。ドメインサービスの純粋性を維持 → 詳細は adr.md ADR-001
- **ロックアウトチェックのタイミング**: パスワード検証の前、かつ `lockoutPolicy` の値に**関係なく常に実行**。ロック中の不要なハッシュ比較を回避し、管理者がDBで直接ロックした場合にも正しく拒否される → 詳細は adr.md ADR-002
- **`lockoutDuration: null` の扱い**: 永久ロック（遠い未来の日付 9999-12-31 を設定）。判定ロジックを `lockedUntil > now` に統一しシンプルさを保つ → 詳細は adr.md ADR-003

## リスクと注意点

- **既存テストへの影響**: `findCredentialsByLoginName` の返り値型が拡張されるため、`pnpm typecheck` で影響範囲を確認する。`changePassword.ts` 等では追加フィールドは参照されないため互換性は保たれる
- **`lockout_policy` 未登録環境**: 設定が存在しない場合はロックアウト無効として安全に動作する
- **並行ログイン試行**: SQLiteのトランザクション内で処理されるため整合性は保たれる
- **`authenticateByPassword` のシグネチャ変更**: 呼び出し元は `login.ts` のみ（調査済み）

## テスト方針

- `TEST_DOMAIN=identity pnpm test:domain` でidentityドメインのテストを実行
- `pnpm typecheck` で型の整合性を確認
- `pnpm lint:fix && pnpm format` でコードスタイルを確認
- `pnpm test` で全テストのリグレッションを確認

## 参考: エージェント比較

| 観点 | エージェント1 (アーキテクチャ) | エージェント2 (保守性) | エージェント3 (シンプルさ) |
|------|-------------------------------|------------------------|---------------------------|
| ベース採用 | ○ | × | ○ |
| 取り込んだ点 | アトミック更新の設計根拠 | テストケース設計の詳細さ、lockoutDurationMinutes null時の考慮 | 全体構成のシンプルさ |

## レビュー反映

### 修正した点
- P-001: `authenticateByPassword` の `lockoutPolicy` パラメータを identity ドメインの既存 `LockoutPolicy` 値オブジェクトに変更。アプリケーション層で system-settings の `lockoutDurationMinutes` を identity の `lockoutDuration` にマッピングする設計を明記
- P-002 (reviewer 3): `findByKey` が `null` を返す場合の制御フローを擬似コードで明記。`LockoutPolicy.default()` をフォールバックとして使用
- P-003 (reviewer 3): ロックアウトチェック（`lockedUntil > now`）は `lockoutPolicy` の値に関係なく常に実行する設計に修正。カウント処理のみ `maxFailedAttempts !== null` で条件分岐
- S-003: `createActiveUser` ヘルパーの拡張（`failedLoginAttempts` オーバーライド追加、`lockedUntil` を実際に INSERT に含める）をテスト計画に追加
- `AccountLockedError.unlockAt` に `lockedUntil` の値をセットすることを明記
- ドメインサービス内の副作用（`recordFailedLogin` / `clearFailedLogin`）を JSDoc に明記する方針を追加

### 取り込んだ改善提案
- S-001 (reviewer 1): identity ドメインの `LockoutPolicy` 値オブジェクトと `LockoutPolicy.create()` を使用する設計に統一
- S-001 (reviewer 3): `failedLoginMessage` をスコープ外として明記
- S-002 (reviewer 2): ロック期限切れ後にパスワードを間違えた場合はカウントが再開し再ロック可能であることを明確化（成功時リセットの条件に `lockedUntil !== null` を追加）

### 見送った提案とその理由
- P-001 (reviewer 2): `changePassword.ts` でのロックアウトチェック — Issue #3 のスコープ（ログイン時のロックアウト）外。スコープ外セクションに明記
- P-002 (reviewer 1): トランザクションスコープの明示 — 擬似コード追加で対応済み。同一トランザクション内で実行する旨を明記
