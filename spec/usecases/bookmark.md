# Bookmark ユースケース定義

## 1. ブックマーク作成

### 概要

現在のページ URL と名前（ページタイトルから自動入力）を指定してブックマークを作成する。カテゴリは URL パターンから BookmarkCategorizationService により自動判定される。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| userId | UserId | 必須 | 有効な UserId 形式であること |
| name | string | 必須 | 空文字でないこと |
| url | string | 必須 | 空文字でないこと |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| bookmarkId | BookmarkId |
| userId | UserId |
| name | string |
| url | string |
| category | BookmarkCategory |
| appId | AppId \| null |
| createdAt | Date |

### 処理フロー

1. name が空文字でないことを検証する。空の場合は EmptyBookmarkNameError を返す
2. url が空文字でないことを検証する。空の場合は EmptyBookmarkUrlError を返す
3. `BookmarkCategorizationService.categorize(url)` で URL パターンからカテゴリと appId を判定する
4. Bookmark エンティティを新規作成する（bookmarkId は新規生成、userId, name, url, category, appId, createdAt を設定）
5. `BookmarkRepository.save()` で永続化する
6. 作成されたブックマークを出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| name が空文字 | EmptyBookmarkNameError |
| url が空文字 | EmptyBookmarkUrlError |

---

## 2. ブックマーク編集

### 概要

既存ブックマークの名前や URL を変更する。URL 変更時はカテゴリが再判定される。所有者のみ編集可能。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| bookmarkId | BookmarkId | 必須 | 有効な BookmarkId 形式であること |
| name | string | 任意 | 指定時は空文字でないこと |
| url | string | 任意 | 指定時は空文字でないこと |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| bookmarkId | BookmarkId |
| userId | UserId |
| name | string |
| url | string |
| category | BookmarkCategory |
| appId | AppId \| null |
| createdAt | Date |

### 処理フロー

1. `BookmarkRepository.findById(bookmarkId)` でブックマークを取得する
2. ブックマークが存在しない場合は BookmarkNotFoundError を返す
3. `Bookmark.isOwnedBy(operatorId)` で所有者であることを検証する。所有者でない場合は BookmarkNotOwnedError を返す
4. name が指定されている場合、`Bookmark.updateName(name)` を呼び出す
5. url が指定されている場合、`Bookmark.updateUrl(url)` を呼び出す（内部でカテゴリと appId が再判定される）
6. `BookmarkRepository.save()` で永続化する
7. 更新後のブックマークを出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| ブックマークが存在しない | BookmarkNotFoundError |
| 操作者が所有者でない | BookmarkNotOwnedError |
| name が空文字 | EmptyBookmarkNameError（ドメインモデルから発生） |
| url が空文字 | EmptyBookmarkUrlError（ドメインモデルから発生） |

---

## 3. ブックマーク削除

### 概要

ブックマークを削除する。所有者のみ削除可能。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| bookmarkId | BookmarkId | 必須 | 有効な BookmarkId 形式であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| bookmarkId | BookmarkId |

### 処理フロー

1. `BookmarkRepository.findById(bookmarkId)` でブックマークを取得する
2. ブックマークが存在しない場合は BookmarkNotFoundError を返す
3. `Bookmark.isOwnedBy(operatorId)` で所有者であることを検証する。所有者でない場合は BookmarkNotOwnedError を返す
4. `BookmarkRepository.delete(bookmarkId)` でブックマークを削除する
5. 削除したブックマークの bookmarkId を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| ブックマークが存在しない | BookmarkNotFoundError |
| 操作者が所有者でない | BookmarkNotOwnedError |

---

## 4. ブックマーク一覧取得（カテゴリ別）

### 概要

ユーザーのブックマークを3カテゴリ（アプリ・検索結果・その他）に分類して取得する。APP カテゴリはアプリ単位でグルーピングされる。各カテゴリ内は作成日時の昇順（追加順）で返す。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| userId | UserId | 必須 | 有効な UserId 形式であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| app | { bookmarkId: BookmarkId; name: string; url: string; appId: AppId; createdAt: Date }[] |
| search | { bookmarkId: BookmarkId; name: string; url: string; createdAt: Date }[] |
| other | { bookmarkId: BookmarkId; name: string; url: string; createdAt: Date }[] |

### 処理フロー

1. `BookmarkRepository.findAllGroupedByCategory(userId)` でカテゴリ別にグルーピングされたブックマーク一覧を取得する
2. カテゴリ別のブックマーク一覧を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| （このユースケースではエラーケースは発生しない。ブックマークが0件の場合は各カテゴリが空配列で返る） | ― |
