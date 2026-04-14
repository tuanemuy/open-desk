# ADR — Issue #31: Implement record detail edit/delete/reuse flows

## ADR-001: 編集は詳細画面内ではなく専用 route で扱う

### Status
Accepted

### Context
Issue #31 ではレコード詳細から編集導線を追加する必要がある。既存実装には新規作成画面があり、顧客リスト向けの固定フォームが既に完成している一方、詳細画面は表示専用でコメント投稿も同居している。

### Decision
`apps/:appId/records/:recordId/edit` の専用 route を追加し、編集 UI は新規作成画面と同じフォーム構成で実装する。詳細画面は導線の起点に留める。

### Consequences
- 詳細画面の責務を表示と削除導線に絞れる
- 保存成功後の遷移先を詳細画面に固定しやすい
- 既存の新規作成フォーム資産を流用しやすい

## ADR-002: 再利用は新規作成 route に初期値を流し込む

### Status
Accepted

### Context
再利用要件は「既存値をコピーした新規作成画面へ遷移する」ことであり、複製を即時保存することではない。既存の `reuseRecord` use case は未保存の `fieldValues` を返す。

### Decision
詳細画面の `Reuse record` は `records/new?reuseRecordId=:recordId` に遷移させ、new loader が `reuseRecord` を呼んでフォーム初期値へ変換する。

### Consequences
- 新しい保存ロジックを増やさず既存の `createRecord` をそのまま使える
- 再利用と新規作成の UI 差分を最小にできる
- URL クエリで flow を表現できるためルート構成が増えすぎない
