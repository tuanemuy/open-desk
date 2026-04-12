# プロビジョニング設定の更新 テストケース

| 前提条件 | 操作 | 期待結果 | 実装ステータス |
|---|---|---|---|
| プロビジョニングが無効でトークン設定済み | isEnabled=true で有効化する | isEnabled=true に更新され、hasToken=true、updatedAt が返却される。generatedToken は null | |
| プロビジョニングが有効 | isEnabled=false で無効化する | isEnabled=false に更新され、updatedAt が返却される。generatedToken は null | |
| プロビジョニングが無効でトークン未設定 | regenerateToken=true でトークンを新規発行する | hasToken=true、tokenIssuedAt に発行日時、generatedToken に平文トークンが返却される | |
| プロビジョニングが有効でトークン設定済み | regenerateToken=true でトークンを再生成する | 新しいトークンが発行され、generatedToken に新しい平文トークンが返却される。旧トークンは無効化される | |
| プロビジョニングが無効でトークン設定済み | regenerateToken=true かつ isEnabled=true で同時にトークン再生成と有効化を行う | トークンが再生成され、isEnabled=true に更新され、generatedToken に平文トークンが返却される | |
| プロビジョニングが無効でトークン未設定 | isEnabled=true で有効化する | TokenNotConfiguredError が返される | |
| プロビジョニングが既に有効 | isEnabled=true で再度有効化する | ProvisioningAlreadyEnabledError が返される | |
| プロビジョニングが既に無効 | isEnabled=false で再度無効化する | ProvisioningAlreadyDisabledError が返される | |
| - | isEnabled・regenerateToken どちらも省略して送信する | 設定は変更されず、現在の状態が返却される | |
| - | regenerateToken=false で送信する | トークンは再生成されず、generatedToken は null で返却される | |
