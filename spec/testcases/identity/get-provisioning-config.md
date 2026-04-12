# プロビジョニング設定の取得 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| プロビジョニングが無効でトークン未設定の初期状態 | プロビジョニング設定を取得する | isEnabled=false、hasToken=false、tokenIssuedAt=null、updatedAt が返却される | |
| プロビジョニングが有効でトークンが設定済み | プロビジョニング設定を取得する | isEnabled=true、hasToken=true、tokenIssuedAt に発行日時が返却される | |
| プロビジョニングが無効だがトークンが設定済み | プロビジョニング設定を取得する | isEnabled=false、hasToken=true、tokenIssuedAt に発行日時が返却される | |
| トークンが設定済み | プロビジョニング設定を取得する | ベアラートークンの平文は出力に含まれない（hasToken のみ） | |
