# JavaScript/CSS カスタマイズ設定の取得 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| js_css_customization 設定が存在する | JavaScript/CSS カスタマイズ設定を取得する | scope, pcJsFiles, mobileJsFiles, pcCssFiles, mobileCssFiles が正しく返る | |
| js_css_customization 設定が存在しない | JavaScript/CSS カスタマイズ設定を取得する | SettingNotFoundError が返る | |
