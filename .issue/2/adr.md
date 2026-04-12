# ADR — Issue #2: バグ: スペース作成・アプリ作成ページのルートが未実装

## ADR-001: スペース作成を独立ページとして実装する

### Status
Proposed

### Context
spec/flows/space-create.md ではスペース作成をダイアログ（モーダル）として設計している。一方、ポータルの Options メニューの `<Link to="/spaces/new">` は独立URLへの遷移を前提としている。ダイアログとして実装する場合、ポータルページ側に action/state を追加する大幅改修が必要になる。

### Decision
独立ページ（`/spaces/new`）として実装する。理由: (1) ルートが `/spaces/new` として既にリンクされている、(2) Issue の核心は「ルートが存在しない」問題の解消であり、UI形態の変更は副次的、(3) 独立ページの方がテスタビリティが高い。

### Consequences
- 良い点: 変更範囲が最小限、loader/action が明確に分離、テストしやすい
- トレードオフ: spec のダイアログ仕様との乖離。将来的にダイアログ化する場合はポータル側の改修が必要

---

## ADR-002: メンバー管理は作成者のみの MVP とする

### Status
Proposed

### Context
createSpace ユースケースは members 配列に少なくとも1人の管理者メンバーを必須としている（NoAdminMember エラー）。spec/flows/space-create.md では「参加メンバー」タブでユーザー検索・組織選択が可能だが、これは複雑なUIコンポーネントが必要。

### Decision
初期実装では作成者を唯一の管理者メンバーとして自動追加する。メンバー追加はスペース作成後の設定画面で行う方式とする。

### Consequences
- 良い点: 実装がシンプル、Issue の核心（ルート未実装解消）に集中できる
- トレードオフ: spec/manual-tests/space-create.md の TC-004, TC-005（メンバー追加関連）はカバーできない

---
