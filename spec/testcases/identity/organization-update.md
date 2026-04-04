# 組織の更新 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 組織が存在する | name を新しい値に変更する | 組織名が変更され、更新後の情報が返却される | |
| 子組織（親あり）が存在する | parentOrganizationId を別の親組織に変更する | 組織が新しい親組織の下に移動する | |
| 子組織が存在する | parentOrganizationId を null に変更する | 組織がルート組織に移動する | |
| 組織が存在する | orderIndex を変更する | 表示順序が変更される | |
| 組織が存在する | name・parentOrganizationId・orderIndex をすべて同時に変更する | すべての変更が反映される | |
| - | organizationId を空文字で送信する | バリデーションエラーが返される | |
| - | organizationId に UUID 形式でない文字列を送信する | バリデーションエラーが返される | |
| - | name を空文字で指定する | EmptyOrganizationNameError が返される | |
| - | orderIndex に負数を指定する | InvalidOrderIndexError が返される | |
| 指定した organizationId の組織が存在しない | 組織を更新する | OrganizationNotFoundError が返される | |
| 移動先の parentOrganizationId の組織が存在しない | 親組織を変更する | OrganizationNotFoundError が返される | |
| 組織Aの子に組織Bがある | 組織Aの親を組織Bに変更する | CircularReferenceError が返される | |
| 組織Aが存在する | 組織Aの親を組織A自身に変更する | CircularReferenceError が返される | |
| 組織A→組織B→組織Cの階層がある | 組織Aの親を組織Cに変更する | CircularReferenceError が返される | |
