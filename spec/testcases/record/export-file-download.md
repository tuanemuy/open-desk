# エクスポートファイルダウンロード テストケース

UC-R22: 書き出し済みのCSVファイルをダウンロードする。

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| エクスポートジョブが COMPLETED で有効期限内 | ダウンロードを実行する | fileName, fileContent, contentType が返される | |
| エクスポートジョブが存在しない | ダウンロードを実行する | ExportJobNotFoundError が返される | |
| エクスポートジョブが PENDING | ダウンロードを実行する | ExportJobNotCompletedError が返される | |
| エクスポートジョブが PROCESSING | ダウンロードを実行する | ExportJobNotCompletedError が返される | |
| エクスポートジョブが FAILED | ダウンロードを実行する | ExportJobNotCompletedError が返される | |
| エクスポートジョブが COMPLETED だが作成から3日超過 | ダウンロードを実行する | ExportFileExpiredError が返される | |
| エクスポートジョブが COMPLETED で作成からちょうど3日（境界値） | ダウンロードを実行する | 正常にダウンロードできる（期限内） | |
| エクスポートジョブが COMPLETED で作成から3日+1秒（境界値超過） | ダウンロードを実行する | ExportFileExpiredError が返される | |
| エクスポートジョブが COMPLETED で有効期限内 | ダウンロードを実行する | contentType が正しいMIMEタイプで返される | |
