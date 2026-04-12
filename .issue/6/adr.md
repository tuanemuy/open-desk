# ADR — Issue #6: リファクタ: 残りの11ルートでZodスキーマをschemas.tsに統一する

## ADR-001: スキーマ乖離ルートでのサーバー側フルスキーマ採用

### Status
Proposed

### Context
対象11ルートのうち4ルート（features, security/login, acl, system-mail）では、`action.server.ts` と `index.tsx` でスキーマの内容が異なっている。

選択肢:
1. サーバー側のフルスキーマを `schemas.ts` に配置し、クライアントでもそのまま使う
2. サーバー側とクライアント側の2つのスキーマを `schemas.ts` に配置し、用途別に使い分ける
3. クライアント側の簡易スキーマを残し、サーバー側のみ `schemas.ts` に移す

### Decision
選択肢1を採用。サーバー側のフルスキーマを `schemas.ts` に配置し、クライアント・サーバーの両方で共有する。

理由:
- サーバー側のスキーマがバリデーションの正（Single Source of Truth）
- Conform の `getZodConstraint` は `.transform()` 付きフィールドに `required` 制約を生成しないため、フルスキーマでも問題ない
- `parseWithZod` もフルスキーマで正常動作する
- 選択肢2は `schemas.ts` に分けた意味が薄れる（乖離リスクが残る）
- Issue #6 の目的「片方だけ変更した際のバリデーション乖離リスク解消」に最も合致

### Consequences
- 良い点: Single Source of Truth が実現し、乖離リスクが完全に解消される
- トレードオフ: クライアント側のバリデーションが若干厳密になるが、実害なし

---

## ADR-002: スキーマ命名規則

### Status
Proposed

### Context
`action.server.ts` でローカル変数 `schema` として定義されているルートが多数ある。`schemas.ts` にexportする際、他ルートと区別できる名前が必要。

選択肢:
1. ルートのドメインを反映した名前に変更（例: `customizeSchema`, `mobileSchema`）
2. 既存のサーバー側の名前をそのまま使う（名前付きのものはそのまま、`schema` は何らかの名前に）

### Decision
既にサーバー側で具体的な名前が付いているもの（`updateFeaturesSchema`, `saveSecuritySchema` 等）はそのまま使用。ローカル変数 `schema` は `{ドメイン}Schema` の形式にリネーム。

### Consequences
- 良い点: 既存パターン（`loginSchema`, `updateTimeFormatSchema`）と一貫した命名
- トレードオフ: 特になし
