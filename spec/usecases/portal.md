# Portal ユースケース定義

## 1. お知らせ掲示板編集

### 概要

お知らせ掲示板のタイトルと本文を更新する。システム管理者または cybozu.com 共通管理者のみ実行可能。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| title | string | 必須 | 空文字でないこと |
| body | RichTextHtml | 必須 | サニタイズ済み HTML 文字列であること（空文字許容） |
| attachmentFileKeys | FileKey[] | 必須 | 各要素が有効な FileKey 形式であること（空配列許容） |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| announcementId | AnnouncementId |
| title | string |
| body | RichTextHtml |
| attachmentFileKeys | FileKey[] |
| lastUpdatedBy | UserId |
| updatedAt | Date |

### 処理フロー

1. operatorId がシステム管理者または cybozu.com 共通管理者であることを AccessControl ドメインのポートを通じて検証する
2. 権限がない場合は AnnouncementPermissionError を返す
3. `PortalAnnouncementRepository.findLatest()` で現在のお知らせ掲示板を取得する
4. 存在しない場合はデフォルト値（タイトル: 「お知らせ」）で新規の PortalAnnouncement を作成する
5. 添付ファイルのサイズを File ドメインのポートで検証し、1ファイルあたり1GBを超える場合は AttachmentTooLargeError を返す
6. `PortalAnnouncement.update({ title, body, attachmentFileKeys, updatedBy: operatorId })` を呼び出す
7. `PortalAnnouncementRepository.save()` で永続化する
8. 更新後のお知らせ掲示板を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 操作者がシステム管理者でも cybozu.com 共通管理者でもない | AnnouncementPermissionError |
| タイトルが空文字 | EmptyTitleError（ドメインモデルから発生） |
| 添付ファイルが1GBを超える | AttachmentTooLargeError |

---

## 2. ポータル表示取得

### 概要

ポータル画面に表示するお知らせ掲示板の内容と各ウィジェットのデータを集約して取得する。認証済みユーザーであれば誰でも実行可能。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| spaceWidgetDisplayMode | SpaceWidgetDisplayMode | 任意 | 未指定時はデフォルト値 "joined" |
| appWidgetDisplayMode | AppWidgetDisplayMode | 任意 | 未指定時はデフォルト値 "all" |
| notificationFilterMode | NotificationFilterMode | 任意 | 未指定時はデフォルト値 "all" |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| announcement | { announcementId: AnnouncementId; title: string; body: RichTextHtml; attachmentFileKeys: FileKey[]; lastUpdatedBy: UserId; updatedAt: Date } \| null |
| notifications | { items: NotificationItem[]; totalCount: number } |
| spaces | { items: SpaceItem[]; totalCount: number } |
| apps | { items: AppItem[]; totalCount: number } |

### 処理フロー

1. `PortalAnnouncementRepository.findLatest()` でお知らせ掲示板を取得する（存在しない場合は null）
2. Notification ドメインのポートから、operatorId と notificationFilterMode に基づいて通知ウィジェットのデータを取得する
3. Space ドメインのポートから、operatorId と spaceWidgetDisplayMode に基づいてスペースウィジェットのデータを取得する
4. App ドメインのポートから、operatorId と appWidgetDisplayMode に基づいてアプリウィジェットのデータを取得する
5. 集約した結果をポータル表示データとして返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| Notification ドメインからのデータ取得に失敗 | 外部サービスエラー（ウィジェットは空で返却し、部分的に表示可能とする） |
| Space ドメインからのデータ取得に失敗 | 外部サービスエラー（ウィジェットは空で返却し、部分的に表示可能とする） |
| App ドメインからのデータ取得に失敗 | 外部サービスエラー（ウィジェットは空で返却し、部分的に表示可能とする） |
