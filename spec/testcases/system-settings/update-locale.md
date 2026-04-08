# ロケール設定の更新 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| locale 設定が存在する | 有効な timezone と language で更新する | 正常に更新され、更新後の DTO が返る | |
| locale 設定が存在する | timezone を空文字で更新する | InvalidSettingValueError が返る | |
| locale 設定が存在する | language を "ja" で更新する | 正常に更新される | |
| locale 設定が存在する | language を "en_US" で更新する | 正常に更新される | |
| locale 設定が存在する | language を "zh_CN" で更新する | 正常に更新される | |
| locale 設定が存在する | language を "zh_TW" で更新する | 正常に更新される | |
| locale 設定が存在する | language を "es" で更新する | 正常に更新される | |
| locale 設定が存在する | language を "pt_BR" で更新する | 正常に更新される | |
| locale 設定が存在する | language を "th" で更新する | 正常に更新される | |
| locale 設定が存在する | language に不正な値（例: "fr"）を指定して更新する | InvalidSettingValueError が返る | |
| locale 設定が存在しない | 有効な値で更新する | SettingNotFoundError が返る | |
