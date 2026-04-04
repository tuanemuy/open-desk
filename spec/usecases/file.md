# File ユースケース定義

## 1. ファイルアップロード

### 概要

ファイルを一時保管領域にアップロードし、UUID 形式のファイルキーを返す。マルチパートフォームデータで1ファイルずつ送信する。アップロード後は TEMPORARY 状態で3日間の有効期限が設定される。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| uploaderId | UserId | 必須 | 有効な UserId 形式であること |
| fileName | string | 必須 | 空文字でないこと |
| contentType | string | 必須 | 空文字でないこと、有効な MIME タイプ形式であること |
| data | ReadableStream | 必須 | 空でないこと |
| size | number | 必須 | 0 より大きいこと、1GB（1,073,741,824 バイト）以下であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| fileKey | FileKey |
| fileName | string |
| contentType | string |
| size | number |
| status | FileStatus |
| uploadedAt | Date |
| expiresAt | Date |

### 処理フロー

1. fileName が空文字でないことを検証する。空の場合はバリデーションエラーを返す
2. size が 0 より大きく 1GB 以下であることを検証する。超過の場合は FileSizeLimitExceededError を返す
3. data が空でないことを検証する。空の場合は EmptyFileError を返す
4. UUID v4 形式の新しい FileKey を生成する
5. StoredFile エンティティを新規作成する（fileKey, fileName, contentType, size, uploaderId, status = TEMPORARY, uploadedAt = 現在時刻, expiresAt = 現在時刻 + 3日）
6. `FileStorageProvider.upload(fileKey, data, { fileName, contentType, size })` でファイル実体をストレージに保存する
7. `FileRepository.save()` でファイルメタデータを永続化する
8. 作成されたファイル情報を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| fileName が空文字 | バリデーションエラー |
| size が 0 以下 | バリデーションエラー |
| size が 1GB を超過 | FileSizeLimitExceededError |
| data が空 | EmptyFileError |
| ストレージへのアップロードに失敗 | StorageUploadError |

---

## 2. ファイルダウンロード

### 概要

ファイルキーを指定してファイルのバイナリデータを取得する。レスポンスの Content-Type にはファイルの MIME タイプが設定される。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| fileKey | FileKey | 必須 | 有効な FileKey 形式であること、空文字でないこと |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| data | ReadableStream |
| fileName | string |
| contentType | string |
| size | number |

### 処理フロー

1. `FileRepository.findByKey(fileKey)` でファイルメタデータを取得する
2. ファイルが存在しない場合は FileNotFoundError を返す
3. ファイルが TEMPORARY 状態で期限切れの場合（`StoredFile.isExpired(now)` が true）は FileNotFoundError を返す
4. `FileStorageProvider.download(fileKey)` でファイル実体をストレージから取得する
5. ファイルデータとメタデータを出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| ファイルが存在しない | FileNotFoundError |
| 一時ファイルの有効期限が切れている | FileNotFoundError |
| ストレージからの取得に失敗 | FileNotFoundInStorageError |

---

## 3. 未使用ファイル削除

### 概要

アップロードから3日間経過しても紐付けられていない一時ファイル（TEMPORARY 状態）を一括削除する。バッチ処理として定期実行される。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| now | Date | 必須 | 有効な日時であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| deletedCount | number |

### 処理フロー

1. `FileRepository.findExpired(now)` で有効期限切れの一時ファイル一覧を取得する
2. 期限切れファイルが0件の場合は deletedCount: 0 を返す
3. 期限切れファイルの FileKey 一覧を抽出する
4. `FileStorageProvider.deleteBatch(fileKeys)` でストレージからファイル実体を一括削除する
5. `FileRepository.deleteExpired(now)` でファイルメタデータを一括削除する
6. 削除件数を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| ストレージからの一括削除が部分的に失敗 | 外部サービスエラー（ログに記録し、メタデータ削除は成功分のみ反映） |
