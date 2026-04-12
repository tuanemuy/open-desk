# システムメール設定の更新 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| system_mail 設定が存在する | serverType を "BUILTIN"、有効な fromAddress で更新する | 正常に更新され、externalServer が null で返る | |
| system_mail 設定が存在する | serverType を "EXTERNAL"、有効な fromAddress と externalServer で更新する | 正常に更新され、externalServer の全フィールドが返る | |
| system_mail 設定が存在する | fromAddress を空文字で更新する | InvalidSettingValueError が返る | |
| system_mail 設定が存在する | serverType が "EXTERNAL" で externalServer を null にして更新する | InvalidSettingValueError が返る | |
| system_mail 設定が存在する | serverType が "EXTERNAL" で externalServer の host を空文字にして更新する | InvalidSettingValueError が返る | |
| system_mail 設定が存在する | serverType が "EXTERNAL" で externalServer の port を空にして更新する | InvalidSettingValueError が返る | |
| system_mail 設定が存在する | serverType が "EXTERNAL" で externalServer の username を空文字にして更新する | InvalidSettingValueError が返る | |
| system_mail 設定が存在する | serverType が "EXTERNAL" で externalServer の passwordEncrypted を空文字にして更新する | InvalidSettingValueError が返る | |
| system_mail 設定が存在する | serverType が "BUILTIN" で externalServer を指定して更新する | externalServer は null として扱われる（または InvalidSettingValueError が返る） | |
| system_mail 設定が存在しない | 有効な値で更新する | SettingNotFoundError が返る | |
