# ファイルアップロード テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| 有効な uploaderId が存在する | 有効な fileName, contentType, data, size でファイルをアップロードする | ファイルが TEMPORARY 状態で保存され、3日間の有効期限が設定され、DTO が返る | |
| 有効な uploaderId が存在する | fileName を空文字でアップロードする | バリデーションエラーが返る | |
| 有効な uploaderId が存在する | size が 0 でアップロードする | バリデーションエラーが返る | |
| 有効な uploaderId が存在する | size が負の値でアップロードする | バリデーションエラーが返る | |
| 有効な uploaderId が存在する | size が 1GB（1,073,741,824 バイト）を超過してアップロードする | FileSizeLimitExceededError が返る | |
| 有効な uploaderId が存在する | data が空でアップロードする | EmptyFileError が返る | |
| 有効な uploaderId が存在する | ストレージへのアップロードが失敗する | StorageUploadError が返る | |
| 有効な uploaderId が存在する | size がちょうど 1GB（1,073,741,824 バイト）でアップロードする | 正常にアップロードされる | |
| 有効な uploaderId が存在する | size が 1GB + 1 バイト（1,073,741,825 バイト）でアップロードする | FileSizeLimitExceededError が返る | |
| 有効な uploaderId が存在する | size が 1 バイト（最小の有効サイズ）でアップロードする | 正常にアップロードされる | |
| 有効な uploaderId が存在する | contentType が空文字でアップロードする | バリデーションエラーが返る | |
| 有効な uploaderId が存在する | 生成される FileKey が UUID v4 形式であることを確認する | FileKey が UUID v4 形式で返る | |
| 有効な uploaderId が存在する | アップロード後の expiresAt が現在時刻 + 3日であることを確認する | expiresAt が正しく設定される | |
