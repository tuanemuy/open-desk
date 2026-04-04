# CSVインポート（追加更新） テストケース

UC-R20: CSVファイルからレコードを更新キーに基づいて追加・更新する（UPSERT モード）。

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| アプリが存在し、重複禁止フィールドが定義されている | 有効なCSVファイル、フィールドマッピング、updateKey を指定してインポートを実行する | CsvImportJob が作成され、jobId が返される | |
| アプリが存在する | インポートを実行する | importMode が UPSERT、updateKey が設定されたジョブが生成される | |
| アプリが存在し、CSVに既存レコードと一致する updateKey の行がある | インポートを実行する | 既存レコードが更新される | |
| アプリが存在し、CSVに既存レコードと一致しない updateKey の行がある | インポートを実行する | 新規レコードが作成される | |
| アプリが存在し、CSVに更新行と追加行が混在する | インポートを実行する | 更新と追加がそれぞれ正しく処理される | |
| アプリが存在する | CSVファイルのサイズが100MBを超える | FileSizeLimitExceededError が返される | |
| アプリが存在する | 行数が100,000行を超える | FileSizeLimitExceededError が返される | |
| アプリが存在する | updateKey を未設定でインポートする | UpdateKeyRequiredError が返される | |
| アプリが存在する | fieldMappings が空のリストを指定する | FieldMappingEmptyError が返される | |
| アプリが存在しない | インポートを実行する | AppNotFoundError が返される | |
| アプリが存在し、errorHandling=STOP のファイルにバリデーションエラーがある | インポートを実行する | エラー発生時点でインポートが停止し、ジョブが FAILED になる | |
| アプリが存在し、errorHandling=CONTINUE のファイルにバリデーションエラーがある | インポートを実行する | エラー行をスキップしてインポートが継続し、errorCount が記録される | |
| アプリが存在する | updateKey に重複禁止でないフィールドを指定する | validateUpdateKey で更新キーの妥当性エラーが返される | |
| アプリが存在する | encoding=SHIFT_JIS, delimiter=SEMICOLON を指定してインポートする | 指定のエンコーディングとデリミタでCSVが正しく解析される | |
