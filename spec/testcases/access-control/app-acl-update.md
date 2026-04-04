# アプリアクセス権の更新 テストケース

UC-AC02: アプリのアクセス権ルールリストを一括更新する。

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| アプリが存在し、操作者にアプリ管理権限がある | 有効な rights と正しいリビジョンを指定して更新する | アクセス権が更新され、新しい appId, rights, revision が返される | |
| アプリが存在し、操作者にアプリ管理権限がある | revision を省略して更新する | リビジョンチェックがスキップされ、更新が実行される | |
| アプリが存在し、操作者にアプリ管理権限がある | Everyone エントリを含む rights を指定して更新する | Everyone が末尾に自動移動される | |
| アプリが存在するが、操作者にアプリ管理権限がない | 更新を実行する | AppPermissionDeniedError が返される | |
| アプリが存在しない | 更新を実行する | AppNotFoundError が返される | |
| リビジョンが現在の値と一致しない | 更新を実行する | RevisionConflictError が返される | |
| rights が空配列 | 更新を実行する | EmptyRightsError が返される | |
| rights に同一エンティティが重複している | 更新を実行する | DuplicateEntityError が返される | |
| rights に編集権限=true だが閲覧権限=false のエントリがある | 更新を実行する | PermissionDependencyError が返される | |
| rights に削除権限=true だが閲覧権限=false のエントリがある | 更新を実行する | PermissionDependencyError が返される | |
| rights にインポート権限=true だが追加権限=false のエントリがある | 更新を実行する | ImportDependencyError が返される | |
| アプリが存在し、操作者にアプリ管理権限がある | 1件のエントリのみを含む rights で更新する | 正常に更新される | |
| アプリが存在し、操作者にアプリ管理権限がある | 全権限フラグが true のエントリで更新する | 正常に更新される | |
| アプリが存在し、操作者にアプリ管理権限がある | 全権限フラグが false のエントリで更新する | 正常に更新される | |
| アプリが存在し、操作者にアプリ管理権限がある | includeSubs=true の ORGANIZATION エントリで更新する | サブ組織を含めたエントリとして正常に更新される | |
