# 組織の作成 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| システム管理者が認証済み | name・code を指定してルート組織を作成する | 組織が作成され、organizationId・name・code・parentOrganizationId=null・orderIndex が返却される | |
| 親組織が存在する | parentOrganizationId を指定して子組織を作成する | 親組織の子として組織が作成される | |
| - | orderIndex を 5 に指定して作成する | orderIndex が 5 の組織が作成される | |
| - | orderIndex を省略して作成する | orderIndex が 0 の組織が作成される | |
| - | name を空文字で送信する | バリデーションエラーが返される | |
| - | code を空文字で送信する | バリデーションエラーが返される | |
| - | parentOrganizationId に UUID 形式でない文字列を送信する | バリデーションエラーが返される | |
| - | orderIndex に負数（-1）を指定する | バリデーションエラーが返される | |
| 指定した parentOrganizationId の組織が存在しない | 子組織を作成する | OrganizationNotFoundError が返される | |
| 同一の code を持つ組織が既に存在する | 同じ code で組織を作成する | DuplicateOrganizationCodeError が返される | |
| - | orderIndex に 0 を指定して作成する | orderIndex が 0 の組織が作成される（境界値） | |
