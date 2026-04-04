# レコードアクセス権の更新 テストケース

UC-AC04: レコードアクセス権のルールリストを一括更新する。

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| アプリが存在し、操作者にアプリ管理権限がある | 有効な rights と正しいリビジョンを指定して更新する | レコードアクセス権が更新され、新しい rights と revision が返される | |
| アプリが存在し、操作者にアプリ管理権限がある | revision を省略して更新する | リビジョンチェックがスキップされ、更新が実行される | |
| アプリが存在し、操作者にアプリ管理権限がある | filterCond=null のルールを含む rights で更新する | 全レコードを対象とするルールとして更新される | |
| アプリが存在し、操作者にアプリ管理権限がある | 有効な filterCond を持つルールで更新する | 条件付きルールが正常に更新される | |
| アプリが存在し、操作者にアプリ管理権限がある | Everyone エントリを含むルールで更新する | Everyone が末尾に自動移動される | |
| アプリが存在するが、操作者にアプリ管理権限がない | 更新を実行する | AppPermissionDeniedError が返される | |
| アプリが存在しない | 更新を実行する | AppNotFoundError が返される | |
| リビジョンが現在の値と一致しない | 更新を実行する | RevisionConflictError が返される | |
| filterCond に order by 句が含まれている | 更新を実行する | InvalidFilterCondError が返される | |
| filterCond に limit 句が含まれている | 更新を実行する | InvalidFilterCondError が返される | |
| filterCond に offset 句が含まれている | 更新を実行する | InvalidFilterCondError が返される | |
| filterCond に and と or が混在している | 更新を実行する | InvalidFilterCondError が返される | |
| rights のルール内に編集権限=true だが閲覧権限=false のエンティティがある | 更新を実行する | PermissionDependencyError が返される | |
| rights のルール内に削除権限=true だが閲覧権限=false のエンティティがある | 更新を実行する | PermissionDependencyError が返される | |
| 同一ルール内にエンティティが重複している | 更新を実行する | DuplicateEntityInRuleError が返される | |
| アプリが存在し、操作者にアプリ管理権限がある | 複数ルールを含む rights で更新する | 全ルールが正常に更新される | |
| アプリが存在し、操作者にアプリ管理権限がある | 有効な filterCond（and 条件のみ）で更新する | 正常に更新される | |
| アプリが存在し、操作者にアプリ管理権限がある | 有効な filterCond（or 条件のみ）で更新する | 正常に更新される | |
