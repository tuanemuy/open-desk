# ADR-002: 管理機能のドメイン境界

## ステータス

承認済み

## コンテキスト

Admin 画面（OpenDeskシステム管理・cybozu.com共通管理）で必要とされる管理機能が未実装であり、ドメイン設計が必要になった。対象機能は以下の通り:

- SystemSettings（システム設定全般）
- LoginSecurity（ログインセキュリティ）
- Audit（監査ログ）
- Title（役職）
- ThreadAction（スレッドアクション）
- OrgAccessControl（組織間アクセス権）
- Provisioning（SCIMプロビジョニング）
- UserAccessUsage（ユーザーアクセス状況）

これらを個別のドメインとして新設するか、既存ドメインの拡張とするかを判断する必要がある。

## 決定

**新規ドメインは2つ（SystemSettings、Audit）のみ新設し、残りは既存ドメインの拡張とする。**

### 新規ドメイン

| ドメイン | 種別 | 責務 |
|---------|------|------|
| SystemSettings | Supporting | システム全体の設定（ヘッダー色、機能選択、ゲスト認証、モバイル表示、JS/CSSカスタマイズ、アクセス制限、ロゴ、ログインページ、パスワードポリシー、セッション設定、SAML、2FA、外部連携設定、システムメール、ロケール等）の読み書きを管理する |
| Audit | Supporting | システム全体の監査ログの記録・取得・フィルタリング・ダウンロードと、ユーザーアクセス状況の追跡を管理する |

### 既存ドメインの拡張

| 対象ドメイン | 追加内容 |
|-------------|---------|
| Identity | Title（役職）エンティティ、Provisioning（SCIMプロビジョニング）、listGuestUsers ユースケース |
| App | listAppTemplates・pluginManagement ユースケース、AppGroup エンティティ |
| Space | ThreadAction エンティティ、restoreSpace ユースケース |
| AccessControl | OrgAccessControl（組織間アクセス権）エンティティ |

## 検討した代替案

### 案A: 全て新規ドメインとして新設

不採用理由:
- Title・Provisioning は Identity ドメインのユーザー管理と強く結合しており、別ドメインにすると Identity との間で不自然なオーケストレーションが必要になる
- ThreadAction はスペースのスレッド機能の一部であり、Space ドメインから切り出す意味が薄い
- OrgAccessControl は AccessControl ドメインの権限モデルの一部であり、別ドメインにするとアクセス制御ロジックが分散する
- UserAccessUsage は監査・ログの関心事であり、Audit と統合した方が一貫性がある
- 小さなドメインが乱立すると、ドメイン間の依存関係が複雑化する

### 案B: SystemSettings をドメインにせず、各ドメインに設定を分散

不採用理由:
- system_settings テーブルが既に key-value ストアとして存在しており、1つのドメインで一元管理する方が自然
- 設定のセクション（ログインセキュリティ、機能選択等）はユースケースレベルで分離できる

## 影響

- SystemSettings ドメインは多数のユースケースを持つが、ドメインモデルはシンプル（key-value設定）
- LoginSecurity は SystemSettings ドメインのユースケースとして実装される
- UserAccessUsage は Audit ドメインのユースケースとして実装される
- 既存ドメインの設計ドキュメントに追記が必要（spec/domains/ の該当ファイル）
- 既存ドメインの DB テーブルに新規テーブルの追加が必要
