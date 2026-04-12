# JavaScript/CSS カスタマイズ設定の更新 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| js_css_customization 設定が存在する | scope を "ALL_USERS" にして有効な値で更新する | 正常に更新され、更新後の DTO が返る | |
| js_css_customization 設定が存在する | scope を "ADMIN_ONLY" にして更新する | 正常に更新される | |
| js_css_customization 設定が存在する | scope を "DISABLED" にして更新する | 正常に更新される | |
| js_css_customization 設定が存在する | scope に不正な値を指定して更新する | InvalidSettingValueError が返る | |
| js_css_customization 設定が存在する | ファイルの type を "URL" にして更新する | 正常に更新される | |
| js_css_customization 設定が存在する | ファイルの type を "UPLOAD" にして更新する | 正常に更新される | |
| js_css_customization 設定が存在する | ファイルの type に不正な値を指定して更新する | InvalidSettingValueError が返る | |
| js_css_customization 設定が存在しない | 有効な値で更新する | SettingNotFoundError が返る | |
