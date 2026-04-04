# システム権限の追加 テストケース

UC-AC08: ユーザー・組織・グループに対するシステム権限を新規追加する。

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 操作者にシステム管理権限がある | entity.type=USER で有効な権限設定を指定して追加する | システム権限が作成され、systemPermissionId を含む結果が返される | |
| 操作者にシステム管理権限がある | entity.type=ORGANIZATION で権限追加する | 組織に対するシステム権限が作成される | |
| 操作者にシステム管理権限がある | entity.type=GROUP で権限追加する | グループに対するシステム権限が作成される | |
| 操作者にシステム管理権限がある | entity.type=ORGANIZATION, includeSubs=true で追加する | サブ組織を含む権限が作成される | |
| 操作者にシステム管理権限がある | entity.type=USER, includeSubs=true で追加する | includeSubs は ORGANIZATION のみ許容のため、エラーとなる | |
| 操作者にシステム管理権限がある | entity.type=GROUP, includeSubs=true で追加する | includeSubs は ORGANIZATION のみ許容のため、エラーとなる | |
| 操作者が cybozu.com 共通管理者 | 権限追加を実行する | 正常にシステム権限が作成される | |
| 操作者にシステム管理権限がなく、cybozu.com 共通管理者でもない | 権限追加を実行する | SystemPermissionDeniedError が返される | |
| 同一エンティティに対するシステム権限が既に存在する | 同じエンティティで権限追加を実行する | DuplicateSystemPermissionError が返される | |
| entity.type が CREATOR | 権限追加を実行する | InvalidEntityTypeError が返される | |
| entity.type が FIELD_ENTITY | 権限追加を実行する | InvalidEntityTypeError が返される | |
| 操作者にシステム管理権限がある | 全権限フラグを true にして追加する | 全権限項目が true で作成される | |
| 操作者にシステム管理権限がある | 全権限フラグを false にして追加する | 全権限項目が false で作成される | |
| 操作者にシステム管理権限がある | systemAdmin=true のみで他は false にして追加する | systemAdmin のみ true で作成される | |
| 操作者にシステム管理権限がある | entity.code が空文字 | バリデーションエラーが返される | |
