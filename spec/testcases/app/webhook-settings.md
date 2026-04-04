# Webhook設定 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| ACTIVE ��態のアプリが存在する | webhookId=null（新規）、HTTPS URL・events を指定して Webhook を作成する | Webhook が作成され、webhookId・url・events・isActive が返却さ��る | |
| 既存の Webhook が存在する | webhookId を指定して URL を変更する | Webhook の URL が更新される | |
| 既存の Webhook が存在する | events を変更する | トリガーイベントが変更される | |
| 既存の Webhook が存在する | isActive=false に変更する | Webhook が無効化される | |
| 既存の Webhook が存在する | description を変更する | 説明が更新される | |
| - | 存在しない appId を指定する | バリデーションエ���ーが返される | |
| ア���リが DELETED 状態 | Webhook を設定する | ビジネスルール違反エラーが返される | |
| - | url に HTTP（非 HTTPS）の URL を指定する | バリデーション���ラーが返される | |
| - | events を空配列で送信する | バリデーションエラーが返される | |
| アプリの Webhook 数が上限（10件）に達している | 新規 Webhook を作成する | ビジネスルール違反���ラーが返される | |
| アプリの Webhook 数が9件 | 新規 Webhook を作成する | 正常に作成される（境界値：上限直前） | |
| - | 存在しない webhookId を指定する | バリデーシ��ンエラーが返される | |
