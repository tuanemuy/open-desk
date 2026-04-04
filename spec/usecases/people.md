# People ユースケース定義

## 1. プロフィール取得

### 概要

指定ユーザーのプロフィール情報（Identity ドメインの基本情報 + People ドメインの拡張情報）を統合して取得する。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| targetUserId | UserId | 必須 | 有効な UserId 形式であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| userId | UserId |
| displayName | string |
| email | string |
| organization | string |
| coverImageFileKey | FileKey \| null |
| comment | string |
| updatedAt | Date |

### 処理フロー

1. Identity ドメインのポートから targetUserId に対応するユーザー基本情報を取得する
2. ユーザーが存在しない場合はエラーを返す
3. `ProfileRepository.findByUserId(targetUserId)` でプロフィール拡張情報を取得する
4. プロフィールが存在しない場合はデフォルト値（カバー画像なし、コメント空文字）で新規作成し、`ProfileRepository.save()` で永続化する
5. Identity の基本情報と People の拡張情報を統合して出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 対象ユーザーが Identity ドメインに存在しない | UserNotFoundError |

---

## 2. カバー画像設定

### 概要

自分のプロフィールにカバー画像を設定する。最大5MB。既存のカバー画像がある場合は置き換えられる。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| fileKey | FileKey | 必須 | 有効な FileKey 形式であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| userId | UserId |
| coverImageFileKey | FileKey |
| updatedAt | Date |

### 処理フロー

1. `ProfileRepository.findByUserId(operatorId)` でプロフィールを取得する
2. プロフィールが存在しない場合は ProfileNotFoundError を返す
3. File ドメインのポートで fileKey に対応するファイルのサイズを取得し、5MBを超える場合は CoverImageTooLargeError を返す
4. `Profile.setCoverImage(fileKey)` を呼び出す
5. `ProfileRepository.save()` で永続化する
6. 更新後のプロフィールを出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| プロフィールが存在しない | ProfileNotFoundError |
| ファイルサイズが5MBを超える | CoverImageTooLargeError |
| ファイルが File ドメインに存在しない | FileNotFoundError |

---

## 3. カバー画像削除

### 概要

自分のプロフィールからカバー画像を削除する。カバー画像が設定されていない場合は何もしない（冪等）。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| userId | UserId |
| coverImageFileKey | null |
| updatedAt | Date |

### 処理フロー

1. `ProfileRepository.findByUserId(operatorId)` でプロフィールを取得する
2. プロフィールが存在しない場合は ProfileNotFoundError を返す
3. `Profile.removeCoverImage()` を呼び出す
4. `ProfileRepository.save()` で永続化する
5. 更新後のプロフィールを出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| プロフィールが存在しない | ProfileNotFoundError |

---

## 4. コメント更新

### 概要

自分のプロフィールのコメント欄を更新する。空文字でクリア可能。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| comment | string | 必須 | 空文字許容（クリア可能） |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| userId | UserId |
| comment | string |
| updatedAt | Date |

### 処理フロー

1. `ProfileRepository.findByUserId(operatorId)` でプロフィールを取得する
2. プロフィールが存在しない場合は ProfileNotFoundError を返す
3. `Profile.updateComment(comment)` を呼び出す
4. `ProfileRepository.save()` で永続化する
5. 更新後のプロフィールを出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| プロフィールが存在しない | ProfileNotFoundError |

---

## 5. ステータス投稿

### 概要

プロフィールページにリッチテキストのステータスメッセージを投稿する。メンション・ファイル添付に対応。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| authorId | UserId | 必須 | 有効な UserId 形式であること |
| content | RichTextHtml | 必須 | 空文字でないこと、サニタイズ済み HTML であること |
| mentions | Mention[] | 必須 | 各要素の type が "user" \| "group" \| "organization" のいずれか、targetId が空文字でないこと（空配列許容） |
| attachmentFileKeys | FileKey[] | 必須 | 各要素が有効な FileKey 形式であること（空配列許容） |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| postId | PostId |
| authorId | UserId |
| content | RichTextHtml |
| mentions | Mention[] |
| attachmentFileKeys | FileKey[] |
| createdAt | Date |

### 処理フロー

1. content が空文字でないことを検証する。空の場合は EmptyPostContentError を返す
2. Post エンティティを新規作成する（postId は新規生成、authorId, content, mentions, attachmentFileKeys, createdAt を設定）
3. `PostRepository.save()` で永続化する
4. mentions に含まれるユーザーに対して Notification ドメインのポートを通じて通知を送信する
5. 作成された投稿を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| content が空文字 | EmptyPostContentError |

---

## 6. 投稿削除

### 概要

自分が投稿したステータスメッセージを削除する。投稿者本人のみ実行可能。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| postId | PostId | 必須 | 有効な PostId 形式であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| postId | PostId |

### 処理フロー

1. `PostRepository.findById(postId)` で投稿を取得する
2. 投稿が存在しない場合は PostNotFoundError を返す
3. `Post.isOwnedBy(operatorId)` で投稿者本人であることを検証する
4. 投稿者本人でない場合は PostPermissionError を返す
5. `PostRepository.delete(postId)` で投稿を削除する
6. 削除した投稿の postId を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 投稿が存在しない | PostNotFoundError |
| 操作者が投稿者本人でない | PostPermissionError |

---

## 7. 投稿一覧取得

### 概要

指定ユーザーの投稿一覧をページネーション付きで取得する。新しい順に返す。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| targetUserId | UserId | 必須 | 有効な UserId 形式であること |
| offset | number | 必須 | 0 以上の整数であること |
| limit | number | 必須 | 1 以上 100 以下の整数であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| posts | { postId: PostId; authorId: UserId; content: RichTextHtml; mentions: Mention[]; attachmentFileKeys: FileKey[]; createdAt: Date }[] |
| totalCount | number |
| offset | number |
| limit | number |

### 処理フロー

1. `PostRepository.findByAuthorId({ authorId: targetUserId, offset, limit })` で投稿一覧を取得する
2. 投稿一覧と総件数を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| offset が負の値 | バリデーションエラー |
| limit が範囲外（1未満または100超過） | バリデーションエラー |

---

## 8. フォロー

### 概要

他ユーザーをフォローする。自分自身のフォローは不可。既にフォロー済みの場合は重複エラー。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| followerId | UserId | 必須 | 有効な UserId 形式であること |
| followeeId | UserId | 必須 | 有効な UserId 形式であること、followerId と異なること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| followerId | UserId |
| followeeId | UserId |
| createdAt | Date |

### 処理フロー

1. followerId と followeeId が同一でないことを検証する。同一の場合は SelfFollowError を返す
2. `FollowRepository.findByPair(followerId, followeeId)` で既存のフォロー関係を確認する
3. 既にフォロー関係が存在する場合は DuplicateFollowError を返す
4. Follow エンティティを新規作成する（followerId, followeeId, createdAt を設定）
5. `FollowRepository.save()` で永続化する
6. 作成されたフォロー関係を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| followerId と followeeId が同一 | SelfFollowError |
| 既にフォロー関係が存在する | DuplicateFollowError |

---

## 9. アンフォロー

### 概要

フォロー中のユーザーのフォローを解除する。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| followerId | UserId | 必須 | 有効な UserId 形式であること |
| followeeId | UserId | 必須 | 有効な UserId 形式であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| followerId | UserId |
| followeeId | UserId |

### 処理フロー

1. `FollowRepository.findByPair(followerId, followeeId)` でフォロー関係を確認する
2. フォロー関係が存在しない場合は FollowNotFoundError を返す
3. `FollowRepository.delete(followerId, followeeId)` でフォロー関係を削除する
4. 削除したフォロー関係の識別情報を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| フォロー関係が存在しない | FollowNotFoundError |

---

## 10. フォロワー一覧取得

### 概要

指定ユーザーのフォロワー一覧をページネーション付きで取得する。新しい順に返す。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| targetUserId | UserId | 必須 | 有効な UserId 形式であること |
| offset | number | 必須 | 0 以上の整数であること |
| limit | number | 必須 | 1 以上 100 以下の整数であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| followers | { followerId: UserId; followeeId: UserId; createdAt: Date }[] |
| totalCount | number |
| offset | number |
| limit | number |

### 処理フロー

1. `FollowRepository.findFollowers({ followeeId: targetUserId, offset, limit })` でフォロワー一覧を取得する
2. フォロワー一覧と総件数を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| offset が負の値 | バリデーションエラー |
| limit が範囲外（1未満または100超過） | バリデーションエラー |

---

## 11. フォロー中一覧取得

### 概要

指定ユーザーがフォローしているユーザー一覧をページネーション付きで取得する。新しい順に返す。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| targetUserId | UserId | 必須 | 有効な UserId 形式であること |
| offset | number | 必須 | 0 以上の整数であること |
| limit | number | 必須 | 1 以上 100 以下の整数であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| followees | { followerId: UserId; followeeId: UserId; createdAt: Date }[] |
| totalCount | number |
| offset | number |
| limit | number |

### 処理フロー

1. `FollowRepository.findFollowees({ followerId: targetUserId, offset, limit })` でフォロー中一覧を取得する
2. フォロー中一覧と総件数を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| offset が負の値 | バリデーションエラー |
| limit が範囲外（1未満または100超過） | バリデーションエラー |
