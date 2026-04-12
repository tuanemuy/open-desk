# ヘッダー色の更新 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| header_color 設定が存在する | 有効な HEX コード "#ff0000" で更新する | 設定が更新され、hex に "#ff0000" が返る | |
| header_color 設定が存在する | 小文字の HEX コード "#aabbcc" で更新する | 設定が更新され、hex に "#aabbcc" が返る | |
| header_color 設定が存在する | 大文字の HEX コード "#AABBCC" で更新する | 設定が更新され、hex に "#AABBCC" が返る | |
| header_color 設定が存在する | 大小混在の HEX コード "#aAbBcC" で更新する | 設定が更新され、hex に "#aAbBcC" が返る | |
| header_color 設定が存在する | "#" なしの "ff0000" で更新する | InvalidHexColorError が返る | |
| header_color 設定が存在する | 3桁の短縮形 "#fff" で更新する | InvalidHexColorError が返る | |
| header_color 設定が存在する | 8桁（アルファ付き） "#ff000000" で更新する | InvalidHexColorError が返る | |
| header_color 設定が存在する | 不正な文字を含む "#gggggg" で更新する | InvalidHexColorError が返る | |
| header_color 設定が存在する | 空文字で更新する | InvalidHexColorError が返る | |
| header_color 設定が存在しない | 有効な HEX コード "#ff0000" で更新する | SettingNotFoundError が返る | |
