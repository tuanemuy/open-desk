# Record ユースケース定義

Record ドメインのユースケースを定義する。
ユースケースはドメインモデルの操作を組み合わせて要件を実現するオーケストレーターであり、ビジネスロジック自体はドメイン層に置く。

---

## レコード CRUD

---

### UC-R01: レコード作成（単体）

#### 概要

1件のレコードを新規作成する。フィールド値のバリデーション後、リビジョン1で保存する。作成者・作成日時はシステムが自動設定するが、管理者は明示的に指定することもできる。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|------------|-----|---------|------------------|
| appId | AppId | 必須 | 有効なアプリID |
| fieldValues | Map<FieldCode, FieldValue> | 必須 | 1つ以上のフィールド値 |
| creatorId | UserId | 必須 | 実行ユーザーのID |

#### 出力DTO

| フィールド名 | 型 |
|------------|-----|
| recordId | RecordId |
| revision | number |

#### 処理フロー

1. `RecordValidationService.validateFieldValues(appId, fieldValues, isUpdate: false)` でフィールド値をバリデーションする
2. `Record` エンティティを新規生成する（revision: 1、creatorId・createdAt をセット）
3. `Record.updateFieldValues(fieldValues)` でフィールド値を設定する
4. `RecordRepository.save(record)` でレコードを永続化する
5. `RecordHistory` を生成する（version: 1、changedFields: 空）
6. `RecordHistoryRepository.save(history)` で変更履歴を永続化する
7. 保存されたレコードの recordId と revision を返す

#### エラーケース

| 条件 | エラー種類 |
|------|----------|
| フィールド値が不正（型不一致、必須未入力、選択肢不在など） | FieldValidationError（バリデーションエラー） |
| 更新不可フィールドへの書き込み | InvalidFieldUpdateError（バリデーションエラー） |
| 重複禁止フィールドの一意性違反 | FieldValidationError（ビジネスルール違反） |
| アプリが存在しない | AppNotFoundError（リソース不在） |

---

### UC-R02: レコード一括作成

#### 概要

最大100件のレコードを一括作成する。全件成功または全件ロールバックのトランザクション処理を行う。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|------------|-----|---------|------------------|
| appId | AppId | 必須 | 有効なアプリID |
| records | Array<{ fieldValues: Map<FieldCode, FieldValue> }> | 必須 | 1件以上100件以下 |
| creatorId | UserId | 必須 | 実行ユーザーのID |

#### 出力DTO

| フィールド名 | 型 |
|------------|-----|
| ids | Array<RecordId> |
| revisions | Array<number> |

#### 処理フロー

1. 入力の件数が100件以下であることを検証する
2. 各レコードについて `RecordValidationService.validateFieldValues(appId, fieldValues, isUpdate: false)` でバリデーションする
3. 各レコードの `Record` エンティティを新規生成する（revision: 1）
4. 各レコードについて `Record.updateFieldValues(fieldValues)` でフィールド値を設定する
5. `RecordRepository.saveBatch(records)` で一括永続化する（トランザクション）
6. 各レコードについて `RecordHistory` を生成し、`RecordHistoryRepository.save(history)` で保存する
7. 各レコードの recordId と revision を返す

#### エラーケース

| 条件 | エラー種類 |
|------|----------|
| 件数が100件を超える | BatchSizeLimitExceededError（バリデーションエラー） |
| いずれかのレコードでフィールド値が不正 | FieldValidationError（バリデーションエラー） |
| 更新不可フィールドへの書き込み | InvalidFieldUpdateError（バリデーションエラー） |
| 重複禁止フィールドの一意性違反 | FieldValidationError（ビジネスルール違反） |
| アプリが存在しない | AppNotFoundError（リソース不在） |

---

### UC-R03: レコード取得（単体）

#### 概要

アプリIDとレコードIDで1件のレコードを取得する。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|------------|-----|---------|------------------|
| appId | AppId | 必須 | 有効なアプリID |
| recordId | RecordId | 必須 | 有効なレコードID |

#### 出力DTO

| フィールド名 | 型 |
|------------|-----|
| record | Record |

#### 処理フロー

1. `RecordRepository.findById(appId, recordId)` でレコードを取得する
2. レコードが存在しない場合はエラーを返す
3. レコードを返す

#### エラーケース

| 条件 | エラー種類 |
|------|----------|
| レコードが存在しない | RecordNotFoundError（リソース不在） |
| アプリが存在しない | AppNotFoundError（リソース不在） |

---

### UC-R04: レコード取得（クエリ）

#### 概要

クエリ条件に一致する複数レコードを取得する。最大500件、offset上限10,000件。クエリ文字列のパース・バリデーション・関数解決を行う。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|------------|-----|---------|------------------|
| appId | AppId | 必須 | 有効なアプリID |
| query | string | 任意 | クエリ構文に準拠 |
| fields | FieldCode[] | 任意 | 取得対象フィールド。省略時は全フィールド |
| totalCount | boolean | 任意 | true で合計件数を取得。デフォルト false |
| executionContext | QueryExecutionContext | 必須 | ログインユーザー情報・現在日時 |

#### 出力DTO

| フィールド名 | 型 |
|------------|-----|
| records | Record[] |
| totalCount | number \| null |

#### 処理フロー

1. query が指定されている場合、`RecordQueryService.parseAndValidate(query)` でパース・バリデーションする
2. `RecordQueryService.resolveFunctions(parsedQuery, executionContext)` でクエリ内の関数を解決する
3. `RecordRepository.findByQuery(appId, resolvedQuery, fields, totalCount)` でレコードを取得する
4. レコード配列と合計件数を返す

#### エラーケース

| 条件 | エラー種類 |
|------|----------|
| クエリ構文が不正 | QuerySyntaxError（バリデーションエラー） |
| クエリのバリデーションエラー（演算子不正、offset超過等） | QueryValidationError（バリデーションエラー） |
| アプリが存在しない | AppNotFoundError（リソース不在） |

---

### UC-R05: レコード更新（単体）

#### 概要

1件のレコードを更新する。リビジョンベースの楽観的ロックによる競合検出を行う。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|------------|-----|---------|------------------|
| appId | AppId | 必須 | 有効なアプリID |
| recordId | RecordId | 必須 | 有効なレコードID |
| fieldValues | Map<FieldCode, FieldValue> | 必須 | 更新対象のフィールド値 |
| revision | number | 任意 | 期待するリビジョン。-1 または省略でチェックスキップ |
| modifierId | UserId | 必須 | 実行ユーザーのID |

#### 出力DTO

| フィールド名 | 型 |
|------------|-----|
| revision | number |

#### 処理フロー

1. `RecordRepository.findById(appId, recordId)` で既存レコードを取得する
2. レコードが存在しない場合はエラーを返す
3. `Record.checkRevision(revision)` で楽観的ロックチェックを行う
4. `RecordValidationService.validateFieldValues(appId, fieldValues, isUpdate: true)` でフィールド値をバリデーションする
5. 更新前のフィールド値を保持する（変更履歴用）
6. `Record.updateFieldValues(fieldValues)` でフィールド値を更新する
7. `Record.incrementRevision()` でリビジョンを増加させる
8. modifierId と updatedAt を設定する
9. `RecordRepository.save(record)` でレコードを永続化する
10. 更新前後のフィールド値から `FieldDiff` を生成し、`RecordHistory` を作成する
11. `RecordHistoryRepository.save(history)` で変更履歴を永続化する
12. 更新後の revision を返す

#### エラーケース

| 条件 | エラー種類 |
|------|----------|
| レコードが存在しない | RecordNotFoundError（リソース不在） |
| リビジョンが一致しない | RevisionConflictError（競合エラー） |
| フィールド値が不正 | FieldValidationError（バリデーションエラー） |
| 更新不可フィールドへの書き込み | InvalidFieldUpdateError（バリデーションエラー） |
| サブテーブルの行が不完全 | SubtableRowMissingError（バリデーションエラー） |
| 作成時限定フィールド（作成者・作成日時）への更新 | FieldValidationError（バリデーションエラー） |

---

### UC-R06: レコード一括更新

#### 概要

最大100件のレコードを一括更新する。各レコードに対してリビジョンチェックを行う。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|------------|-----|---------|------------------|
| appId | AppId | 必須 | 有効なアプリID |
| records | Array<{ recordId: RecordId, fieldValues: Map<FieldCode, FieldValue>, revision?: number }> | 必須 | 1件以上100件以下 |
| modifierId | UserId | 必須 | 実行ユーザーのID |

#### 出力DTO

| フィールド名 | 型 |
|------------|-----|
| records | Array<{ recordId: RecordId, revision: number }> |

#### 処理フロー

1. 入力の件数が100件以下であることを検証する
2. 各レコードについて `RecordRepository.findById(appId, recordId)` で既存レコードを取得する
3. 各レコードについて `Record.checkRevision(revision)` で楽観的ロックチェックを行う
4. 各レコードについて `RecordValidationService.validateFieldValues(appId, fieldValues, isUpdate: true)` でバリデーションする
5. 各レコードの更新前フィールド値を保持する
6. 各レコードについて `Record.updateFieldValues(fieldValues)` でフィールド値を更新する
7. 各レコードについて `Record.incrementRevision()` でリビジョンを増加させる
8. modifierId と updatedAt を設定する
9. `RecordRepository.saveBatch(records)` で一括永続化する
10. 各レコードについて変更履歴を生成し、`RecordHistoryRepository.save(history)` で保存する
11. 各レコードの recordId と revision を返す

#### エラーケース

| 条件 | エラー種類 |
|------|----------|
| 件数が100件を超える | BatchSizeLimitExceededError（バリデーションエラー） |
| いずれかのレコードが存在しない | RecordNotFoundError（リソース不在） |
| いずれかのレコードでリビジョン不一致 | RevisionConflictError（競合エラー） |
| いずれかのレコードでフィールド値が不正 | FieldValidationError（バリデーションエラー） |
| 更新不可フィールドへの書き込み | InvalidFieldUpdateError（バリデーションエラー） |

---

### UC-R07: レコード削除

#### 概要

最大100件のレコードを一括削除する。リビジョンチェック付き。全件成功または全件ロールバックのトランザクション処理を行う。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|------------|-----|---------|------------------|
| appId | AppId | 必須 | 有効なアプリID |
| recordIds | RecordId[] | 必須 | 1件以上100件以下 |
| revisions | Map<RecordId, number> | 任意 | 各レコードの期待リビジョン。省略または -1 でチェックスキップ |

#### 出力DTO

| フィールド名 | 型 |
|------------|-----|
| (なし) | void |

#### 処理フロー

1. 入力の件数が100件以下であることを検証する
2. 各レコードについて `RecordRepository.findById(appId, recordId)` で既存レコードを取得する
3. 各レコードが存在しない場合はエラーを返す
4. revisions が指定されている場合、各レコードについて `Record.checkRevision(revision)` で楽観的ロックチェックを行う
5. `RecordRepository.delete(appId, recordIds)` で一括削除する（トランザクション）

#### エラーケース

| 条件 | エラー種類 |
|------|----------|
| 件数が100件を超える | BatchSizeLimitExceededError（バリデーションエラー） |
| いずれかのレコードが存在しない | RecordNotFoundError（リソース不在） |
| いずれかのレコードでリビジョン不一致 | RevisionConflictError（競合エラー） |

---

### UC-R08: レコード再利用

#### 概要

既存レコードのフィールド値をコピーして新規作成用のレコードを生成する。システムフィールドはコピーしない。ステータスは初期ステータスにリセットされる。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|------------|-----|---------|------------------|
| appId | AppId | 必須 | 有効なアプリID |
| recordId | RecordId | 必須 | コピー元のレコードID |
| creatorId | UserId | 必須 | 実行ユーザーのID |

#### 出力DTO

| フィールド名 | 型 |
|------------|-----|
| fieldValues | Map<FieldCode, FieldValue> |

#### 処理フロー

1. `RecordRepository.findById(appId, recordId)` でコピー元レコードを取得する
2. レコードが存在しない場合はエラーを返す
3. `Record.reuse()` でコピーされたフィールド値を持つ新規レコードの下書きを生成する
4. コピーされたフィールド値を返す（保存はしない。クライアントが新規作成画面に展開する）

#### エラーケース

| 条件 | エラー種類 |
|------|----------|
| コピー元レコードが存在しない | RecordNotFoundError（リソース不在） |
| アプリが存在しない | AppNotFoundError（リソース不在） |

---

## プロセス管理

---

### UC-R09: プロセスステータス変更（単体）

#### 概要

アクションを実行してレコードのプロセスステータスを遷移させる。リビジョンが2増加する（アクション実行 + ステータス変更）。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|------------|-----|---------|------------------|
| appId | AppId | 必須 | 有効なアプリID |
| recordId | RecordId | 必須 | 有効なレコードID |
| action | string | 必須 | 実行するアクション名 |
| assignee | UserId | 任意 | 次の作業者。遷移先ステータスが要求する場合は必須 |
| revision | number | 任意 | 期待するリビジョン。-1 または省略でチェックスキップ |

#### 出力DTO

| フィールド名 | 型 |
|------------|-----|
| revision | number |

#### 処理フロー

1. `RecordRepository.findById(appId, recordId)` で既存レコードを取得する
2. レコードが存在しない場合はエラーを返す
3. `Record.checkRevision(revision)` で楽観的ロックチェックを行う
4. `ProcessExecutionService.executeTransition(record, action, assignee)` でステータス遷移を実行する
5. `RecordRepository.save(record)` でレコードを永続化する
6. 更新後の revision を返す

#### エラーケース

| 条件 | エラー種類 |
|------|----------|
| レコードが存在しない | RecordNotFoundError（リソース不在） |
| リビジョンが一致しない | RevisionConflictError（競合エラー） |
| 現在のステータスから指定アクションが実行不可 | InvalidStatusTransitionError（ビジネスルール違反） |
| 作業者が必要なのに未指定 | AssigneeRequiredError（バリデーションエラー） |
| 同名のアクションが複数存在 | DuplicateActionError（ビジネスルール違反） |

---

### UC-R10: プロセスステータス変更（一括）

#### 概要

最大100件のレコードのプロセスステータスを一括変更する。全レコードに対して同一のアクションを実行する。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|------------|-----|---------|------------------|
| appId | AppId | 必須 | 有効なアプリID |
| records | Array<{ recordId: RecordId, revision?: number }> | 必須 | 1件以上100件以下 |
| action | string | 必須 | 実行するアクション名 |
| assignee | UserId | 任意 | 次の作業者。遷移先ステータスが要求する場合は必須 |

#### 出力DTO

| フィールド名 | 型 |
|------------|-----|
| records | Array<{ recordId: RecordId, revision: number }> |

#### 処理フロー

1. 入力の件数が100件以下であることを検証する
2. 各レコードについて `RecordRepository.findById(appId, recordId)` で既存レコードを取得する
3. 各レコードについて `Record.checkRevision(revision)` で楽観的ロックチェックを行う
4. 各レコードについて `ProcessExecutionService.executeTransition(record, action, assignee)` でステータス遷移を実行する
5. `RecordRepository.saveBatch(records)` で一括永続化する
6. 各レコードの recordId と revision を返す

#### エラーケース

| 条件 | エラー種類 |
|------|----------|
| 件数が100件を超える | BatchSizeLimitExceededError（バリデーションエラー） |
| いずれかのレコードが存在しない | RecordNotFoundError（リソース不在） |
| いずれかのレコードでリビジョン不一致 | RevisionConflictError（競合エラー） |
| いずれかのレコードで無効なステータス遷移 | InvalidStatusTransitionError（ビジネスルール違反） |
| 作業者が必要なのに未指定 | AssigneeRequiredError（バリデーションエラー） |

---

### UC-R11: ワーカー割り当て変更

#### 概要

レコードの作業者を変更する。プロセス管理が有効なアプリでのみ使用可能。最大100名の作業者を設定できる。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|------------|-----|---------|------------------|
| appId | AppId | 必須 | 有効なアプリID |
| recordId | RecordId | 必須 | 有効なレコードID |
| assignees | UserId[] | 必須 | 新しい作業者リスト。空配列で作業者クリア。最大100名 |
| revision | number | 任意 | 期待するリビジョン。-1 または省略でチェックスキップ |

#### 出力DTO

| フィールド名 | 型 |
|------------|-----|
| revision | number |

#### 処理フロー

1. `RecordRepository.findById(appId, recordId)` で既存レコードを取得する
2. レコードが存在しない場合はエラーを返す
3. `Record.checkRevision(revision)` で楽観的ロックチェックを行う
4. `ProcessExecutionService.updateAssignees(record, assignees)` で作業者を更新する
5. `RecordRepository.save(record)` でレコードを永続化する
6. 更新後の revision を返す

#### エラーケース

| 条件 | エラー種類 |
|------|----------|
| レコードが存在しない | RecordNotFoundError（リソース不在） |
| リビジョンが一致しない | RevisionConflictError（競合エラー） |
| 作業者が100名を超える | TooManyAssigneesError（バリデーションエラー） |
| プロセス管理が無効なアプリ | ProcessNotEnabledError（ビジネスルール違反） |

---

## コメント

---

### UC-R12: コメント投稿

#### 概要

レコードにプレーンテキストコメントを投稿する。メンション指定が可能（最大10件）。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|------------|-----|---------|------------------|
| appId | AppId | 必須 | 有効なアプリID |
| recordId | RecordId | 必須 | 有効なレコードID |
| text | string | 必須 | 1文字以上65,535文字以下。プレーンテキストのみ |
| mentions | Mention[] | 任意 | 最大10件 |
| creatorId | UserId | 必須 | 投稿者のユーザーID |

#### 出力DTO

| フィールド名 | 型 |
|------------|-----|
| commentId | CommentId |

#### 処理フロー

1. `RecordRepository.findById(appId, recordId)` でレコードの存在を確認する
2. レコードが存在しない場合はエラーを返す
3. text の文字数が65,535文字以下であることを検証する
4. mentions が10件以下であることを検証する
5. `RecordComment` エンティティを新規生成する
6. `RecordCommentRepository.save(comment)` でコメントを永続化する
7. commentId を返す

#### エラーケース

| 条件 | エラー種類 |
|------|----------|
| レコードが存在しない | RecordNotFoundError（リソース不在） |
| テキストが空 | CommentTextEmptyError（バリデーションエラー） |
| テキストが65,535文字を超える | CommentTextTooLongError（バリデーションエラー） |
| メンションが10件を超える | TooManyMentionsError（バリデーションエラー） |

---

### UC-R13: コメント削除

#### 概要

自分が投稿したコメントを削除する。投稿者本人のみ削除可能。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|------------|-----|---------|------------------|
| appId | AppId | 必須 | 有効なアプリID |
| recordId | RecordId | 必須 | 有効なレコードID |
| commentId | CommentId | 必須 | 有効なコメントID |
| requesterId | UserId | 必須 | 実行ユーザーのID |

#### 出力DTO

| フィールド名 | 型 |
|------------|-----|
| (なし) | void |

#### 処理フロー

1. `RecordCommentRepository` からコメントを取得する（appId, recordId, commentId で特定）
2. コメントが存在しない場合はエラーを返す
3. `RecordComment.isOwnedBy(requesterId)` で投稿者本人かどうかを確認する
4. 投稿者本人でない場合はエラーを返す
5. `RecordCommentRepository.delete(commentId)` でコメントを削除する

#### エラーケース

| 条件 | エラー種類 |
|------|----------|
| コメントが存在しない | CommentNotFoundError（リソース不在） |
| 投稿者本人でない | CommentPermissionDeniedError（権限エラー） |

---

### UC-R14: コメント取得

#### 概要

レコードに紐づくコメントを取得する。最大10件ずつ、ページネーション対応。前後により古い/新しいコメントが存在するかのフラグも返す。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|------------|-----|---------|------------------|
| appId | AppId | 必須 | 有効なアプリID |
| recordId | RecordId | 必須 | 有効なレコードID |
| order | "asc" \| "desc" | 任意 | ソート順。デフォルト "desc" |
| offset | number | 任意 | スキップ件数。デフォルト 0 |
| limit | number | 任意 | 取得件数。最大10、デフォルト 10 |

#### 出力DTO

| フィールド名 | 型 |
|------------|-----|
| comments | RecordComment[] |
| older | boolean |
| newer | boolean |

#### 処理フロー

1. `RecordRepository.findById(appId, recordId)` でレコードの存在を確認する
2. レコードが存在しない場合はエラーを返す
3. `RecordCommentRepository.findByRecordId(appId, recordId, order, offset, limit)` でコメントを取得する
4. コメント配列と older/newer フラグを返す

#### エラーケース

| 条件 | エラー種類 |
|------|----------|
| レコードが存在しない | RecordNotFoundError（リソース不在） |

---

### UC-R15: コメントいいね

#### 概要

コメントにいいねを付与する。既にいいね済みの場合は何もしない（冪等）。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|------------|-----|---------|------------------|
| appId | AppId | 必須 | 有効なアプリID |
| recordId | RecordId | 必須 | 有効なレコードID |
| commentId | CommentId | 必須 | 有効なコメントID |
| userId | UserId | 必須 | いいねするユーザーのID |

#### 出力DTO

| フィールド名 | 型 |
|------------|-----|
| (なし) | void |

#### 処理フロー

1. `RecordCommentRepository` からコメントを取得する（appId, recordId, commentId で特定）
2. コメントが存在しない場合はエラーを返す
3. `RecordComment.addLike(userId)` でいいねを付与する
4. `RecordCommentRepository.save(comment)` でコメントを永続化する

#### エラーケース

| 条件 | エラー種類 |
|------|----------|
| コメントが存在しない | CommentNotFoundError（リソース不在） |

---

### UC-R16: コメントいいね取消

#### 概要

コメントのいいねを取り消す。いいねしていない場合は何もしない（冪等）。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|------------|-----|---------|------------------|
| appId | AppId | 必須 | 有効なアプリID |
| recordId | RecordId | 必須 | 有効なレコードID |
| commentId | CommentId | 必須 | 有効なコメントID |
| userId | UserId | 必須 | いいねを取り消すユーザーのID |

#### 出力DTO

| フィールド名 | 型 |
|------------|-----|
| (なし) | void |

#### 処理フロー

1. `RecordCommentRepository` からコメントを取得する（appId, recordId, commentId で特定）
2. コメントが存在しない場合はエラーを返す
3. `RecordComment.removeLike(userId)` でいいねを取り消す
4. `RecordCommentRepository.save(comment)` でコメントを永続化する

#### エラーケース

| 条件 | エラー種類 |
|------|----------|
| コメントが存在しない | CommentNotFoundError（リソース不在） |

---

## 変更履歴

---

### UC-R17: 変更履歴取得

#### 概要

レコードの変更履歴一覧を取得する。新しいバージョン順で返す。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|------------|-----|---------|------------------|
| appId | AppId | 必須 | 有効なアプリID |
| recordId | RecordId | 必須 | 有効なレコードID |

#### 出力DTO

| フィールド名 | 型 |
|------------|-----|
| histories | RecordHistory[] |

#### 処理フロー

1. `RecordRepository.findById(appId, recordId)` でレコードの存在を確認する
2. レコードが存在しない場合はエラーを返す
3. `RecordHistoryRepository.findByRecordId(appId, recordId)` で変更履歴を取得する
4. 変更履歴配列を返す（新しいバージョン順）

#### エラーケース

| 条件 | エラー種類 |
|------|----------|
| レコードが存在しない | RecordNotFoundError（リソース不在） |

---

### UC-R18: 過去バージョンへの復元

#### 概要

レコードを過去のバージョンに復元する。復元は新しいバージョン（RecordHistory エントリ）を生成する操作であり、既存の履歴を書き換えることはない。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|------------|-----|---------|------------------|
| appId | AppId | 必須 | 有効なアプリID |
| recordId | RecordId | 必須 | 有効なレコードID |
| version | number | 必須 | 復元対象のバージョン番号。1以上 |
| modifierId | UserId | 必須 | 実行ユーザーのID |

#### 出力DTO

| フィールド名 | 型 |
|------------|-----|
| revision | number |

#### 処理フロー

1. `RecordRepository.findById(appId, recordId)` で既存レコードを取得する
2. レコードが存在しない場合はエラーを返す
3. `RecordHistoryRepository.findByVersion(appId, recordId, version)` で対象バージョンの変更履歴を取得する
4. 変更履歴が存在しない場合はエラーを返す
5. `RecordHistory.buildRestoreValues()` で復元用のフィールド値を構築する
6. `RecordValidationService.validateFieldValues(appId, restoreValues, isUpdate: true)` でバリデーションする
7. 更新前のフィールド値を保持する（変更履歴用）
8. `Record.updateFieldValues(restoreValues)` でフィールド値を復元する
9. `Record.incrementRevision()` でリビジョンを増加させる
10. modifierId と updatedAt を設定する
11. `RecordRepository.save(record)` でレコードを永続化する
12. 更新前後のフィールド値から `FieldDiff` を生成し、新しい `RecordHistory` を作成する
13. `RecordHistoryRepository.save(history)` で変更履歴を永続化する
14. 更新後の revision を返す

#### エラーケース

| 条件 | エラー種類 |
|------|----------|
| レコードが存在しない | RecordNotFoundError（リソース不在） |
| 指定バージョンの変更履歴が存在しない | HistoryVersionNotFoundError（リソース不在） |
| 復元フィールド値のバリデーションエラー | FieldValidationError（バリデーションエラー） |

---

## CSV入出力

---

### UC-R19: CSVインポート（追加のみ）

#### 概要

CSVファイルからレコードを新規追加する。ADD_ONLY モードでインポートジョブを実行する。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|------------|-----|---------|------------------|
| appId | AppId | 必須 | 有効なアプリID |
| fileName | string | 必須 | ファイル名 |
| fileContent | ArrayBuffer | 必須 | ファイルの内容 |
| fileSize | number | 必須 | Excel: 最大1MB、CSV: 最大100MB |
| encoding | CsvEncoding | 必須 | SHIFT_JIS, LATIN1, GBK, UTF8, UTF8_BOM のいずれか |
| delimiter | CsvDelimiter | 必須 | COMMA, SEMICOLON, TAB, SPACE のいずれか |
| errorHandling | ErrorHandling | 必須 | CONTINUE または STOP |
| fieldMappings | FieldMapping[] | 必須 | フィールドとCSV列の対応付け。1つ以上 |
| creatorId | UserId | 必須 | 実行ユーザーのID |

#### 出力DTO

| フィールド名 | 型 |
|------------|-----|
| jobId | CsvImportJobId |

#### 処理フロー

1. `CsvImportJob` エンティティを新規生成する（importMode: ADD_ONLY、updateKey: null）
2. `CsvImportJobRepository.save(job)` でジョブを永続化する
3. `CsvImportJob.start()` でジョブを開始する
4. `CsvImportService.processImport(job, fileContent)` でインポートを実行する
5. インポート完了後、`CsvImportJob.complete(processedCount, errorCount)` でジョブを完了にする
6. `CsvImportJobRepository.save(job)` でジョブ状態を更新する
7. jobId を返す

#### エラーケース

| 条件 | エラー種類 |
|------|----------|
| ファイルサイズが制限を超過（Excel: 1MB, CSV: 100MB） | FileSizeLimitExceededError（バリデーションエラー） |
| 行数が制限を超過（Excel: 1,000行, CSV: 100,000行） | FileSizeLimitExceededError（バリデーションエラー） |
| フィールドマッピングが空 | FieldMappingEmptyError（バリデーションエラー） |
| インポート中のバリデーションエラー（errorHandling: STOP の場合） | CsvImportJob.fail（ビジネスルール違反） |
| アプリが存在しない | AppNotFoundError（リソース不在） |

---

### UC-R20: CSVインポート（追加更新）

#### 概要

CSVファイルからレコードを更新キーに基づいて追加・更新する。UPSERT モードでインポートジョブを実行する。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|------------|-----|---------|------------------|
| appId | AppId | 必須 | 有効なアプリID |
| fileName | string | 必須 | ファイル名 |
| fileContent | ArrayBuffer | 必須 | ファイルの内容 |
| fileSize | number | 必須 | Excel: 最大1MB、CSV: 最大100MB |
| encoding | CsvEncoding | 必須 | SHIFT_JIS, LATIN1, GBK, UTF8, UTF8_BOM のいずれか |
| delimiter | CsvDelimiter | 必須 | COMMA, SEMICOLON, TAB, SPACE のいずれか |
| errorHandling | ErrorHandling | 必須 | CONTINUE または STOP |
| fieldMappings | FieldMapping[] | 必須 | フィールドとCSV列の対応付け。1つ以上 |
| updateKey | FieldCode | 必須 | UPSERT 時にレコードを特定するための重複禁止フィールド |
| creatorId | UserId | 必須 | 実行ユーザーのID |

#### 出力DTO

| フィールド名 | 型 |
|------------|-----|
| jobId | CsvImportJobId |

#### 処理フロー

1. `CsvImportJob` エンティティを新規生成する（importMode: UPSERT、updateKey を設定）
2. `CsvImportJob.validateUpdateKey()` で更新キーの妥当性を検証する
3. `CsvImportJobRepository.save(job)` でジョブを永続化する
4. `CsvImportJob.start()` でジョブを開始する
5. `CsvImportService.processImport(job, fileContent)` でインポートを実行する
6. インポート完了後、`CsvImportJob.complete(processedCount, errorCount)` でジョブを完了にする
7. `CsvImportJobRepository.save(job)` でジョブ状態を更新する
8. jobId を返す

#### エラーケース

| 条件 | エラー種類 |
|------|----------|
| ファイルサイズが制限を超過 | FileSizeLimitExceededError（バリデーションエラー） |
| 行数が制限を超過 | FileSizeLimitExceededError（バリデーションエラー） |
| updateKey が未設定 | UpdateKeyRequiredError（バリデーションエラー） |
| フィールドマッピングが空 | FieldMappingEmptyError（バリデーションエラー） |
| インポート中のバリデーションエラー（errorHandling: STOP の場合） | CsvImportJob.fail（ビジネスルール違反） |
| アプリが存在しない | AppNotFoundError（リソース不在） |

---

### UC-R21: CSVエクスポート

#### 概要

レコードをCSVファイルとして非同期で書き出す。現在のビューの絞り込み条件に従い、指定されたフィールドをエクスポートする。出力ファイルは3日後に自動削除される。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|------------|-----|---------|------------------|
| appId | AppId | 必須 | 有効なアプリID |
| viewId | string | 任意 | ビューID。省略時は全レコード |
| encoding | CsvEncoding | 必須 | SHIFT_JIS, LATIN1, GBK, UTF8, UTF8_BOM のいずれか |
| delimiter | CsvDelimiter | 必須 | COMMA, SEMICOLON, TAB, SPACE のいずれか |
| includeHeader | boolean | 必須 | ヘッダ行を含めるか |
| exportFields | FieldCode[] | 必須 | エクスポート対象フィールド。1つ以上 |
| includeComments | boolean | 任意 | コメントを含めるか。デフォルト false |
| creatorId | UserId | 必須 | 実行ユーザーのID |

#### 出力DTO

| フィールド名 | 型 |
|------------|-----|
| jobId | CsvExportJobId |

#### 処理フロー

1. `CsvExportJob` エンティティを新規生成する（expiresAt は createdAt の3日後）
2. `CsvExportJob.start()` でジョブを開始する（exportFields が空の場合はエラー）
3. `CsvExportJobRepository.save(job)` でジョブを永続化する
4. 非同期で以下を実行する:
   - ビューの絞り込み条件に基づいて `RecordRepository.findByQuery()` でレコードを取得する
   - CSVフォーマットでファイルを生成する
   - `CsvExportJob.complete(fileName, fileSize)` でジョブを完了にする
   - `CsvExportJobRepository.save(job)` でジョブ状態を更新する
5. jobId を返す（非同期処理の完了を待たない）

#### エラーケース

| 条件 | エラー種類 |
|------|----------|
| exportFields が空 | NoFieldsSelectedError（バリデーションエラー） |
| アプリが存在しない | AppNotFoundError（リソース不在） |
| エクスポート処理中のエラー | CsvExportJob.fail（外部サービスエラー） |

---

### UC-R22: エクスポートファイルダウンロード

#### 概要

書き出し済みのCSVファイルをダウンロードする。ジョブが完了していること、および有効期限（3日）内であることを確認する。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|------------|-----|---------|------------------|
| jobId | CsvExportJobId | 必須 | 有効なエクスポートジョブID |

#### 出力DTO

| フィールド名 | 型 |
|------------|-----|
| fileName | string |
| fileContent | ArrayBuffer |
| contentType | string |

#### 処理フロー

1. `CsvExportJobRepository.findById(jobId)` でエクスポートジョブを取得する
2. ジョブが存在しない場合はエラーを返す
3. ジョブのステータスが COMPLETED でない場合はエラーを返す
4. `CsvExportJob.isExpired()` で有効期限を確認する
5. 有効期限切れの場合はエラーを返す
6. 出力ファイルの内容を取得して返す

#### エラーケース

| 条件 | エラー種類 |
|------|----------|
| ジョブが存在しない | ExportJobNotFoundError（リソース不在） |
| ジョブが未完了（PENDING, PROCESSING, FAILED） | ExportJobNotCompletedError（ビジネスルール違反） |
| 出力ファイルの有効期限切れ（3日超過） | ExportFileExpiredError（ビジネスルール違反） |

---

## カーソル

---

### UC-R23: カーソル作成

#### 概要

大量データ取得用のカーソルを作成する。offset上限（10,000件）を超えるレコードの取得に使用する。同一ドメインあたり最大10個まで。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|------------|-----|---------|------------------|
| appId | AppId | 必須 | 有効なアプリID |
| query | string | 任意 | クエリ条件 |
| fields | FieldCode[] | 任意 | 取得するフィールドコード。省略時は全フィールド |
| size | number | 任意 | 1回の取得件数。1〜500、デフォルト100 |

#### 出力DTO

| フィールド名 | 型 |
|------------|-----|
| cursorId | CursorId |
| totalCount | number |

#### 処理フロー

1. size が1〜500の範囲であることを検証する（省略時は100をデフォルトとする）
2. `RecordCursorRepository.countByDomain()` で現在のカーソル数を確認する
3. カーソルが10個に達している場合はエラーを返す
4. `RecordCursorRepository.create(appId, query, fields, size)` でカーソルを作成する
5. cursorId と totalCount を返す

#### エラーケース

| 条件 | エラー種類 |
|------|----------|
| 同一ドメインのカーソルが10個に達している | CursorLimitExceededError（ビジネスルール違反） |
| size が範囲外（1未満または500超） | InvalidCursorSizeError（バリデーションエラー） |
| カーソル作成が5分以内に完了しない | CursorCreationTimeoutError（外部サービスエラー） |
| クエリ構文が不正 | QuerySyntaxError（バリデーションエラー） |

---

### UC-R24: カーソルからレコード取得

#### 概要

カーソルを使用してレコードをバッチ取得する。カーソルの有効期限（最終アクセスから10分）内にアクセスする必要がある。全レコード取得完了後、カーソルは自動削除される。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|------------|-----|---------|------------------|
| cursorId | CursorId | 必須 | 有効なカーソルID |

#### 出力DTO

| フィールド名 | 型 |
|------------|-----|
| records | Record[] |
| next | boolean |

#### 処理フロー

1. `RecordCursorRepository.findById(cursorId)` でカーソルを取得する
2. カーソルが存在しない場合はエラーを返す
3. `RecordCursor.isExpired()` で有効期限を確認する
4. 有効期限切れの場合はエラーを返す
5. `RecordCursor.touch()` でアクセス時刻を更新する
6. `RecordCursor.advance()` でオフセットを進め、取得範囲を取得する
7. `RecordRepository.findByQuery()` で対象レコードを取得する
8. `RecordCursor.isCompleted()` で全件取得完了かを判定する
9. 全件取得完了の場合、`RecordCursorRepository.delete(cursorId)` でカーソルを自動削除する
10. レコード配列と next（次のバッチが存在するか）を返す

#### エラーケース

| 条件 | エラー種類 |
|------|----------|
| カーソルが存在しない | CursorNotFoundError（リソース不在） |
| カーソルの有効期限切れ（10分超過） | CursorExpiredError（ビジネスルール違反） |

---

### UC-R25: カーソル削除

#### 概要

不要になったカーソルを明示的に削除する。全件取得完了前にカーソルを破棄する場合に使用する。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|------------|-----|---------|------------------|
| cursorId | CursorId | 必須 | 有効なカーソルID |

#### 出力DTO

| フィールド名 | 型 |
|------------|-----|
| (なし) | void |

#### 処理フロー

1. `RecordCursorRepository.findById(cursorId)` でカーソルの存在を確認する
2. カーソルが存在しない場合はエラーを返す
3. `RecordCursorRepository.delete(cursorId)` でカーソルを削除する

#### エラーケース

| 条件 | エラー種類 |
|------|----------|
| カーソルが存在しない | CursorNotFoundError（リソース不在） |
