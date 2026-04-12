# アクセス制限設定の更新 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| access_restriction 設定が存在する | IP 制限有効、有効な CIDR、Basic 認証有効で更新する | 設定が更新され、更新後の DTO が返る（パスワードハッシュは含まれない） | |
| access_restriction 設定が存在する | IP 制限を無効に、allowedIps を空配列にして更新する | 正常に更新される | |
| access_restriction 設定が存在する | 有効な CIDR "192.168.1.0/24" を含めて更新する | 正常に更新され、allowedIps に含まれる | |
| access_restriction 設定が存在する | 有効な CIDR "10.0.0.0/8" を含めて更新する | 正常に更新される | |
| access_restriction 設定が存在する | 不正な CIDR "999.999.999.999/32" を含めて更新する | InvalidCidrError が返る | |
| access_restriction 設定が存在する | 不正な CIDR "not-a-cidr" を含めて更新する | InvalidCidrError が返る | |
| access_restriction 設定が存在する | CIDR 形式でない IP アドレス "192.168.1.1"（サブネットなし）を含めて更新する | InvalidCidrError が返る | |
| access_restriction 設定が存在する | basicAuthEnabled を true、有効な username と password で更新する | 正常に更新され、パスワードがハッシュ化される | |
| access_restriction 設定が存在する | basicAuthEnabled を true、basicAuthUsername を空文字で更新する | InvalidSettingValueError が返る | |
| access_restriction 設定が存在する | basicAuthEnabled を true、basicAuthUsername を null で更新する | InvalidSettingValueError が返る | |
| access_restriction 設定が存在する | basicAuthEnabled を false で更新する | 正常に更新される | |
| access_restriction 設定が存在する | basicAuthPassword を null（変更なし）で更新する | 既存のパスワードハッシュが維持される | |
| access_restriction 設定が存在する | basicAuthPassword を新しい値で更新する | 新しいパスワードがハッシュ化されて保存される | |
| access_restriction 設定が存在しない | 有効な値で更新する | SettingNotFoundError が返る | |
