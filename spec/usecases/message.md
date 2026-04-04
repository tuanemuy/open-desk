# Message ユースケース定義

## 1. メッセージスレッド取得/作成

### 概要

2人のユーザー間のメッセージスレッドを取得する。存在しない場合は新規作成する。ゲストユーザーとのメッセージは不可。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| counterpartId | UserId | 必須 | 有効な UserId 形式であること、operatorId と異なること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| threadId | MessageThreadId |
| participantIds | [UserId, UserId] |
| lastMessageAt | Date \| null |
| createdAt | Date |

### 処理フロー

1. ピープル機能とメッセージ機能が有効であることをシステム設定で検証する。無効の場合は MessageFeatureDisabledError を返す
2. Identity ドメインのポートで counterpartId のユーザーがゲストユーザーでないことを検証する
3. ゲストユーザーの場合は GuestUserMessageError を返す
4. `MessageThreadService.getOrCreateThread(operatorId, counterpartId)` でスレッドを取得または作成する
5. メッセージスレッドを出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| メッセージ機能が無効 | MessageFeatureDisabledError |
| 相手ユーザーがゲストユーザー | GuestUserMessageError |
| operatorId と counterpartId が同一 | SameParticipantError（ドメインサービスから発生） |

---

## 2. メッセージスレッド一覧取得

### 概要

自分が参加しているメッセージスレッド一覧を最終メッセージ日時の新しい順で取得する。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| offset | number | 必須 | 0 以上の整数であること |
| limit | number | 必須 | 1 以上 100 以下の整数であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| threads | { threadId: MessageThreadId; participantIds: [UserId, UserId]; lastMessageAt: Date \| null; createdAt: Date }[] |
| totalCount | number |
| offset | number |
| limit | number |

### 処理フロー

1. ピープル機能とメッセージ機能が有効であることをシステム設定で検証する。無効の場合は MessageFeatureDisabledError を返す
2. `MessageThreadRepository.findByParticipantUserId({ userId: operatorId, offset, limit })` でスレッド一覧を取得する
3. スレッド一覧と総件数を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| メッセージ機能が無効 | MessageFeatureDisabledError |
| offset が負の値 | バリデーションエラー |
| limit が範囲外（1未満または100超過） | バリデーションエラー |

---

## 3. メッセージ送信

### 概要

メッセージスレッドにリッチテキストのダイレクトメッセージを送信する。スレッド参加者のみ実行可能。アプリ埋め込みは不可。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| senderId | UserId | 必須 | 有効な UserId 形式であること |
| threadId | MessageThreadId | 必須 | 有効な MessageThreadId 形式であること |
| content | RichTextHtml | 必須 | 空文字でないこと、サニタイズ済み HTML であること、アプリ埋め込み要素を含まないこと |
| attachmentFileKeys | FileKey[] | 必須 | 各要素が有効な FileKey 形式であること（空配列許容） |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| messageId | DirectMessageId |
| threadId | MessageThreadId |
| senderId | UserId |
| content | RichTextHtml |
| attachmentFileKeys | FileKey[] |
| createdAt | Date |

### 処理フロー

1. ピープル機能とメッセージ機能が有効であることをシステム設定で検証する。無効の場合は MessageFeatureDisabledError を返す
2. `MessageThreadRepository.findById(threadId)` でスレッドを取得する
3. スレッドが存在しない場合は ThreadNotFoundError を返す
4. `MessageThread.isParticipant(senderId)` で送信者がスレッドの参加者であることを検証する。参加者でない場合は NotParticipantError を返す
5. content が空文字でないことを検証する。空の場合は EmptyMessageContentError を返す
6. content にアプリ埋め込み要素（iframe、opendesk-app タグ等）が含まれていないことを検証する
7. DirectMessage エンティティを新規作成する（messageId は新規生成、threadId, senderId, content, attachmentFileKeys, createdAt を設定）
8. `DirectMessageRepository.save()` で永続化する
9. `MessageThread.updateLastMessageAt(createdAt)` でスレッドの最終メッセージ日時を更新する
10. `MessageThreadRepository.save()` でスレッドを永続化する
11. `MessageThread.getCounterpartId(senderId)` で相手ユーザーIDを取得し、Notification ドメインのポートを通じて通知を送信する
12. 作成されたメッセージを出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| メッセージ機能が無効 | MessageFeatureDisabledError |
| スレッドが存在しない | ThreadNotFoundError |
| 送信者がスレッドの参加者でない | NotParticipantError |
| content が空文字 | EmptyMessageContentError |
| content にアプリ埋め込み要素が含まれる | バリデーションエラー |

---

## 4. メッセージ履歴取得

### 概要

メッセージスレッド内のメッセージ一覧をページネーション付きで取得する。スレッド参加者のみ閲覧可能。新しい順に返す。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| threadId | MessageThreadId | 必須 | 有効な MessageThreadId 形式であること |
| offset | number | 必須 | 0 以上の整数であること |
| limit | number | 必須 | 1 以上 100 以下の整数であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| messages | { messageId: DirectMessageId; threadId: MessageThreadId; senderId: UserId; content: RichTextHtml; attachmentFileKeys: FileKey[]; createdAt: Date }[] |
| totalCount | number |
| offset | number |
| limit | number |

### 処理フロー

1. ピープル機能とメッセージ機能が有効であることをシステム設定で検証する。無効の場合は MessageFeatureDisabledError を返す
2. `MessageThreadRepository.findById(threadId)` でスレッドを取得する
3. スレッドが存在しない場合は ThreadNotFoundError を返す
4. `MessageThread.isParticipant(operatorId)` で操作者がスレッドの参加者であることを検証する。参加者でない場合は NotParticipantError を返す
5. `DirectMessageRepository.findByThreadId({ threadId, offset, limit })` でメッセージ一覧を取得する
6. メッセージ一覧と総件数を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| メッセージ機能が無効 | MessageFeatureDisabledError |
| スレッドが存在しない | ThreadNotFoundError |
| 操作者がスレッドの参加者でない | NotParticipantError |
| offset が負の値 | バリデーションエラー |
| limit が範囲外（1未満または100超過） | バリデーションエラー |
