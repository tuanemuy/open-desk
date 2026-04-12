# 監査ログ記録 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 有効な入力パラメータが揃っている | level: "INFO", service: "OPEN_DESK", module: "App management", action: "App create", result: "SUCCESS", errorCode: null で監査ログを記録する | AuditLog が作成・永続化され、auditLogId が返る | |
| 有効な入力パラメータが揃っている | level: "CRITICAL", result: "FAILURE", errorCode: "AUTH_001" で監査ログを記録する | AuditLog が CRITICAL レベル・FAILURE 結果・エラーコード付きで作成される | |
| sourceIp が null | システム内部処理として監査ログを記録する | sourceIp が null の AuditLog が正常に作成される | |
| sourceIp が有効な IP アドレス | 外部アクセスの監査ログを記録する | sourceIp が設定された AuditLog が作成される | |
| userId が null | システム処理として監査ログを記録する | userId が null の AuditLog が正常に作成される | |
| userId が有効な UserId | ユーザー操作の監査ログを記録する | userId が設定された AuditLog が作成される | |
| service が "COMMON" | サービス共通の監査ログを記録する | service が COMMON の AuditLog が作成される | |
| service が "GAROON" | Garoon の監査ログを記録する | service が GAROON の AuditLog が作成される | |
| service が "CYBOZU_OFFICE" | サイボウズ Office の監査ログを記録する | service が CYBOZU_OFFICE の AuditLog が作成される | |
| 有効な入力パラメータが揃っている | result: "SUCCESS", errorCode: "ERR_001"（非 null）で監査ログを記録する | errorCode が null に補正され、AuditLog が作成される（不変条件の維持） | |
| 有効な入力パラメータが揃っている | result: "FAILURE", errorCode: "ERR_001" で監査ログを記録する | errorCode がそのまま保持された AuditLog が作成される | |
| 有効な入力パラメータが揃っている | result: "FAILURE", errorCode: null で監査ログを記録する | errorCode が null の FAILURE ログが正常に作成される | |
| 有効な入力パラメータが揃っている | module を空文字で監査ログを記録する | EmptyModuleError が返る | |
| 有効な入力パラメータが揃っている | action を空文字で監査ログを記録する | EmptyActionError が返る | |
| 有効な入力パラメータが揃っている | module と action の両方を空文字で監査ログを記録する | EmptyModuleError が返る（module のバリデーションが先に実行される） | |
