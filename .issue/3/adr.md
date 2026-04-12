# ADR — Issue #3: バグ: アカウントロックアウト機能が未実装

## ADR-001: ロックアウトポリシーの取得場所

### Status
Proposed

### Context
ロックアウトポリシー（`maxFailedAttempts`, `lockoutDurationMinutes`）をドメインサービスがどう取得するかについて、2つの選択肢がある:
- A: ドメインサービスに `SystemSettingsRepository` への依存を追加し、自身で取得する
- B: アプリケーション層で取得し、パラメータとしてドメインサービスに渡す

### Decision
**B: アプリケーション層で取得してパラメータとして渡す**を選択する。

理由:
1. 既存の `sessionPolicy` と同じパターン（`login.ts` L46-48で `SessionPolicy` を作ってドメインサービスに渡している）で一貫性がある
2. ドメインサービスの純粋性を維持でき、テスト時にポリシーを自由に制御できる
3. `SystemSettingsRepository` はインフラストラクチャの関心事であり、ドメイン層が直接依存すべきでない

### Consequences
- 良い点: ドメインサービスのテスタビリティが高い、アーキテクチャの一貫性
- トレードオフ: `login.ts` にシステム設定取得のコードが追加される

---

## ADR-002: ロックアウトチェックのタイミング

### Status
Proposed

### Context
ロックアウトチェックをパスワード検証の前に行うか後に行うか。

### Decision
**パスワード検証の前**に行う。

理由:
1. ロックされたアカウントに対するパスワード検証（ハッシュ比較）はCPU時間の無駄
2. 攻撃者にパスワードの正誤情報を漏らさないセキュリティ上の利点がある

### Consequences
- 良い点: パフォーマンスとセキュリティの両方で優れる
- トレードオフ: レスポンス時間の差からロック状態を推測される可能性があるが、これは一般的なトレードオフであり本Issueのスコープ外

---

## ADR-003: `lockoutDurationMinutes: null` の扱い

### Status
Proposed

### Context
`lockoutDurationMinutes` が `null` の場合、永久ロック（管理者による手動解除が必要）を意味する。この場合の `lockedUntil` の値をどう設定するか。

選択肢:
- A: `lockedUntil` を `null` にして、`failedLoginAttempts >= maxFailedAttempts && lockedUntil === null` を永久ロックと判定
- B: `lockedUntil` に十分遠い未来の日付（例: 9999-12-31）を設定し、判定ロジックを `lockedUntil > now` に統一

### Decision
**B: 遠い未来の日付を設定**する。

理由:
1. ロックアウト判定が `lockedUntil !== null && lockedUntil > now` の一本化で済みシンプル
2. `lockedUntil === null` は「ロックされていない」を意味する既存の解釈と矛盾しない
3. 永久ロックと通常ロックで異なる判定パスを持つ必要がなくなる

### Consequences
- 良い点: 判定ロジックがシンプル、`lockedUntil` の意味が一貫
- トレードオフ: 管理者がDBを直接見た場合、9999年の日付が永久ロックを意味することが直感的でない可能性
