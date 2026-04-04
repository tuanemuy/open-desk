# Notification ユースケース定義

## 1. 通知一覧取得

### 概要

ユーザー宛の通知をフィルタ条件と既読/未読条件に基づいて取得する。ページネーション対応。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| filterId | NotificationFilterId | 任意 | 指定時はカスタムフィルタまたはビルトインフィルタの ID。省略時はビルトインフィルタ「自分宛」 |
| isRead | boolean | 任意 | 既読/未読フィルタ。省略時は全件 |
| offset | number | 任意 | 0以上の整数。デフォルト: 0 |
| limit | number | 任意 | 1以上の整数。デフォルト: 50 |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| notifications | Array<{ notificationId: NotificationId; type: NotificationType; sourceType: SourceType; sourceId: string; senderId: UserId | null; title: string; content: string; isRead: boolean; isReadLater: boolean; createdAt: Date }> |
| totalCount | number |

### 処理フロー

1. filterId が指定されている場合、`NotificationFilterRepository.findById(filterId)` でフィルタを取得する
2. フィルタが存在しない場合は FilterNotFoundError を返す
3. フィルタが存在する場合、`filter.isOwnedBy(operatorId)` で所有権を確認する。所有者でない場合は FilterAccessDeniedError を返す
4. フィルタ条件に応じて `NotificationRepository.findByRecipientId(operatorId, { isRead, notificationType, offset, limit })` で通知を取得する
5. カスタムフィルタの場合は、取得した通知に対して `NotificationFilterMatchingService.matches()` で追加フィルタリングを行う
6. 通知一覧と総件数を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 指定されたフィルタが存在しない | FilterNotFoundError |
| フィルタの所有者でない | FilterAccessDeniedError |

---

## 2. 通知詳細取得

### 概要

通知 ID で1件の通知を取得し、発生元の情報を合わせて返す。詳細表示モード用。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| notificationId | NotificationId | 必須 | 有効な NotificationId 形式であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| notificationId | NotificationId |
| type | NotificationType |
| sourceType | SourceType |
| sourceId | string |
| senderId | UserId | null |
| title | string |
| content | string |
| isRead | boolean |
| isReadLater | boolean |
| createdAt | Date |
| source | NotificationSource | null |

### 処理フロー

1. `NotificationRepository.findById(notificationId)` で通知を取得する
2. 通知が存在しない場合は NotificationNotFoundError を返す
3. `notification.isOwnedBy(operatorId)` で受信者であることを確認する
4. 受信者でない場合は NotificationAccessDeniedError を返す
5. `NotificationSourceResolver.resolve(notification.sourceType, notification.sourceId)` で発生元情報を取得する
6. 通知情報と発生元情報を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 通知が存在しない | NotificationNotFoundError |
| 操作者が通知の受信者でない | NotificationAccessDeniedError |

---

## 3. 通知既読化

### 概要

1件の通知を既読にする。通知の受信者のみが操作可能。既に既読の場合は何もしない（冪等）。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| notificationId | NotificationId | 必須 | 有効な NotificationId 形式であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| notificationId | NotificationId |
| isRead | boolean |

### 処理フロー

1. `NotificationRepository.findById(notificationId)` で通知を取得する
2. 通知が存在しない場合は NotificationNotFoundError を返す
3. `notification.isOwnedBy(operatorId)` で受信者であることを確認する
4. 受信者でない場合は NotificationAccessDeniedError を返す
5. `notification.markAsRead()` を呼び出す（冪等）
6. `NotificationRepository.save(notification)` で永続化する
7. 更新後の通知状態を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 通知が存在しない | NotificationNotFoundError |
| 操作者が通知の受信者でない | NotificationAccessDeniedError |

---

## 4. 通知未読化

### 概要

1件の既読通知を未読に戻す。通知の受信者のみが操作可能。既に未読の場合は何もしない（冪等）。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| notificationId | NotificationId | 必須 | 有効な NotificationId 形式であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| notificationId | NotificationId |
| isRead | boolean |

### 処理フロー

1. `NotificationRepository.findById(notificationId)` で通知を取得する
2. 通知が存在しない場合は NotificationNotFoundError を返す
3. `notification.isOwnedBy(operatorId)` で受信者であることを確認する
4. 受信者でない場合は NotificationAccessDeniedError を返す
5. `notification.markAsUnread()` を呼び出す（冪等）
6. `NotificationRepository.save(notification)` で永続化する
7. 更新後の通知状態を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 通知が存在しない | NotificationNotFoundError |
| 操作者が通知の受信者でない | NotificationAccessDeniedError |

---

## 5. 通知一括既読化

### 概要

指定した複数の通知、またはフィルタ条件に一致する全未読通知を一括既読にする。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| notificationIds | NotificationId[] | 任意 | 指定時は対象の通知 ID リスト。省略時は全未読を既読にする |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| readCount | number |

### 処理フロー

1. `NotificationRepository.markAsReadBatch(operatorId, notificationIds)` で一括既読を実行する
2. notificationIds が指定されている場合、指定された通知のうち operatorId が受信者である通知のみ既読にする
3. notificationIds が省略されている場合、operatorId 宛の全未読通知を既読にする
4. 既読にした件数を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| （基本的にエラーは発生しない。存在しない通知IDは無視される） | - |

---

## 6. あとで読むトグル

### 概要

1件の通知の「あとで読む」フラグをトグルする。通知の受信者のみが操作可能。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| notificationId | NotificationId | 必須 | 有効な NotificationId 形式であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| notificationId | NotificationId |
| isReadLater | boolean |

### 処理フロー

1. `NotificationRepository.findById(notificationId)` で通知を取得する
2. 通知が存在しない場合は NotificationNotFoundError を返す
3. `notification.isOwnedBy(operatorId)` で受信者であることを確認する
4. 受信者でない場合は NotificationAccessDeniedError を返す
5. `notification.toggleReadLater()` を呼び出す
6. `NotificationRepository.save(notification)` で永続化する
7. 更新後の通知状態を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 通知が存在しない | NotificationNotFoundError |
| 操作者が通知の受信者でない | NotificationAccessDeniedError |

---

## 7. 未読通知件数取得

### 概要

ユーザーの未読通知件数を取得する。ヘッダーのバッジ表示に使用。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| unreadCount | number |

### 処理フロー

1. `NotificationRepository.countUnread(operatorId)` で未読通知件数を取得する
2. 未読件数を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| （基本的にエラーは発生しない） | - |

---

## 8. メンション通知生成

### 概要

コメントまたはスレッド投稿で @メンションされたユーザーに通知を生成する。自分自身への通知は除外する。メール通知・デスクトップ通知も連動して送信する。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| senderId | UserId | 必須 | 有効な UserId 形式であること |
| sourceType | SourceType | 必須 | COMMENT または THREAD |
| sourceId | string | 必須 | 空文字でないこと |
| mentionedUserIds | UserId[] | 必須 | 1件以上 |
| title | string | 必須 | 空文字でないこと。最大256文字 |
| content | string | 必須 | 最大1024文字 |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| notifications | Array<{ notificationId: NotificationId; recipientId: UserId }> |

### 処理フロー

1. `NotificationGenerationService.generateMentionNotifications({ senderId, sourceType, sourceId, mentionedUserIds, title, content })` で通知を生成する（senderId の自己除外はドメインサービス内部で処理）
2. `NotificationRepository.saveBatch(notifications)` で一括保存する
3. 各受信者の `NotificationPreferenceRepository.findByUserId(recipientId)` で通知設定を取得する
4. メール通知が有効かつ対象範囲に含まれる場合、`EmailNotificationSender.sendBatch()` でメール通知を送信する
5. デスクトップ通知が有効な場合、`DesktopNotificationPublisher.publish()` でデスクトップ通知を送信する
6. 生成された通知情報を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| メール通知の送信に失敗 | 外部サービスエラー（通知生成自体は成功とする） |
| デスクトップ通知の送信に失敗 | 外部サービスエラー（通知生成自体は成功とする） |

---

## 9. アプリ条件通知生成

### 概要

アプリの条件通知設定に基づき、レコード操作時（レコード追加・編集・コメント追加・ステータス変更・ファイルインポート）に該当ユーザーに通知を生成する。同一イベントでメンション通知の対象となるユーザーは除外する。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| senderId | UserId | 必須 | 有効な UserId 形式であること |
| sourceType | SourceType | 必須 | RECORD または COMMENT |
| sourceId | string | 必須 | 空文字でないこと |
| recipientIds | UserId[] | 必須 | App ドメインの条件通知設定から決定された通知対象ユーザー |
| mentionedUserIds | UserId[] | 任意 | メンション対象ユーザー（重複排除に使用） |
| title | string | 必須 | 空文字でないこと。最大256文字 |
| content | string | 必須 | 最大1024文字 |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| notifications | Array<{ notificationId: NotificationId; recipientId: UserId }> |

### 処理フロー

1. `NotificationGenerationService.generateAppConditionNotifications({ senderId, sourceType, sourceId, recipientIds, mentionedUserIds, title, content })` で通知を生成する（senderId の自己除外・mentionedUserIds の重複排除はドメインサービス内部で処理）
2. `NotificationRepository.saveBatch(notifications)` で一括保存する
3. 各受信者の通知設定に応じてメール通知・デスクトップ通知を送信する
4. 生成された通知情報を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| メール通知の送信に失敗 | 外部サービスエラー（通知生成自体は成功とする） |
| デスクトップ通知の送信に失敗 | 外部サービスエラー（通知生成自体は成功とする） |

---

## 10. レコード条件通知生成

### 概要

レコードの条件通知設定に基づき、条件に一致するレコード変更時に通知を生成する。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| senderId | UserId | 必須 | 有効な UserId 形式であること |
| sourceType | SourceType | 必須 | RECORD |
| sourceId | string | 必須 | 空文字でないこと |
| recipientIds | UserId[] | 必須 | 条件通知設定から決定された通知対象ユーザー |
| mentionedUserIds | UserId[] | 任意 | メンション対象ユーザー（重複排除に使用） |
| title | string | 必須 | 空文字でないこと。最大256文字 |
| content | string | 必須 | 最大1024文字 |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| notifications | Array<{ notificationId: NotificationId; recipientId: UserId }> |

### 処理フロー

1. `NotificationGenerationService.generateRecordConditionNotifications({ senderId, sourceType, sourceId, recipientIds, mentionedUserIds, title, content })` で通知を生成する（senderId の自己除外・mentionedUserIds の重複排除はドメインサービス内部で処理）
2. `NotificationRepository.saveBatch(notifications)` で一括保存する
3. 各受信者の通知設定に応じてメール通知・デスクトップ通知を送信する
4. 生成された通知情報を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| メール通知の送信に失敗 | 外部サービスエラー（通知生成自体は成功とする） |
| デスクトップ通知の送信に失敗 | 外部サービスエラー（通知生成自体は成功とする） |

---

## 11. リマインダー通知生成

### 概要

リマインダー設定に基づき、指定日時に該当ユーザーにリマインダー通知を生成する。senderId は null（システム自動生成）。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| sourceType | SourceType | 必須 | RECORD |
| sourceId | string | 必須 | 空文字でないこと |
| recipientIds | UserId[] | 必須 | リマインダー設定から決定された通知対象ユーザー |
| title | string | 必須 | 空文字でないこと。最大256文字 |
| content | string | 必須 | 最大1024文字 |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| notifications | Array<{ notificationId: NotificationId; recipientId: UserId }> |

### 処理フロー

1. `NotificationGenerationService.generateReminderNotifications({ sourceType, sourceId, recipientIds, title, content })` で通知を生成する（senderId は null）
2. `NotificationRepository.saveBatch(notifications)` で一括保存する
3. 各受信者の通知設定に応じてメール通知・デスクトップ通知を送信する
4. 生成された通知情報を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| メール通知の送信に失敗 | 外部サービスエラー（通知生成自体は成功とする） |
| デスクトップ通知の送信に失敗 | 外部サービスエラー（通知生成自体は成功とする） |

---

## 12. スペース通知生成

### 概要

スペースのスレッド投稿・返信時にスペースメンバー（フォロワー）に通知を生成する。自分自身への通知は除外する。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| senderId | UserId | 必須 | 有効な UserId 形式であること |
| sourceType | SourceType | 必須 | THREAD |
| sourceId | string | 必須 | 空文字でないこと |
| recipientIds | UserId[] | 必須 | スペースメンバー（スレッドフォロワー）から決定された通知対象ユーザー |
| mentionedUserIds | UserId[] | 任意 | メンション対象ユーザー（重複排除に使用） |
| title | string | 必須 | 空文字でないこと。最大256文字 |
| content | string | 必須 | 最大1024文字 |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| notifications | Array<{ notificationId: NotificationId; recipientId: UserId }> |

### 処理フロー

1. `NotificationGenerationService.generateSpaceNotifications({ senderId, sourceType, sourceId, recipientIds, mentionedUserIds, title, content })` で通知を生成する（senderId の自己除外・mentionedUserIds の重複排除はドメインサービス内部で処理）
2. `NotificationRepository.saveBatch(notifications)` で一括保存する
3. 各受信者の通知設定に応じてメール通知・デスクトップ通知を送信する
4. 生成された通知情報を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| メール通知の送信に失敗 | 外部サービスエラー（通知生成自体は成功とする） |
| デスクトップ通知の送信に失敗 | 外部サービスエラー（通知生成自体は成功とする） |

---

## 13. カスタムフィルタ作成

### 概要

ユーザーが通知フィルタを新規作成する。フィルタ名・通知種別・場所条件・送信者条件を設定。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| name | string | 必須 | 1文字以上100文字以下 |
| notificationType | FilterNotificationType | 必須 | "ALL" または "MENTION" |
| locationMode | LocationFilterMode | 必須 | "ALL", "INCLUDE", または "EXCLUDE" |
| locationConditions | LocationCondition[] | 必須 | locationMode が INCLUDE/EXCLUDE の場合は1件以上。ALL の場合は空配列 |
| senderConditions | SenderCondition[] | 必須 | 空配列許容（空の場合は全送信者が対象） |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| filterId | NotificationFilterId |
| name | string |
| notificationType | FilterNotificationType |
| locationMode | LocationFilterMode |
| locationConditions | LocationCondition[] |
| senderConditions | SenderCondition[] |
| createdAt | Date |

### 処理フロー

1. 新しい NotificationFilter エンティティを生成する（userId=operatorId, isBuiltIn=false）
2. `filter.rename(FilterName(name))` でフィルタ名を設定する
3. `filter.changeNotificationType(notificationType)` で通知種別を設定する
4. `filter.updateLocationConditions(locationMode, locationConditions)` で場所条件を設定する
5. `filter.updateSenderConditions(senderConditions)` で送信者条件を設定する
6. `NotificationFilterRepository.save(filter)` で永続化する
7. 作成されたフィルタ情報を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| フィルタ名が空文字または100文字超過 | InvalidFilterNameError（ドメインモデルから発生） |
| locationMode が INCLUDE/EXCLUDE で locationConditions が空 | EmptyLocationConditionsError（ドメインモデルから発生） |

---

## 14. カスタムフィルタ更新

### 概要

既存のカスタムフィルタの設定を変更する。フィルタの所有者のみが操作可能。ビルトインフィルタは更新不可。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| filterId | NotificationFilterId | 必須 | 有効な NotificationFilterId 形式であること |
| name | string | 任意 | 指定時は1文字以上100文字以下 |
| notificationType | FilterNotificationType | 任意 | "ALL" または "MENTION" |
| locationMode | LocationFilterMode | 任意 | "ALL", "INCLUDE", または "EXCLUDE" |
| locationConditions | LocationCondition[] | 任意 | locationMode とセットで指定 |
| senderConditions | SenderCondition[] | 任意 | 指定時は新しい送信者条件（空配列許容） |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| filterId | NotificationFilterId |
| name | string |
| notificationType | FilterNotificationType |
| locationMode | LocationFilterMode |
| locationConditions | LocationCondition[] |
| senderConditions | SenderCondition[] |
| updatedAt | Date |

### 処理フロー

1. `NotificationFilterRepository.findById(filterId)` でフィルタを取得する
2. フィルタが存在しない場合は FilterNotFoundError を返す
3. `filter.isOwnedBy(operatorId)` で所有権を確認する。所有者でない場合は FilterAccessDeniedError を返す
4. フィルタがビルトイン（isBuiltIn=true）の場合は CannotModifyBuiltInFilterError を返す
5. 指定されたフィールドに対して各エンティティメソッドを呼び出す:
   - name が指定: `filter.rename(FilterName(name))`
   - notificationType が指定: `filter.changeNotificationType(notificationType)`
   - locationMode が指定: `filter.updateLocationConditions(locationMode, locationConditions)`
   - senderConditions が指定: `filter.updateSenderConditions(senderConditions)`
6. `NotificationFilterRepository.save(filter)` で永続化する
7. 更新後のフィルタ情報を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| フィルタが存在しない | FilterNotFoundError |
| 操作者がフィルタの所有者でない | FilterAccessDeniedError |
| ビルトインフィルタの更新 | CannotModifyBuiltInFilterError |
| フィルタ名が空文字または100文字超過 | InvalidFilterNameError（ドメインモデルから発生） |
| locationMode が INCLUDE/EXCLUDE で locationConditions が空 | EmptyLocationConditionsError（ドメインモデルから発生） |

---

## 15. カスタムフィルタ削除

### 概要

カスタムフィルタを削除する。ビルトインフィルタは削除不可。フィルタの所有者のみが操作可能。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| filterId | NotificationFilterId | 必須 | 有効な NotificationFilterId 形式であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| (なし) | void |

### 処理フロー

1. `NotificationFilterRepository.findById(filterId)` でフィルタを取得する
2. フィルタが存在しない場合は FilterNotFoundError を返す
3. `filter.isOwnedBy(operatorId)` で所有権を確認する。所有者でない場合は FilterAccessDeniedError を返す
4. フィルタがビルトイン（isBuiltIn=true）の場合は CannotDeleteBuiltInFilterError を返す
5. `NotificationFilterRepository.delete(filterId)` でフィルタを削除する

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| フィルタが存在しない | FilterNotFoundError |
| 操作者がフィルタの所有者でない | FilterAccessDeniedError |
| ビルトインフィルタの削除 | CannotDeleteBuiltInFilterError |

---

## 16. フィルタ一覧取得

### 概要

ユーザーのビルトインフィルタとカスタムフィルタの一覧を取得する。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| builtInFilters | Array<{ filterId: NotificationFilterId; name: string; builtInType: BuiltInFilterType }> |
| customFilters | Array<{ filterId: NotificationFilterId; name: string; notificationType: FilterNotificationType; locationMode: LocationFilterMode; createdAt: Date }> |

### 処理フロー

1. ビルトインフィルタ（「自分宛」「あとで読む」「すべて」）を構成する
2. `NotificationFilterRepository.findByUserId(operatorId)` でカスタムフィルタ一覧を取得する
3. ビルトインフィルタとカスタムフィルタを出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| （基本的にエラーは発生しない） | - |

---

## 17. 通知設定取得

### 概要

ユーザーのメール通知・デスクトップ通知の現在の設定を取得する。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| emailEnabled | boolean |
| emailScope | EmailNotificationScope |
| emailFormat | EmailNotificationFormat |
| desktopEnabled | boolean |

### 処理フロー

1. `NotificationPreferenceRepository.findByUserId(operatorId)` で通知設定を取得する
2. 通知設定が存在しない場合は PreferenceNotFoundError を返す
3. 通知設定を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 通知設定が存在しない（通常発生しない） | PreferenceNotFoundError |

---

## 18. メール通知設定変更

### 概要

メール通知の有効/無効、対象範囲、形式を変更する。即時反映（auto-save）。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| emailEnabled | boolean | 任意 | - |
| emailScope | EmailNotificationScope | 任意 | "MENTION_ONLY" または "ALL"。emailEnabled が true の場合のみ有効 |
| emailFormat | EmailNotificationFormat | 任意 | "HTML" または "TEXT"。emailEnabled が true の場合のみ有効 |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| emailEnabled | boolean |
| emailScope | EmailNotificationScope |
| emailFormat | EmailNotificationFormat |
| updatedAt | Date |

### 処理フロー

1. `NotificationPreferenceRepository.findByUserId(operatorId)` で通知設定を取得する
2. 通知設定が存在しない場合は PreferenceNotFoundError を返す
3. `preference.isOwnedBy(operatorId)` で所有権を確認する
4. 指定されたフィールドに対して各エンティティメソッドを呼び出す:
   - emailEnabled が指定: `preference.setEmailEnabled(emailEnabled)`
   - emailScope が指定: `preference.setEmailScope(emailScope)`
   - emailFormat が指定: `preference.setEmailFormat(emailFormat)`
5. `NotificationPreferenceRepository.save(preference)` で永続化する
6. 更新後の通知設定を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 通知設定が存在しない | PreferenceNotFoundError |
| emailEnabled が false の状態で emailScope を変更 | EmailNotEnabledError（ドメインモデルから発生） |
| emailEnabled が false の状態で emailFormat を変更 | EmailNotEnabledError（ドメインモデルから発生） |

---

## 19. デスクトップ通知設定変更

### 概要

デスクトップ通知の有効/無効を変更する。即時反映（auto-save）。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| desktopEnabled | boolean | 必須 | - |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| desktopEnabled | boolean |
| updatedAt | Date |

### 処理フロー

1. `NotificationPreferenceRepository.findByUserId(operatorId)` で通知設定を取得する
2. 通知設定が存在しない場合は PreferenceNotFoundError を返す
3. `preference.isOwnedBy(operatorId)` で所有権を確認する
4. `preference.setDesktopEnabled(desktopEnabled)` を呼び出す
5. `NotificationPreferenceRepository.save(preference)` で永続化する
6. 更新後の通知設定を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 通知設定が存在しない | PreferenceNotFoundError |

---

## 20. 通知設定初期化

### 概要

ユーザーアカウント作成時にデフォルト値で通知設定を生成する。ビルトインフィルタも同時に生成する。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| userId | UserId | 必須 | 有効な UserId 形式であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| emailEnabled | boolean |
| emailScope | EmailNotificationScope |
| emailFormat | EmailNotificationFormat |
| desktopEnabled | boolean |

### 処理フロー

1. `NotificationPreferenceRepository.findByUserId(userId)` で既存の通知設定を確認する
2. 既に存在する場合は既存設定を返す（冪等性の保証）
3. 新しい NotificationPreference エンティティをデフォルト値で生成する:
   - emailEnabled: true
   - emailScope: MENTION_ONLY
   - emailFormat: HTML
   - desktopEnabled: false
4. `NotificationPreferenceRepository.save(preference)` で永続化する
5. ビルトインフィルタ（「自分宛」「あとで読む」「すべて」）を生成して `NotificationFilterRepository.save()` で保存する
6. 初期化された通知設定を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| （基本的にエラーは発生しない。冪等性が保証される） | - |

---

## 21. 期限切れ通知の一括削除

### 概要

保持期限を超過した古い通知を一括削除するバッチ処理。スケジューラーにより定期的に実行される。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| retentionDays | number | 必須 | 1以上の整数。保持日数 |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| deletedCount | number |

### 処理フロー

1. 現在日時から retentionDays を減算して削除基準日時（before）を算出する
2. `NotificationRepository.deleteExpired(before)` で期限切れ通知を一括削除する
3. 削除された件数を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| retentionDays が0以下 | バリデーションエラー |
| データベースエラー | 外部サービスエラー |
