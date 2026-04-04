# ファイルダウンロード テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| ファイルが存在し、PERMANENT 状態である | fileKey を指定してファイルをダウンロードする | ファイルデータとメタデータ（fileName, contentType, size）が返る | |
| ファイルが存在し、TEMPORARY 状態で有効期限内である | fileKey を指定してファイルをダウンロードする | ファイルデータとメタデータが返る | |
| ファイルが存在しない | fileKey を指定してファイルをダウンロードする | FileNotFoundError が返る | |
| ファイルが TEMPORARY 状態で有効期限が切れている | fileKey を指定してファイルをダウンロードする | FileNotFoundError が返る | |
| ファイルメタデータは存在するが、ストレージにファイル実体がない | fileKey を指定してファイルをダウンロードする | FileNotFoundInStorageError が返る | |
| TEMPORARY 状態で有効期限ちょうどの時刻 | fileKey を指定してファイルをダウンロードする | 期限切れ判定の境界値が正しく処理される | |
| 異なる contentType のファイルが存在する | ファイルをダウンロードする | レスポンスの contentType がファイルの MIME タイプと一致する | |
