# App ドメイン ユースケース設計

---

## アプリライフサイクル

---

### UC-APP-001: アプリ作成（白紙）

#### 概要

空のアプリを新規作成する。PREVIEW 状態でアプリが作成され、フォーム設計等を行った後にデプロイして運用開始する。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| name | string | 必須 | 1-64文字 |
| spaceId | string \| null | 任意 | 存在するスペースのID |
| threadId | string \| null | 任意 | spaceId が指定されている場合のみ設定可。存在するスレッドのID |
| creatorId | string | 必須 | 実行ユーザーのID |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| appId | string |
| name | string |
| status | "PREVIEW" |
| revision | number |
| createdAt | Date |

#### 処理フロー

1. `AppRepository.countAll()` でシステム全体のアプリ数を取得し、最大1,000件の上限チェックを行う
2. `AppCreationService.createBlank(name, spaceId, threadId)` で白紙のアプリを作成する
3. `AppRepository.save(app)` でアプリを永続化する
4. 出力DTOを組み立てて返却する

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| name が空文字または65文字以上 | バリデーションエラー |
| spaceId が存在しない | バリデーションエラー |
| threadId が指定されているが spaceId が未指定 | バリデーションエラー |
| アプリ数が上限（1,000）に達している | ビジネスルール違反 |

---

### UC-APP-002: アプリ作成（テンプレート）

#### 概要

テンプレートからアプリを作成する。テンプレートに定義されたフォーム・ビュー・グラフ等の設定がコピーされた状態で PREVIEW 環境に作成される。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| templateId | string | 必須 | 存在するテンプレートのID |
| name | string | 必須 | 1-64文字 |
| spaceId | string \| null | 任意 | 存在するスペースのID |
| creatorId | string | 必須 | 実行ユーザーのID |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| appId | string |
| name | string |
| status | "PREVIEW" |
| revision | number |
| createdAt | Date |

#### 処理フロー

1. `AppRepository.countAll()` でシステム全体のアプリ数を取得し、最大1,000件の上限チェックを行う
2. `AppCreationService.createFromTemplate(templateId, name, spaceId)` でテンプレートからアプリを作成する
3. `AppRepository.save(app)` でアプリを永続化する
4. 出力DTOを組み立てて返却する

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| name が空文字または65文字以上 | バリデーションエラー |
| templateId が存在しない | バリデーションエラー |
| spaceId が存在しない | バリデーションエラー |
| アプリ数が上限（1,000）に達している | ビジネスルール違反 |

---

### UC-APP-003: アプリ作成（Excel/CSV）

#### 概要

Excel または CSV ファイルからアプリを作成する。ファイルのヘッダーからフィールドが自動生成され、データがレコードとしてインポートされる。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| file | ArrayBuffer | 必須 | Excel(.xlsx)またはCSV(.csv)形式 |
| fileType | "EXCEL" \| "CSV" | 必須 | ファイル種別 |
| name | string | 必須 | 1-64文字 |
| spaceId | string \| null | 任意 | 存在するスペースのID |
| creatorId | string | 必須 | 実行ユーザーのID |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| appId | string |
| name | string |
| status | "PREVIEW" |
| fieldCount | number |
| revision | number |
| createdAt | Date |

#### 処理フロー

1. `AppRepository.countAll()` でシステム全体のアプリ数を取得し、最大1,000件の上限チェックを行う
2. fileType に応じて `AppCreationService.createFromExcel(file, name, spaceId)` または `AppCreationService.createFromCsv(file, name, spaceId)` でアプリを作成する
3. `AppRepository.save(app)` でアプリを永続化する
4. 出力DTOを組み立てて返却する

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| name が空文字または65文字以上 | バリデーションエラー |
| ファイルが不正な形式 | バリデーションエラー |
| ファイルのヘッダーが空 | バリデーションエラー |
| spaceId が存在しない | バリデーションエラー |
| アプリ数が上限（1,000）に達している | ビジネスルール違反 |

---

### UC-APP-004: アプリ作成（既存アプリ再利用）

#### 概要

既存アプリの設定（フォーム・ビュー・グラフ等）を複製して新しいアプリを作成する。レコードデータはコピーされない。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| sourceAppId | string | 必須 | 存在するアプリのID |
| name | string | 必須 | 1-64文字 |
| spaceId | string \| null | 任意 | 存在するスペースのID |
| creatorId | string | 必須 | 実行ユーザーのID |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| appId | string |
| name | string |
| status | "PREVIEW" |
| revision | number |
| createdAt | Date |

#### 処理フロー

1. `AppRepository.countAll()` でシステム全体のアプリ数を取得し、最大1,000件の上限チェックを行う
2. `AppRepository.findById(sourceAppId)` でコピー元アプリの存在を確認する
3. `AppCreationService.duplicateApp(sourceAppId, name, spaceId)` でアプリを複製する
4. `AppRepository.save(app)` でアプリを永続化する
5. 出力DTOを組み立てて返却する

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| name が空文字または65文字以上 | バリデーションエラー |
| sourceAppId が存在しない | バリデーションエラー |
| spaceId が存在しない | バリデーションエラー |
| アプリ数が上限（1,000）に達している | ビジネスルール違反 |

---

### UC-APP-005: アプリ設定更新

#### 概要

アプリの基本設定（名前、コード、説明、テーマ、アイコン、機能フラグ等）を変更する。楽観的ロックにより競合を検出する。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| appId | string | 必須 | 存在するアプリのID |
| revision | number | 必須 | 現在のリビジョン番号（楽観的ロック用） |
| name | string \| null | 任意 | 変更する場合は1-64文字 |
| code | string \| null \| undefined | 任意 | 設定する場合は英字開始の半角英数字。null でクリア。undefined で変更なし |
| description | string \| null \| undefined | 任意 | 最大10,000文字。null でクリア。undefined で変更なし |
| theme | AppTheme \| null | 任意 | 変更する場合は6種類のいずれか |
| icon | AppIcon \| null | 任意 | PRESET: キー指定、FILE: 最大800KB |
| titleField | TitleFieldConfig \| null | 任意 | MANUAL時はfieldCode必須 |
| numberPrecision | NumberPrecision \| null | 任意 | digits: 1-30, decimalPlaces: 0-10 |
| firstMonthOfFiscalYear | number \| null | 任意 | 1-12の整数 |
| featureFlags | AppFeatureFlags \| null | 任意 | 各種機能の有効/無効 |
| modifierId | string | 必須 | 実行ユーザーのID |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| appId | string |
| revision | number |
| updatedAt | Date |

#### 処理フロー

1. `AppRepository.findById(appId)` でアプリを取得する
2. `app.checkRevision(revision)` で楽観的ロックの競合チェックを行う
3. 入力DTOの各フィールドが指定されている場合、対応するエンティティメソッドを呼ぶ:
   - name: `app.rename(name)`
   - code: `AppRepository.existsByCode(code, appId)` で重複チェック後、`app.setCode(code)`
   - description: `app.setDescription(description)`
   - theme: `app.setTheme(theme)`
   - icon: `app.setIcon(icon)`
   - titleField: `app.setTitleField(titleField)`
   - numberPrecision: `app.setNumberPrecision(numberPrecision)`
   - firstMonthOfFiscalYear: `app.setFiscalYearStart(firstMonthOfFiscalYear)`
   - featureFlags: `app.updateFeatureFlags(featureFlags)`
4. `app.incrementRevision()` でリビジョンを増加する
5. `AppRepository.save(app)` でアプリを永続化する
6. 出力DTOを組み立てて返却する

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| appId が存在しない | バリデーションエラー |
| リビジョンが一致しない（競合） | ビジネスルール違反（楽観的ロック競合） |
| アプリが DELETED 状態 | ビジネスルール違反 |
| code がシステム全体で重複 | ビジネスルール違反 |
| name が空文字または65文字以上 | バリデーションエラー |
| description が10,000文字超過 | バリデーションエラー |
| firstMonthOfFiscalYear が1-12の範囲外 | バリデーションエラー |

---

### UC-APP-006: アプリ公開（デプロイ）

#### 概要

preview 環境の設定を production 環境に反映する。デプロイ前に整合性チェックを行い、問題がなければ非同期でデプロイを実行する。複数アプリの一括デプロイにも対応する。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| appIds | string[] | 必須 | 1件以上300件以下のアプリID配列 |
| executorId | string | 必須 | 実行ユーザーのID |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| results | DeployResultItem[] |

DeployResultItem:

| フィールド名 | 型 |
|-------------|-----|
| appId | string |
| status | "PROCESSING" \| "SUCCESS" \| "FAIL" \| "CANCEL" |

#### 処理フロー

1. appIds の件数が1件以上300件以下であることを確認する
2. 各アプリについて `AppDeploymentService.validateForDeployment(appId)` でデプロイ前検証を行う
3. 検証に通過したアプリについて `AppDeploymentService.deployBatch(appIds)` でデプロイを実行する
4. 各アプリについて `app.deploy()` でステータスを ACTIVE に変更する
5. `AppRepository.save(app)` で各アプリを永続化する
6. `AppDeploymentService.getDeployStatus(appIds)` でデプロイステータスを取得し、出力DTOを返却する

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| appIds が空配列 | バリデーションエラー |
| appIds が300件を超えている | バリデーションエラー |
| appId が存在しない | バリデーションエラー |
| フォームの整合性チェックに失敗 | ビジネスルール違反 |
| レイアウトの整合性チェックに失敗 | ビジネスルール違反 |
| デプロイ処理に失敗 | 外部サービスエラー |

---

### UC-APP-007: アプリ取消（リバート）

#### 概要

preview 環境の未デプロイ変更を破棄し、production 環境の設定に戻す。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| appId | string | 必須 | 存在するアプリのID |
| executorId | string | 必須 | 実行ユーザーのID |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| appId | string |
| revision | number |

#### 処理フロー

1. `AppRepository.findById(appId)` でアプリを取得する
2. `app.revert()` でリバートを実行する
3. `AppDeploymentService.revert(appId)` で preview 環境の変更を破棄し production 設定に復元する
4. `AppRepository.save(app)` でアプリを永続化する
5. 出力DTOを組み立てて返却する

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| appId が存在しない | バリデーションエラー |
| アプリが DELETED 状態 | ビジネスルール違反 |
| 未デプロイの変更がない | ビジネスルール違反 |

---

### UC-APP-008: アプリ削除

#### 概要

アプリを論理削除する。DELETED ステータスに変更し、復元可能な状態を維持する。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| appId | string | 必須 | 存在するアプリのID |
| executorId | string | 必須 | 実行ユーザーのID |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| appId | string |
| status | "DELETED" |
| deletedAt | Date |

#### 処理フロー

1. `AppRepository.findById(appId)` でアプリを取得する
2. `app.markAsDeleted()` で論理削除する
3. `AppRepository.save(app)` でアプリを永続化する
4. 出力DTOを組み立てて返却する

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| appId が存在しない | バリデーションエラー |
| アプリが既に DELETED 状態 | ビジネスルール違反 |

---

### UC-APP-009: アプリ復元

#### 概要

論理削除されたアプリを復元し、ACTIVE ステータスに戻す。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| appId | string | 必須 | 存在するアプリのID（DELETED 状態） |
| executorId | string | 必須 | 実行ユーザーのID |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| appId | string |
| status | "ACTIVE" |
| restoredAt | Date |

#### 処理フロー

1. `AppRepository.findById(appId)` でアプリを取得する
2. `app.restore()` で復元する
3. `AppRepository.save(app)` でアプリを永続化する
4. 出力DTOを組み立てて返却する

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| appId が存在しない | バリデーションエラー |
| アプリが DELETED 状態でない | ビジネスルール違反 |
| アプリ数が上限（1,000）に達している | ビジネスルール違反 |

---

## フォーム設計

---

### UC-APP-010: フィールド追加

#### 概要

アプリのフォームに新しいフィールドを追加する。フィールドタイプに応じたプロパティを設定し、フォームレイアウトにも自動的に追加する。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| appId | string | 必須 | 存在するアプリのID |
| fieldCode | string | 必須 | 英数字・アンダースコア、アプリ内ユニーク |
| label | string | 必須 | 1文字以上 |
| fieldType | FieldType | 必須 | 有効なフィールドタイプ（システムフィールド除く） |
| required | boolean | 任意 | デフォルト: false。設定可能なフィールドタイプのみ |
| unique | boolean | 任意 | デフォルト: false。設定可能なフィールドタイプのみ（文字列1行、数値、日付、日時、リンク） |
| noLabel | boolean | 任意 | デフォルト: false |
| defaultValue | FieldDefaultValue \| null | 任意 | フィールドタイプに適合する初期値 |
| properties | FieldProperties | 必須 | フィールドタイプに応じた固有プロパティ |
| layoutPosition | LayoutPosition \| null | 任意 | 指定しない場合はフォーム末尾に追加 |
| creatorId | string | 必須 | 実行ユーザーのID |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| fieldId | string |
| fieldCode | string |
| label | string |
| fieldType | FieldType |

#### 処理フロー

1. `AppRepository.findById(appId)` でアプリを取得し、DELETED 状態でないことを確認する
2. `FieldValidationService.validateFieldCode(fieldCode, existingCodes)` でフィールドコードの妥当性を検証する
3. `FieldRepository.existsByCode(appId, fieldCode)` でフィールドコードの重複をチェックする
4. 入力DTOから Field エンティティを生成する
5. `FieldRepository.save(field)` でフィールドを永続化する
6. `FormLayoutRepository.findByAppId(appId)` でフォームレイアウトを取得する
7. `formLayout.addField(layoutField, layoutPosition)` でレイアウトにフィールドを追加する
8. `FormLayoutService.validateLayoutConsistency(formLayout, fields)` でレイアウトの整合性を検証する
9. `FormLayoutRepository.save(formLayout)` でレイアウトを永続化する
10. 出力DTOを組み立てて返却する

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| appId が存在しない | バリデーションエラー |
| アプリが DELETED 状態 | ビジネスルール違反 |
| fieldCode がアプリ内で重複 | ビジネスルール違反 |
| fieldCode の形式が不正 | バリデーションエラー |
| fieldType がシステムフィールド | バリデーションエラー |
| required を設定できないフィールドタイプに required: true | バリデーションエラー |
| unique を設定できないフィールドタイプに unique: true | バリデーションエラー |
| properties がフィールドタイプと不一致 | バリデーションエラー |
| サブテーブル内に配置不可のフィールドをサブテーブルに配置 | ビジネスルール違反 |
| レイアウトの整合性チェックに失敗 | ビジネスルール違反 |

---

### UC-APP-011: フィールド更新

#### 概要

フィールドのプロパティ（ラベル、フィールドコード、必須/ユニーク設定、固有プロパティ等）を変更する。保存後にイミュータブルとなるプロパティは変更不可。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| appId | string | 必須 | 存在するアプリのID |
| fieldId | string | 必須 | 存在するフィールドのID |
| label | string \| null | 任意 | 変更する場合は1文字以上 |
| fieldCode | string \| null | 任意 | 変更する場合はアプリ内ユニーク。システムフィールドは変更不可 |
| noLabel | boolean \| null | 任意 | 変更する場合のみ指定 |
| required | boolean \| null | 任意 | 設定可能なフィールドタイプのみ |
| unique | boolean \| null | 任意 | 設定可能なフィールドタイプのみ |
| defaultValue | FieldDefaultValue \| null \| undefined | 任意 | null でクリア。undefined で変更なし |
| properties | FieldProperties \| null | 任意 | 変更する場合はフィールドタイプに適合する値 |
| modifierId | string | 必須 | 実行ユーザーのID |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| fieldId | string |
| fieldCode | string |
| label | string |
| fieldType | FieldType |
| updatedAt | Date |

#### 処理フロー

1. `AppRepository.findById(appId)` でアプリを取得し、DELETED 状態でないことを確認する
2. `FieldRepository.findById(fieldId)` でフィールドを取得する
3. 入力DTOの各フィールドが指定されている場合、対応するエンティティメソッドを呼ぶ:
   - label: `field.updateLabel(label)`
   - fieldCode: `FieldRepository.existsByCode(appId, fieldCode, fieldId)` で重複チェック後、`field.updateFieldCode(fieldCode)`
   - noLabel: `field.setNoLabel(noLabel)`
   - required: `field.setRequired(required)`
   - unique: `field.setUnique(unique)`
   - defaultValue: `field.setDefaultValue(defaultValue)`
   - properties: `field.updateProperties(properties)`（`field.isImmutableAfterSave()` でイミュータブル制約を事前チェック）
4. `FieldRepository.save(field)` でフィールドを永続化する
5. 出力DTOを組み立てて返却する

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| appId が存在しない | バリデーションエラー |
| fieldId が存在しない | バリデーションエラー |
| アプリが DELETED 状態 | ビジネスルール違反 |
| システムフィールドの fieldCode を変更しようとした | ビジネスルール違反 |
| fieldCode がアプリ内で重複 | ビジネスルール違反 |
| 保存後にイミュータブルなプロパティを変更しようとした | ビジネスルール違反 |
| required を設定できないフィールドタイプ | バリデーションエラー |
| unique を設定できないフィールドタイプ | バリデーションエラー |
| properties がフィールドタイプと不一致 | バリデーションエラー |

---

### UC-APP-012: フィールド削除

#### 概要

フォームからフィールドを削除する。他のフィールドやビュー・レポート等から参照されていないことを確認した上で削除する。グループやサブテーブルの削除時は内部フィールドも連鎖削除する。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| appId | string | 必須 | 存在するアプリのID |
| fieldId | string | 必須 | 存在するフィールドのID |
| executorId | string | 必須 | 実行ユーザーのID |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| deletedFieldIds | string[] |

#### 処理フロー

1. `AppRepository.findById(appId)` でアプリを取得し、DELETED 状態でないことを確認する
2. `FieldRepository.findById(fieldId)` でフィールドを取得する
3. `field.isSystemField()` でシステムフィールドでないことを確認する
4. フィールドが GROUP または SUBTABLE の場合、内部フィールドのIDリストを取得する
5. `FieldRepository.delete(fieldId)` でフィールドを削除する（GROUP/SUBTABLE の場合は `FieldRepository.deleteBatch(fieldIds)` で内部フィールドも連鎖削除する）
6. `FormLayoutRepository.findByAppId(appId)` でフォームレイアウトを取得する
7. `FormLayoutService.adjustLayoutAfterFieldDeletion(formLayout, fieldCode)` でレイアウトを自動調整する
8. `FormLayoutRepository.save(formLayout)` でレイアウトを永続化する
9. 出力DTOを組み立てて返却する

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| appId が存在しない | バリデーションエラー |
| fieldId が存在しない | バリデーションエラー |
| アプリが DELETED 状態 | ビジネスルール違反 |
| システムフィールドを削除しようとした | ビジネスルール違反 |
| 他のフィールド（ルックアップ、関連レコード一覧等）から参照されている | ビジネスルール違反 |

---

### UC-APP-013: フォームレイアウト更新

#### 概要

フィールドの配置・順序・グルーピングを変更する。レイアウト全体を置き換える操作で、整合性チェックを行った上で保存する。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| appId | string | 必須 | 存在するアプリのID |
| rows | LayoutRow[] | 必須 | レイアウト行の配列。すべてのフォームフィールドを含むこと |
| modifierId | string | 必須 | 実行ユーザーのID |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| appId | string |
| revision | number |

#### 処理フロー

1. `AppRepository.findById(appId)` でアプリを取得し、DELETED 状態でないことを確認する
2. `FormLayoutRepository.findByAppId(appId)` で現在のフォームレイアウトを取得する
3. `FieldRepository.findByAppId(appId)` でアプリの全フィールドを取得する
4. `formLayout.replaceAll(rows)` でレイアウト全体を置き換える
5. `FormLayoutService.validateLayoutConsistency(formLayout, fields)` でレイアウトとフィールド一覧の整合性を検証する
6. `FormLayoutRepository.save(formLayout)` でレイアウトを永続化する
7. 出力DTOを組み立てて返却する

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| appId が存在しない | バリデーションエラー |
| アプリが DELETED 状態 | ビジネスルール違反 |
| すべてのフォームフィールドがレイアウトに含まれていない | ビジネスルール違反 |
| サブテーブル内に配置不可のフィールドがサブテーブルに配置されている | ビジネスルール違反 |
| グループ内にサブテーブルがネストされている | ビジネスルール違反 |

---

## ビュー管理

---

### UC-APP-014: ビュー作成

#### 概要

アプリに新しいビュー（一覧）を作成する。LIST / CALENDAR / CUSTOM の3種類から選択し、それぞれのタイプに応じた設定を行う。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| appId | string | 必須 | 存在するアプリのID |
| viewName | string | 必須 | 1文字以上、アプリ内ユニーク |
| viewType | "LIST" \| "CALENDAR" \| "CUSTOM" | 必須 | 有効なビュータイプ |
| fields | string[] \| null | 条件付き必須 | LIST の場合は1つ以上のフィールドコード |
| calendarDateField | string \| null | 条件付き必須 | CALENDAR の場合は日付/日時型フィールドコード |
| calendarTitleField | string \| null | 任意 | CALENDAR の場合のタイトルフィールドコード |
| html | string \| null | 条件付き必須 | CUSTOM の場合のHTML |
| pager | boolean \| null | 任意 | CUSTOM の場合のページネーション。デフォルト: false |
| deviceScope | "PC_AND_MOBILE" \| "PC_ONLY" \| null | 任意 | CUSTOM の場合の表示範囲 |
| filterCondition | string \| null | 任意 | 絞り込み条件 |
| sort | SortSpec[] \| null | 任意 | ソート条件 |
| creatorId | string | 必須 | 実行ユーザーのID |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| viewId | string |
| viewName | string |
| viewType | ViewType |
| index | number |

#### 処理フロー

1. `AppRepository.findById(appId)` でアプリを取得し、DELETED 状態でないことを確認する
2. `ViewRepository.existsByName(appId, viewName)` でビュー名の重複をチェックする
3. 入力DTOから View エンティティを生成する
4. viewType に応じた設定メソッドを呼ぶ:
   - LIST: `view.setFields(fields)`
   - CALENDAR: `view.setCalendarFields(calendarDateField, calendarTitleField)`
   - CUSTOM: `view.setHtml(html)`
5. filterCondition が指定されている場合、`view.setFilter(filterCondition)` を呼ぶ
6. sort が指定されている場合、`view.setSort(sort)` を呼ぶ
7. `ViewRepository.save(view)` でビューを永続化する
8. 出力DTOを組み立てて返却する

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| appId が存在しない | バリデーションエラー |
| アプリが DELETED 状態 | ビジネスルール違反 |
| viewName がアプリ内で重複 | ビジネスルール違反 |
| LIST で fields が空 | バリデーションエラー |
| CALENDAR で calendarDateField が未指定 | バリデーションエラー |
| CALENDAR で指定フィールドが日付/日時型でない | バリデーションエラー |
| CUSTOM で html が未指定 | バリデーションエラー |
| 指定されたフィールドコードが存在しない | バリデーションエラー |

---

### UC-APP-015: ビュー更新

#### 概要

既存のビュー（一覧）の設定を変更する。ビルトイン一覧も編集可能だが、名前の変更等には制約がある。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| appId | string | 必須 | 存在するアプリのID |
| viewId | string | 必須 | 存在するビューのID |
| viewName | string \| null | 任意 | 変更する場合は1文字以上、アプリ内ユニーク |
| fields | string[] \| null | 任意 | LIST の場合は1つ以上のフィールドコード |
| calendarDateField | string \| null | 任意 | CALENDAR の場合の日付フィールドコード |
| calendarTitleField | string \| null | 任意 | CALENDAR の場合のタイトルフィールドコード |
| html | string \| null | 任意 | CUSTOM の場合のHTML |
| pager | boolean \| null | 任意 | CUSTOM の場合のページネーション |
| deviceScope | "PC_AND_MOBILE" \| "PC_ONLY" \| null | 任意 | CUSTOM の場合の表示範囲 |
| filterCondition | string \| null \| undefined | 任意 | null でクリア。undefined で変更なし |
| sort | SortSpec[] \| null | 任意 | ソート条件 |
| index | number \| null | 任意 | 表示順序を変更する場合 |
| modifierId | string | 必須 | 実行ユーザーのID |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| viewId | string |
| viewName | string |
| viewType | ViewType |
| index | number |
| updatedAt | Date |

#### 処理フロー

1. `AppRepository.findById(appId)` でアプリを取得し、DELETED 状態でないことを確認する
2. `ViewRepository.findById(viewId)` でビューを取得する
3. 入力DTOの各フィールドが指定されている場合、対応するエンティティメソッドを呼ぶ:
   - viewName: `ViewRepository.existsByName(appId, viewName, viewId)` で重複チェック後、`view.rename(viewName)`
   - fields: `view.setFields(fields)`（LIST のみ）
   - calendarDateField/calendarTitleField: `view.setCalendarFields(calendarDateField, calendarTitleField)`（CALENDAR のみ）
   - html: `view.setHtml(html)`（CUSTOM のみ）
   - filterCondition: `view.setFilter(filterCondition)`
   - sort: `view.setSort(sort)`
   - index: `view.reorder(index)`
4. `ViewRepository.save(view)` でビューを永続化する
5. 出力DTOを組み立てて返却する

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| appId が存在しない | バリデーションエラー |
| viewId が存在しない | バリデーションエラー |
| アプリが DELETED 状態 | ビジネスルール違反 |
| viewName がアプリ内で重複 | ビジネスルール違反 |
| LIST で fields が空に設定される | バリデーションエラー |
| CALENDAR で指定フィールドが日付/日時型でない | バリデーションエラー |
| 指定されたフィールドコードが存在しない | バリデーションエラー |

---

### UC-APP-016: ビュー削除

#### 概要

ビュー（一覧）を削除する。ビルトイン一覧（作業者が自分、すべて）は削除できない。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| appId | string | 必須 | 存在するアプリのID |
| viewId | string | 必須 | 存在するビューのID |
| executorId | string | 必須 | 実行ユーザーのID |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| viewId | string |

#### 処理フロー

1. `AppRepository.findById(appId)` でアプリを取得し、DELETED 状態でないことを確認する
2. `ViewRepository.findById(viewId)` でビューを取得する
3. `view.isBuiltin()` でビルトイン一覧でないことを確認する
4. `ViewRepository.delete(viewId)` でビューを削除する
5. 出力DTOを組み立てて返却する

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| appId が存在しない | バリデーションエラー |
| viewId が存在しない | バリデーションエラー |
| アプリが DELETED 状態 | ビジネスルール違反 |
| ビルトイン一覧を削除しようとした | ビジネスルール違反 |

---

## グラフ/レポート管理

---

### UC-APP-017: グラフ/レポート作成

#### 概要

アプリに新しいグラフ/レポートを作成する。9種類のグラフタイプから選択し、分類項目と集計方法を設定する。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| appId | string | 必須 | 存在するアプリのID |
| reportName | string | 必須 | 1文字以上 |
| chartType | ChartType | 必須 | 9種類のいずれか |
| chartSubType | ChartSubType \| null | 任意 | BAR/AREA の場合のみ有効（NORMAL/STACKED/PERCENTAGE） |
| groups | ReportGroup[] | 必須 | 最大3つ。PIVOT_TABLE は大項目・中項目の両方が必須 |
| aggregations | ReportAggregation[] | 必須 | 最大10（PIVOT_TABLE は最大1） |
| filterCondition | string \| null | 任意 | 絞り込み条件 |
| sort | ReportSortSpec[] \| null | 任意 | ソート条件 |
| creatorId | string | 必須 | 実行ユーザーのID |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| reportId | string |
| reportName | string |
| chartType | ChartType |

#### 処理フロー

1. `AppRepository.findById(appId)` でアプリを取得し、DELETED 状態でないことを確認する
2. 入力DTOから Report エンティティを生成する
3. `report.setChartType(chartType, chartSubType)` でグラフ種別を設定する
4. `report.setGroups(groups)` で分類項目を設定する
5. `report.setAggregations(aggregations)` で集計方法を設定する
6. filterCondition が指定されている場合、`report.setFilter(filterCondition)` を呼ぶ
7. sort が指定されている場合、`report.setSort(sort)` を呼ぶ
8. `ReportRepository.save(report)` でレポートを永続化する
9. 出力DTOを組み立てて返却する

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| appId が存在しない | バリデーションエラー |
| アプリが DELETED 状態 | ビジネスルール違反 |
| reportName が空文字 | バリデーションエラー |
| groups が4つ以上 | バリデーションエラー |
| PIVOT_TABLE で大項目・中項目の両方がない | バリデーションエラー |
| aggregations が PIVOT_TABLE で2つ以上、または通常で11以上 | バリデーションエラー |
| 指定されたフィールドコードが存在しない | バリデーションエラー |

---

### UC-APP-018: グラフ/レポート更新

#### 概要

既存のグラフ/レポートの設定を変更する。定期レポートが有効化されている場合、reportName 以外のグラフ設定は変更できない。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| appId | string | 必須 | 存在するアプリのID |
| reportId | string | 必須 | 存在するレポートのID |
| reportName | string \| null | 任意 | 変更する場合は1文字以上 |
| chartType | ChartType \| null | 任意 | 定期レポート有効時は変更不可 |
| chartSubType | ChartSubType \| null | 任意 | 定期レポート有効時は変更不可 |
| groups | ReportGroup[] \| null | 任意 | 定期レポート有効時は変更不可。最大3 |
| aggregations | ReportAggregation[] \| null | 任意 | 定期レポート有効時は変更不可 |
| filterCondition | string \| null \| undefined | 任意 | 定期レポート有効時は変更不可。null でクリア。undefined で変更なし |
| sort | ReportSortSpec[] \| null | 任意 | 定期レポート有効時は変更不可 |
| modifierId | string | 必須 | 実行ユーザーのID |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| reportId | string |
| reportName | string |
| chartType | ChartType |
| updatedAt | Date |

#### 処理フロー

1. `AppRepository.findById(appId)` でアプリを取得し、DELETED 状態でないことを確認する
2. `ReportRepository.findById(reportId)` でレポートを取得する
3. `report.isSettingsLocked()` で定期レポートによるロック状態を確認する
4. 入力DTOの各フィールドが指定されている場合、対応するエンティティメソッドを呼ぶ:
   - reportName: `report.rename(reportName)`
   - chartType: `report.setChartType(chartType, chartSubType)`（ロック時は不可）
   - groups: `report.setGroups(groups)`（ロック時は不可）
   - aggregations: `report.setAggregations(aggregations)`（ロック時は不可）
   - filterCondition: `report.setFilter(filterCondition)`（ロック時は不可）
   - sort: `report.setSort(sort)`（ロック時は不可）
5. `ReportRepository.save(report)` でレポートを永続化する
6. 出力DTOを組み立てて返却する

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| appId が存在しない | バリデーションエラー |
| reportId が存在しない | バリデーションエラー |
| アプリが DELETED 状態 | ビジネスルール違反 |
| 定期レポート有効時に reportName 以外を変更しようとした | ビジネスルール違反 |
| groups が4つ以上 | バリデーションエラー |
| PIVOT_TABLE で大項目・中項目の両方がない | バリデーションエラー |
| aggregations が制限を超過 | バリデーションエラー |

---

### UC-APP-019: グラフ/レポート削除

#### 概要

グラフ/レポートを削除する。定期レポートが有効な場合、スナップショットも含めて削除される。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| appId | string | 必須 | 存在するアプリのID |
| reportId | string | 必須 | 存在するレポートのID |
| executorId | string | 必須 | 実行ユーザーのID |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| reportId | string |

#### 処理フロー

1. `AppRepository.findById(appId)` でアプリを取得し、DELETED 状態でないことを確認する
2. `ReportRepository.findById(reportId)` でレポートを取得する
3. 定期レポートが有効な場合、`report.disablePeriodicReport()` で定期レポートを無効化する
4. `ReportRepository.delete(reportId)` でレポートを削除する
5. 出力DTOを組み立てて返却する

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| appId が存在しない | バリデーションエラー |
| reportId が存在しない | バリデーションエラー |
| アプリが DELETED 状態 | ビジネスルール違反 |

---

### UC-APP-020: 定期レポート有効化

#### 概要

グラフの定期レポートを有効化し、指定した間隔でスナップショットを自動記録する設定を行う。有効化するとグラフの設定（reportName 以外）がロックされる。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| appId | string | 必須 | 存在するアプリのID |
| reportId | string | 必須 | 存在するレポートのID |
| interval | PeriodicInterval | 必須 | YEARLY/QUARTERLY/MONTHLY/WEEKLY/DAILY/HOURLY |
| dayOfMonth | number \| null | 条件付き | MONTHLY/QUARTERLY/YEARLY の場合に指定（1-31 または 32=末日） |
| dayOfWeek | number \| null | 条件付き | WEEKLY の場合に指定（0=日-6=土） |
| quarterMonth | number \| null | 条件付き | QUARTERLY の場合に指定（1-3） |
| hourMinute | { hour: number; minute: number } \| null | 条件付き | HOURLY 以外の場合に指定 |
| minuteOfHour | number \| null | 条件付き | HOURLY の場合に指定（0/10/20/30/40/50） |
| timezone | string | 必須 | 有効なタイムゾーン文字列 |
| executorId | string | 必須 | 実行ユーザーのID |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| reportId | string |
| isSettingsLocked | boolean |
| periodicReport | PeriodicReportConfig |

#### 処理フロー

1. `AppRepository.findById(appId)` でアプリを取得し、DELETED 状態でないことを確認する
2. `ReportRepository.findById(reportId)` でレポートを取得する
3. 入力DTOから `PeriodicReportConfig` を組み立てる
4. `report.enablePeriodicReport(config)` で定期レポートを有効化する
5. `ReportRepository.save(report)` でレポートを永続化する
6. 出力DTOを組み立てて返却する

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| appId が存在しない | バリデーションエラー |
| reportId が存在しない | バリデーションエラー |
| アプリが DELETED 状態 | ビジネスルール違反 |
| 既に定期レポートが有効 | ビジネスルール違反 |
| interval に対して必要なパラメータが不足 | バリデーションエラー |
| timezone が無効 | バリデーションエラー |

---

### UC-APP-021: 定期レポート無効化

#### 概要

定期レポートを無効化し、スナップショットの自動記録を停止する。グラフ設定のロックが解除される。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| appId | string | 必須 | 存在するアプリのID |
| reportId | string | 必須 | 存在するレポートのID |
| executorId | string | 必須 | 実行ユーザーのID |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| reportId | string |
| isSettingsLocked | boolean |

#### 処理フロー

1. `AppRepository.findById(appId)` でアプリを取得し、DELETED 状態でないことを確認する
2. `ReportRepository.findById(reportId)` でレポートを取得する
3. `report.disablePeriodicReport()` で定期レポートを無効化する
4. `ReportRepository.save(report)` でレポートを永続化する
5. 出力DTOを組み立てて返却する

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| appId が存在しない | バリデーションエラー |
| reportId が存在しない | バリデーションエラー |
| アプリが DELETED 状態 | ビジネスルール違反 |
| 定期レポートが有効でない | ビジネスルール違反 |

---

## プロセス管理設定

---

### UC-APP-022: プロセス管理設定

#### 概要

アプリのプロセス管理（ステータス遷移）を定義する。ステータスの一覧と遷移ルール（アクション名・遷移元・遷移先・作業者・条件）を一括で設定する。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| appId | string | 必須 | 存在するアプリのID |
| isEnabled | boolean | 必須 | プロセス管理の有効/無効 |
| statuses | ProcessStatusInput[] | 条件付き必須 | isEnabled が true の場合は1つ以上。先頭が初期ステータス |
| transitions | ProcessTransitionInput[] | 任意 | 遷移ルールの配列 |
| revision | number | 必須 | 現在のリビジョン番号（楽観的ロック用） |
| modifierId | string | 必須 | 実行ユーザーのID |

ProcessStatusInput:

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| statusId | string \| null | 任意 | 既存ステータスの場合はID指定。新規の場合は null |
| name | string | 必須 | 1文字以上 |

ProcessTransitionInput:

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| fromStatusId | string | 必須 | 存在するステータスのIDまたは新規ステータスの参照 |
| actionName | string | 必須 | 1文字以上 |
| toStatusId | string | 必須 | 存在するステータスのIDまたは新規ステータスの参照 |
| workers | WorkerAssignment[] | 任意 | 作業者設定 |
| filterCondition | string \| null | 任意 | 実行条件 |
| filterConditionType | "AND" \| "OR" \| null | 任意 | 条件結合 |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| appId | string |
| isEnabled | boolean |
| statuses | ProcessStatus[] |
| transitions | ProcessTransition[] |
| revision | number |

#### 処理フロー

1. `AppRepository.findById(appId)` でアプリを取得し、DELETED 状態でないことを確認する
2. `ProcessDefinitionRepository.findByAppId(appId)` で現在のプロセス管理定義を取得する（存在しない場合は新規作成）
3. `processDefinition.checkRevision(revision)` で楽観的ロックの競合チェックを行う（既存の場合）
4. isEnabled に応じて `processDefinition.enable()` または `processDefinition.disable()` を呼ぶ
5. isEnabled が true の場合:
   - 既存ステータスの更新: `processDefinition.renameStatus(statusId, name)` でステータス名を変更する
   - 新規ステータスの追加: `processDefinition.addStatus(name, insertAfter)` でステータスを追加する
   - 不要なステータスの削除: `processDefinition.removeStatus(statusId)` でステータスを削除する
   - ステータスの並び替え: `processDefinition.reorderStatuses(order)` で順序を変更する
   - 遷移ルールの設定: 既存ルールを `processDefinition.removeTransition(transitionId)` で削除し、`processDefinition.addTransition(transition)` で再追加する
6. `ProcessDefinitionRepository.save(processDefinition)` で永続化する
7. 出力DTOを組み立てて返却する

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| appId が存在しない | バリデーションエラー |
| アプリが DELETED 状態 | ビジネスルール違反 |
| リビジョンが一致しない（競合） | ビジネスルール違反（楽観的ロック競合） |
| isEnabled: true で statuses が空 | バリデーションエラー |
| 初期ステータス（先頭）を削除しようとした | ビジネスルール違反 |
| 遷移ルールで参照されているステータスを削除しようとした | ビジネスルール違反 |
| 遷移元・遷移先のステータスが存在しない | バリデーションエラー |

---

## 外部連携設定

---

### UC-APP-023: Webhook設定

#### 概要

アプリにWebhookを追加・編集する。レコード操作時に外部URLへHTTPリクエストを送信する設定を管理する。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| appId | string | 必須 | 存在するアプリのID |
| webhookId | string \| null | 任意 | 既存Webhookの更新時はID指定。新規作成時は null |
| url | string | 必須 | HTTPS のみ |
| description | string | 任意 | 説明 |
| events | WebhookEvent[] | 必須 | 1つ以上のトリガーイベント |
| isActive | boolean | 必須 | 有効/無効 |
| executorId | string | 必須 | 実行ユーザーのID |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| webhookId | string |
| url | string |
| events | WebhookEvent[] |
| isActive | boolean |

#### 処理フロー

1. `AppRepository.findById(appId)` でアプリを取得し、DELETED 状態でないことを確認する
2. webhookId が null（新規作成）の場合:
   - `WebhookConfigRepository.countByAppId(appId)` で Webhook 数を取得し、上限（10）チェックを行う
   - 入力DTOから WebhookConfig エンティティを生成する
3. webhookId が指定されている（更新）の場合:
   - `WebhookConfigRepository.findById(webhookId)` で Webhook を取得する
   - `webhook.setUrl(url)` でURLを設定する
   - `webhook.setDescription(description)` で説明を設定する
   - `webhook.setEvents(events)` でイベントを設定する
   - isActive に応じて `webhook.activate()` または `webhook.deactivate()` を呼ぶ
4. `WebhookConfigRepository.save(webhook)` で永続化する
5. 出力DTOを組み立てて返却する

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| appId が存在しない | バリデーションエラー |
| アプリが DELETED 状態 | ビジネスルール違反 |
| url が HTTPS でない | バリデーションエラー |
| events が空配列 | バリデーションエラー |
| 新規作成時に Webhook 数が上限（10）に達している | ビジネスルール違反 |
| webhookId が存在しない | バリデーションエラー |

---

### UC-APP-024: APIトークン管理

#### 概要

アプリのAPIトークンを生成・編集・再生成する。トークンにはスコープ（READ/WRITE/UPDATE/DELETE/MANAGE_APP）を設定する。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| appId | string | 必須 | 存在するアプリのID |
| tokenId | string \| null | 任意 | 既存トークンの更新時はID指定。新規作成時は null |
| scopes | ApiScope[] | 必須 | 1つ以上のスコープ |
| memo | string | 任意 | 用途メモ |
| regenerate | boolean | 任意 | true の場合はトークンを再生成する（更新時のみ有効）。デフォルト: false |
| executorId | string | 必須 | 実行ユーザーのID |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| tokenId | string |
| token | string \| null | 
| scopes | ApiScope[] |
| memo | string |

注: token は新規作成時または再生成時のみ返却する。更新時は null。

#### 処理フロー

1. `AppRepository.findById(appId)` でアプリを取得し、DELETED 状態でないことを確認する
2. tokenId が null（新規作成）の場合:
   - `ApiTokenConfigRepository.countByAppId(appId)` でトークン数を取得し、上限（20）チェックを行う
   - 入力DTOから ApiTokenConfig エンティティを生成する（トークン文字列を生成しハッシュ化して保存）
3. tokenId が指定されている（更新）の場合:
   - `ApiTokenConfigRepository.findById(tokenId)` でトークン設定を取得する
   - `apiToken.updateScopes(scopes)` でスコープを更新する
   - `apiToken.updateMemo(memo)` でメモを更新する
   - regenerate が true の場合、`apiToken.regenerate()` でトークンを再生成する
4. `ApiTokenConfigRepository.save(apiToken)` で永続化する
5. 出力DTOを組み立てて返却する

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| appId が存在しない | バリデーションエラー |
| アプリが DELETED 状態 | ビジネスルール違反 |
| scopes が空配列 | バリデーションエラー |
| 新規作成時にトークン数が上限（20）に達している | ビジネスルール違反 |
| tokenId が存在しない | バリデーションエラー |

---

## 通知・カスタマイズ

---

### UC-APP-025: 通知条件設定

#### 概要

アプリの通知条件（アプリ条件通知・レコード条件通知・リマインダー通知）を設定する。通知の配信自体は Notification ドメインが担う。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| appId | string | 必須 | 存在するアプリのID |
| generalNotifications | GeneralNotificationInput[] \| null | 任意 | アプリ条件通知の配列 |
| perRecordNotifications | PerRecordNotificationInput[] \| null | 任意 | レコード条件通知の配列 |
| reminderNotifications | ReminderNotificationInput[] \| null | 任意 | リマインダー通知の配列 |
| revision | number | 必須 | 現在のリビジョン番号（楽観的ロック用） |
| modifierId | string | 必須 | 実行ユーザーのID |

GeneralNotificationInput:

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| recipients | NotificationRecipient[] | 必須 | 1つ以上の通知先 |
| events | GeneralNotificationEvent[] | 必須 | 1つ以上のトリガーイベント |
| enableCommentTracking | boolean | 任意 | デフォルト: false |

PerRecordNotificationInput:

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| filterCondition | string | 必須 | レコード条件式 |
| recipients | NotificationRecipient[] | 必須 | 1つ以上の通知先 |

ReminderNotificationInput:

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| dateFieldCode | string | 必須 | 日付/日時型フィールドのフィールドコード |
| offsetDays | number | 必須 | 相対日数（負=前、正=後） |
| offsetTime | string \| null | 任意 | 通知時刻 |
| timezone | string | 必須 | 有効なタイムゾーン文字列 |
| recipients | NotificationRecipient[] | 必須 | 1つ以上の通知先 |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| appId | string |
| revision | number |

#### 処理フロー

1. `AppRepository.findById(appId)` でアプリを取得し、DELETED 状態でないことを確認する
2. `AppNotificationConfigRepository.findByAppId(appId)` で通知条件設定を取得する（存在しない場合は新規作成）
3. `config.checkRevision(revision)` で楽観的ロックの競合チェックを行う（既存の場合）
4. 入力DTOの各フィールドが指定されている場合、対応するエンティティメソッドを呼ぶ:
   - generalNotifications: `config.setGeneralNotifications(generalNotifications)`
   - perRecordNotifications: `config.setPerRecordNotifications(perRecordNotifications)`
   - reminderNotifications: リマインダーの dateFieldCode が日付/日時型フィールドであることを `FieldRepository.findByCode(appId, dateFieldCode)` で確認後、`config.setReminderNotifications(reminderNotifications)`
5. `AppNotificationConfigRepository.save(config)` で永続化する
6. 出力DTOを組み立てて返却する

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| appId が存在しない | バリデーションエラー |
| アプリが DELETED 状態 | ビジネスルール違反 |
| リビジョンが一致しない（競合） | ビジネスルール違反（楽観的ロック競合） |
| recipients が空配列 | バリデーションエラー |
| events が空配列 | バリデーションエラー |
| リマインダーの dateFieldCode が日付/日時型フィールドでない | バリデーションエラー |
| リマインダーの dateFieldCode が存在しない | バリデーションエラー |
| timezone が無効 | バリデーションエラー |

---

### UC-APP-026: カスタマイズ管理

#### 概要

アプリの JavaScript/CSS カスタマイズ設定を管理する。PC用・スマートフォン用それぞれに JS/CSS ファイルを設定できる。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| appId | string | 必須 | 存在するアプリのID |
| scope | "ALL_USERS" \| "ADMIN_ONLY" \| "NONE" | 必須 | 適用範囲 |
| desktopJs | CustomizationFileInput[] \| null | 任意 | PC用JSファイルの配列 |
| desktopCss | CustomizationFileInput[] \| null | 任意 | PC用CSSファイルの配列 |
| mobileJs | CustomizationFileInput[] \| null | 任意 | スマートフォン用JSファイルの配列 |
| mobileCss | CustomizationFileInput[] \| null | 任意 | スマートフォン用CSSファイルの配列 |
| revision | number | 必須 | 現在のリビジョン番号（楽観的ロック用） |
| modifierId | string | 必須 | 実行ユーザーのID |

CustomizationFileInput:

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| type | "URL" \| "FILE" | 必須 | ファイル種別 |
| url | string \| null | 条件付き必須 | URL 指定時は有効なURL |
| fileKey | string \| null | 条件付き必須 | FILE 指定時はファイルキー。最大20MB |
| name | string \| null | 任意 | ファイル名 |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| appId | string |
| scope | CustomizationScope |
| revision | number |

#### 処理フロー

1. `AppRepository.findById(appId)` でアプリを取得し、DELETED 状態でないことを確認する
2. `AppCustomizationRepository.findByAppId(appId)` でカスタマイズ設定を取得する（存在しない場合は新規作成）
3. `customization.setScope(scope)` で適用範囲を設定する
4. 入力DTOの各フィールドが指定されている場合、対応するエンティティメソッドを呼ぶ:
   - desktopJs: `customization.setDesktopJs(desktopJs)`
   - desktopCss: `customization.setDesktopCss(desktopCss)`
   - mobileJs: `customization.setMobileJs(mobileJs)`
   - mobileCss: `customization.setMobileCss(mobileCss)`
5. `AppCustomizationRepository.save(customization)` で永続化する
6. 出力DTOを組み立てて返却する

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| appId が存在しない | バリデーションエラー |
| アプリが DELETED 状態 | ビジネスルール違反 |
| リビジョンが一致しない（競合） | ビジネスルール違反（楽観的ロック競合） |
| scope が無効な値 | バリデーションエラー |
| FILE タイプで fileKey が未指定 | バリデーションエラー |
| URL タイプで url が未指定 | バリデーションエラー |
| アップロードファイルが20MBを超過 | バリデーションエラー |

---

## その他設定

---

### UC-APP-027: アクション設定

#### 概要

レコード再利用のアクション（レコードデータを別アプリに転記する設定）を追加・編集・削除する。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| appId | string | 必須 | 存在するアプリのID（コピー元アプリ） |
| actionId | string \| null | 任意 | 既存アクションの更新時はID指定。新規作成時は null |
| actionName | string | 必須 | 1文字以上 |
| destinationAppId | string | 必須 | 存在するアプリのID（コピー先アプリ） |
| fieldMappings | ActionFieldMappingInput[] | 必須 | フィールドマッピングの配列 |
| allowedEntities | ActionAllowedEntity[] | 任意 | 利用可能なユーザー/組織/グループ |
| filterCondition | string \| null | 任意 | 利用条件 |
| index | number \| null | 任意 | 表示順序 |
| executorId | string | 必須 | 実行ユーザーのID |

ActionFieldMappingInput:

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| srcFieldCode | string | 必須 | コピー元フィールドコード |
| destFieldCode | string | 必須 | コピー先フィールドコード |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| actionId | string |
| actionName | string |
| destinationAppId | string |

#### 処理フロー

1. `AppRepository.findById(appId)` でアプリを取得し、DELETED 状態でないことを確認する
2. `AppRepository.findById(destinationAppId)` でコピー先アプリの存在を確認する
3. actionId が null（新規作成）の場合:
   - 入力DTOから AppAction エンティティを生成する
4. actionId が指定されている（更新）の場合:
   - `AppActionRepository.findById(actionId)` でアクションを取得する
   - `action.rename(actionName)` でアクション名を変更する
   - `action.setDestination(destinationAppId)` でコピー先を変更する
   - `action.setFieldMappings(fieldMappings)` でフィールドマッピングを設定する
   - `action.setAllowedEntities(allowedEntities)` で利用者を設定する
   - `action.setFilter(filterCondition)` で利用条件を設定する
   - index が指定されている場合、`action.reorder(index)` で表示順序を変更する
5. `AppActionRepository.save(action)` で永続化する
6. 出力DTOを組み立てて返却する

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| appId が存在しない | バリデーションエラー |
| アプリが DELETED 状態 | ビジネスルール違反 |
| destinationAppId が存在しない | バリデーションエラー |
| actionName が空文字 | バリデーションエラー |
| actionId が存在しない | バリデーションエラー |
| フィールドマッピングのフィールドコードが存在しない | バリデーションエラー |
| フィールドマッピングの型が一致しない | ビジネスルール違反 |

---

### UC-APP-028: アプリカテゴリ設定

#### 概要

レコードを階層的に分類するためのカテゴリーを設定する。カテゴリーの有効化/無効化、カテゴリーの追加・編集・削除・移動を行う。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| appId | string | 必須 | 存在するアプリのID |
| isEnabled | boolean | 必須 | カテゴリーの有効/無効 |
| categories | CategoryNodeInput[] | 条件付き必須 | isEnabled が true の場合はカテゴリーツリー |
| revision | number | 必須 | 現在のリビジョン番号（楽観的ロック用） |
| modifierId | string | 必須 | 実行ユーザーのID |

CategoryNodeInput:

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| categoryId | string \| null | 任意 | 既存カテゴリーの場合はID指定。新規の場合は null |
| name | string | 必須 | 1文字以上 |
| children | CategoryNodeInput[] | 任意 | 子カテゴリーの配列 |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| appId | string |
| isEnabled | boolean |
| categories | CategoryNode[] |
| revision | number |

#### 処理フロー

1. `AppRepository.findById(appId)` でアプリを取得し、DELETED 状態でないことを確認する
2. `AppCategoryRepository.findByAppId(appId)` でカテゴリー設定を取得する（存在しない場合は新規作成）
3. isEnabled に応じて `category.enable()` または `category.disable()` を呼ぶ
4. isEnabled が true の場合、入力DTOのカテゴリーツリーに基づいてカテゴリーを構築する:
   - 新規カテゴリー: `category.addCategory(name, parentId)` で追加する
   - 既存カテゴリーの名前変更: `category.renameCategory(categoryId, name)` で変更する
   - カテゴリーの移動: `category.moveCategory(categoryId, newParentId, index)` で移動する
   - 不要なカテゴリーの削除: `category.removeCategory(categoryId)` で削除する
5. `AppCategoryRepository.save(category)` で永続化する
6. 出力DTOを組み立てて返却する

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| appId が存在しない | バリデーションエラー |
| アプリが DELETED 状態 | ビジネスルール違反 |
| リビジョンが一致しない（競合） | ビジネスルール違反（楽観的ロック競合） |
| カテゴリー名が空文字 | バリデーションエラー |

---

### UC-APP-029: 多言語名設定

#### 概要

アプリの各項目名（アプリ名、フィールド名、ビュー名、ステータス名等）の多言語翻訳を設定する。7言語に対応する。

#### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| appId | string | 必須 | 存在するアプリのID |
| translations | I18nTranslationInput[] | 必須 | 翻訳設定の配列 |
| revision | number | 必須 | 現在のリビジョン番号（楽観的ロック用） |
| modifierId | string | 必須 | 実行ユーザーのID |

I18nTranslationInput:

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| scope | I18nScope | 必須 | GENERAL/FORM/VIEW/PROCESS/REPORT/CATEGORY/ACTION |
| itemKey | string | 必須 | 対象項目の識別子 |
| language | AppLanguage | 必須 | en/ja/zh/zh-TW/vi/id/th |
| value | string | 必須 | 翻訳テキスト（空文字の場合はデフォルト名称を使用） |

#### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| appId | string |
| translationCount | number |
| revision | number |

#### 処理フロー

1. `AppRepository.findById(appId)` でアプリを取得し、DELETED 状態でないことを確認する
2. `AppI18nConfigRepository.findByAppId(appId)` で多言語設定を取得する（存在しない場合は新規作成）
3. 入力DTOの各翻訳について:
   - value が空文字の場合、`config.removeTranslation(scope, itemKey, language)` で翻訳を削除する
   - value が空文字でない場合、`config.setTranslation(scope, itemKey, language, value)` で翻訳を設定する
4. `AppI18nConfigRepository.save(config)` で永続化する
5. 出力DTOを組み立てて返却する

#### エラーケース

| 条件 | エラー種別 |
|------|----------|
| appId が存在しない | バリデーションエラー |
| アプリが DELETED 状態 | ビジネスルール違反 |
| リビジョンが一致しない（競合） | ビジネスルール違反（楽観的ロック競合） |
| scope が無効な値 | バリデーションエラー |
| language が対応言語でない | バリデーションエラー |
| itemKey が存在しない項目を参照 | バリデーションエラー |

---

## ユースケース一覧

| ID | ユースケース名 | カテゴリ |
|----|--------------|---------|
| UC-APP-001 | アプリ作成（白紙） | アプリライフサイクル |
| UC-APP-002 | アプリ作成（テンプレート） | アプリライフサイクル |
| UC-APP-003 | アプリ作成（Excel/CSV） | アプリライフサイクル |
| UC-APP-004 | アプリ作成（既存アプリ再利用） | アプリライフサイクル |
| UC-APP-005 | アプリ設定更新 | アプリライフサイクル |
| UC-APP-006 | アプリ公開（デプロイ） | アプリライフサイクル |
| UC-APP-007 | アプリ取消（リバート） | アプリライフサイクル |
| UC-APP-008 | アプリ削除 | アプリライフサイクル |
| UC-APP-009 | アプリ復元 | アプリライフサイクル |
| UC-APP-010 | フィールド追加 | フォーム設計 |
| UC-APP-011 | フィールド更新 | フォーム設計 |
| UC-APP-012 | フィールド削除 | フォーム設計 |
| UC-APP-013 | フォームレイアウト更新 | フォーム設計 |
| UC-APP-014 | ビュー作成 | ビュー管理 |
| UC-APP-015 | ビュー更新 | ビュー管理 |
| UC-APP-016 | ビュー削除 | ビュー管理 |
| UC-APP-017 | グラフ/レポート作成 | グラフ/レポート管理 |
| UC-APP-018 | グラフ/レポート更新 | グラフ/レポート管理 |
| UC-APP-019 | グラフ/レポート削除 | グラフ/レポート管理 |
| UC-APP-020 | 定期レポート有効化 | グラフ/レポート管理 |
| UC-APP-021 | 定期レポート無効化 | グラフ/レポート管理 |
| UC-APP-022 | プロセス管理設定 | プロセス管理設定 |
| UC-APP-023 | Webhook設定 | 外部連携設定 |
| UC-APP-024 | APIトークン管理 | 外部連携設定 |
| UC-APP-025 | 通知条件設定 | 通知・カスタマイズ |
| UC-APP-026 | カスタマイズ管理 | 通知・カスタマイズ |
| UC-APP-027 | アクション設定 | その他設定 |
| UC-APP-028 | アプリカテゴリ設定 | その他設定 |
| UC-APP-029 | 多言語名設定 | その他設定 |

---

## 30. アプリテンプレート一覧取得

### 概要

アプリテンプレートの一覧を取得する。アプリ作成権限を持つユーザーが実行可能。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| offset | number | 任意 | 0以上の整数。デフォルト0 |
| limit | number | 任意 | 1以上の整数。デフォルト100 |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| templates | Array<{ templateId: AppTemplateId; name: string; description: string \| null; sourceAppId: AppId \| null; creatorId: UserId; createdAt: Date }> |
| totalCount | number |

### 処理フロー

1. Identity ドメインのポートから operatorId のユーザーコンテキストを取得する
2. AccessControl ドメインのポートで操作者のシステム権限を評価し、`appCreate` 権限があることを検証する
3. 権限がない場合は SystemPermissionDeniedError を返す
4. `AppTemplateRepository.list(offset, limit)` でアプリテンプレート一覧を取得する
5. アプリテンプレート一覧と総件数を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 操作者にアプリ作成権限がない | SystemPermissionDeniedError |

---

## 31. アプリテンプレート作成

### 概要

既存アプリの設定をテンプレートとして保存する。アプリ管理権限が必要。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| sourceAppId | AppId | 必須 | 有効な AppId 形式であること |
| name | string | 必須 | 1文字以上128文字以下 |
| description | string \| null | 任意 | テンプレートの説明 |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| templateId | AppTemplateId |
| name | string |
| description | string \| null |
| sourceAppId | AppId |
| creatorId | UserId |
| createdAt | Date |

### 処理フロー

1. Identity ドメインのポートから operatorId のユーザーコンテキストを取得する
2. `AppRepository.findById(sourceAppId)` でアプリを取得する
3. アプリが存在しない場合は AppNotFoundError を返す
4. アプリが DELETED 状態の場合はビジネスルール違反エラーを返す
5. AccessControl ドメインのポートでアプリ管理権限（`appEditable`）を評価する。権限がない場合は AppPermissionDeniedError を返す
6. name が1文字以上128文字以下であることを検証する。空文字の場合は EmptyAppTemplateNameError、128文字超過の場合は AppTemplateNameTooLongError を返す
7. 新しい AppTemplate エンティティを生成する（templateId は新規生成、sourceAppId, name, description, creatorId を設定）
8. `AppTemplateRepository.save(template)` で永続化する
9. 作成されたテンプレートを出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| アプリが存在しない | AppNotFoundError |
| アプリが DELETED 状態 | ビジネスルール違反 |
| 操作者にアプリ管理権限がない | AppPermissionDeniedError |
| テンプレート名が空文字 | EmptyAppTemplateNameError |
| テンプレート名が128文字超過 | AppTemplateNameTooLongError |

---

## 32. アプリテンプレートファイル読み込み

### 概要

テンプレートファイルを読み込んでアプリテンプレートを登録する。アプリ作成権限が必要。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| file | ArrayBuffer | 必須 | テンプレートファイルのバイナリデータ |
| name | string | 必須 | 1文字以上128文字以下 |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| templateId | AppTemplateId |
| name | string |
| description | string \| null |
| sourceAppId | AppId \| null |
| creatorId | UserId |
| createdAt | Date |

### 処理フロー

1. Identity ドメインのポートから operatorId のユーザーコンテキストを取得する
2. AccessControl ドメインのポートで操作者のシステム権限を評価し、`appCreate` 権限があることを検証する
3. 権限がない場合は SystemPermissionDeniedError を返す
4. name が1文字以上128文字以下であることを検証する。空文字の場合は EmptyAppTemplateNameError、128文字超過の場合は AppTemplateNameTooLongError を返す
5. `AppTemplateRepository.importFromFile(file, name, operatorId)` でテンプレートファイルを解析し、テンプレートを登録する
6. ファイル解析に失敗した場合は AppTemplateImportError を返す
7. 登録されたテンプレートを出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 操作者にアプリ作成権限がない | SystemPermissionDeniedError |
| テンプレート名が空文字 | EmptyAppTemplateNameError |
| テンプレート名が128文字超過 | AppTemplateNameTooLongError |
| テンプレートファイルの解析に失敗 | AppTemplateImportError |

---

## 33. アプリテンプレートファイル書き出し

### 概要

既存のアプリテンプレートをファイルとして書き出す。アプリ作成権限が必要。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| templateId | AppTemplateId | 必須 | 有効な AppTemplateId 形式であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| file | ArrayBuffer |
| fileName | string |

### 処理フロー

1. Identity ドメインのポートから operatorId のユーザーコンテキストを取得する
2. AccessControl ドメインのポートで操作者のシステム権限を評価し、`appCreate` 権限があることを検証する
3. 権限がない場合は SystemPermissionDeniedError を返す
4. `AppTemplateRepository.findById(templateId)` でテンプレートを取得する
5. テンプレートが存在しない場合は AppTemplateNotFoundError を返す
6. `AppTemplateRepository.exportToFile(templateId)` でテンプレートをファイルとして書き出す
7. 書き出しに失敗した場合は AppTemplateExportError を返す
8. ファイルデータとファイル名を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 操作者にアプリ作成権限がない | SystemPermissionDeniedError |
| テンプレートが存在しない | AppTemplateNotFoundError |
| ファイル書き出しに失敗 | AppTemplateExportError |

---

## 34. アプリテンプレート削除

### 概要

アプリテンプレートを削除する。アプリ管理権限が必要。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| templateId | AppTemplateId | 必須 | 有効な AppTemplateId 形式であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| (なし) | void |

### 処理フロー

1. Identity ドメインのポートから operatorId のユーザーコンテキストを取得する
2. AccessControl ドメインのポートで操作者のシステム権限を評価し、`appManage` 権限があることを検証する
3. 権限がない場合は SystemPermissionDeniedError を返す
4. `AppTemplateRepository.findById(templateId)` でテンプレートを取得する
5. テンプレートが存在しない場合は AppTemplateNotFoundError を返す
6. `AppTemplateRepository.delete(templateId)` でテンプレートを削除する

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 操作者にアプリ管理権限がない | SystemPermissionDeniedError |
| テンプレートが存在しない | AppTemplateNotFoundError |

---

## 35. アプリグループ一覧取得

### 概要

アプリグループの一覧を取得する。アプリグループ閲覧権限またはアプリグループ管理権限を持つユーザーが実行可能。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| offset | number | 任意 | 0以上の整数。デフォルト0 |
| limit | number | 任意 | 1以上の整数。デフォルト100 |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| groups | Array<{ appGroupId: AppGroupId; name: string; isDefault: boolean; appIds: AppId[]; createdAt: Date; updatedAt: Date }> |
| totalCount | number |

### 処理フロー

1. Identity ドメインのポートから operatorId のユーザーコンテキストを取得する
2. AccessControl ドメインのポートで操作者のシステム権限を評価し、`appGroupViewable` または `appGroupManageable` 権限があることを検証する
3. 権限がない場合は SystemPermissionDeniedError を返す
4. `AppGroupRepository.list(offset, limit)` でアプリグループ一覧を取得する
5. アプリグループ一覧と総件数を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 操作者にアプリグループ閲覧権限も管理権限もない | SystemPermissionDeniedError |

---

## 36. アプリグループ作成

### 概要

新しいアプリグループを作成する。アプリグループ管理権限が必要。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| name | string | 必須 | 1文字以上128文字以下 |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| appGroupId | AppGroupId |
| name | string |
| isDefault | boolean |
| appIds | AppId[] |
| createdAt | Date |
| updatedAt | Date |

### 処理フロー

1. Identity ドメインのポートから operatorId のユーザーコンテキストを取得する
2. AccessControl ドメインのポートで操作者のシステム権限を評価し、`appGroupManageable` 権限があることを検証する
3. 権限がない場合は SystemPermissionDeniedError を返す
4. name が1文字以上128文字以下であることを検証する。空文字の場合は EmptyAppGroupNameError、128文字超過の場合は AppGroupNameTooLongError を返す
5. 新しい AppGroup エンティティを生成する（appGroupId は新規生成、isDefault は false、appIds は空配列）
6. `AppGroupRepository.save(group)` で永続化する
7. 作成されたアプリグループを出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 操作者にアプリグループ管理権限がない | SystemPermissionDeniedError |
| グループ名が空文字 | EmptyAppGroupNameError |
| グループ名が128文字超過 | AppGroupNameTooLongError |

---

## 37. アプリグループ更新

### 概要

アプリグループの名前・デフォルト設定・所属アプリを変更する。アプリグループ管理権限が必要。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| appGroupId | AppGroupId | 必須 | 有効な AppGroupId 形式であること |
| name | string | 任意 | 指定時は1文字以上128文字以下 |
| isDefault | boolean | 任意 | デフォルトフラグの変更 |
| appIds | AppId[] | 任意 | 指定時は所属アプリを一括置換 |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| appGroupId | AppGroupId |
| name | string |
| isDefault | boolean |
| appIds | AppId[] |
| createdAt | Date |
| updatedAt | Date |

### 処理フロー

1. Identity ドメインのポートから operatorId のユーザーコンテキストを取得する
2. AccessControl ドメインのポートで操作者のシステム権限を評価し、`appGroupManageable` 権限があることを検証する
3. 権限がない場合は SystemPermissionDeniedError を返す
4. `AppGroupRepository.findById(appGroupId)` でアプリグループを取得する
5. アプリグループが存在しない場合は AppGroupNotFoundError を返す
6. name が指定されている場合、`AppGroup.rename(name)` を呼び出す（ドメインモデル内で1-128文字のバリデーションが実行される）
7. isDefault が指定されており true の場合、`AppGroupDefaultService.setDefaultGroup(appGroupId)` を呼び出す（既存のデフォルトグループの isDefault が false に変更される）
8. isDefault が指定されており false の場合、`AppGroup.setDefault(false)` を呼び出す
9. appIds が指定されている場合、`AppGroup.replaceApps(appIds)` を呼び出す
10. `AppGroupRepository.save(group)` で永続化する
11. 更新後のアプリグループを出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 操作者にアプリグループ管理権限がない | SystemPermissionDeniedError |
| アプリグループが存在しない | AppGroupNotFoundError |
| グループ名が空文字 | EmptyAppGroupNameError（ドメインモデルから発生） |
| グループ名が128文字超過 | AppGroupNameTooLongError（ドメインモデルから発生） |

---

## 38. アプリグループ削除

### 概要

アプリグループを削除する。所属アプリへの影響はない（アプリは削除されない）。アプリグループ管理権限が必要。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| appGroupId | AppGroupId | 必須 | 有効な AppGroupId 形式であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| (なし) | void |

### 処理フロー

1. Identity ドメインのポートから operatorId のユーザーコンテキストを取得する
2. AccessControl ドメインのポートで操作者のシステム権限を評価し、`appGroupManageable` 権限があることを検証する
3. 権限がない場合は SystemPermissionDeniedError を返す
4. `AppGroupRepository.findById(appGroupId)` でアプリグループを取得する
5. アプリグループが存在しない場合は AppGroupNotFoundError を返す
6. `AppGroupRepository.delete(appGroupId)` でアプリグループを削除する

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 操作者にアプリグループ管理権限がない | SystemPermissionDeniedError |
| アプリグループが存在しない | AppGroupNotFoundError |

---

## 39. プラグイン一覧取得

### 概要

システムに登録されたプラグインの一覧を取得する。プリインストール済みプラグインを含む。システム管理権限が必要。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| offset | number | 任意 | 0以上の整数。デフォルト0 |
| limit | number | 任意 | 1以上の整数。デフォルト100 |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| plugins | Array<{ pluginId: PluginId; name: string; description: string \| null; isActive: boolean; isPreinstalled: boolean; installedAppIds: AppId[]; createdAt: Date; updatedAt: Date }> |
| totalCount | number |

### 処理フロー

1. Identity ドメインのポートから operatorId のユーザーコンテキストを取得する
2. AccessControl ドメインのポートで操作者のシステム権限を評価し、`systemAdmin` 権限があること、または `userContext.isCybozuAdmin` が true であることを検証する
3. 権限がない場合は SystemPermissionDeniedError を返す
4. `PluginRepository.list(offset, limit)` でプラグイン一覧を取得する
5. プラグイン一覧と総件数を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 操作者にシステム管理権限がない | SystemPermissionDeniedError |

---

## 40. プラグイン読み込み

### 概要

プラグインファイルを読み込んでシステムに登録する。システム管理権限が必要。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| file | ArrayBuffer | 必須 | プラグインファイルのバイナリデータ。最大50MB |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| pluginId | PluginId |
| name | string |
| description | string \| null |
| isActive | boolean |
| isPreinstalled | boolean |
| createdAt | Date |
| updatedAt | Date |

### 処理フロー

1. Identity ドメインのポートから operatorId のユーザーコンテキストを取得する
2. AccessControl ドメインのポートで操作者のシステム権限を評価し、`systemAdmin` 権限があること、または `userContext.isCybozuAdmin` が true であることを検証する
3. 権限がない場合は SystemPermissionDeniedError を返す
4. `PluginRepository.importFromFile(file)` でプラグインファイルを解析し、プラグインを登録する
5. ファイル解析に失敗した場合は PluginImportError を返す
6. 登録されたプラグインを出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 操作者にシステム管理権限がない | SystemPermissionDeniedError |
| プラグインファイルの解析に失敗 | PluginImportError |

---

## 41. プラグインステータス変更

### 概要

プラグインの有効/無効を切り替える。プリインストール済みプラグインは無効化不可。システム管理権限が必要。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| pluginId | PluginId | 必須 | 有効な PluginId 形式であること |
| isActive | boolean | 必須 | 有効化する場合 true、無効化する場合 false |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| pluginId | PluginId |
| name | string |
| description | string \| null |
| isActive | boolean |
| isPreinstalled | boolean |
| createdAt | Date |
| updatedAt | Date |

### 処理フロー

1. Identity ドメインのポートから operatorId のユーザーコンテキストを取得する
2. AccessControl ドメインのポートで操作者のシステム権限を評価し、`systemAdmin` 権限があること、または `userContext.isCybozuAdmin` が true であることを検証する
3. 権限がない場合は SystemPermissionDeniedError を返す
4. `PluginRepository.findById(pluginId)` でプラグインを取得する
5. プラグインが存在しない場合は PluginNotFoundError を返す
6. isActive が false の場合:
   - プリインストール済みプラグイン（`isPreinstalled === true`）の場合は PreinstalledPluginError を返す
   - `Plugin.deactivate()` を呼び出す
7. isActive が true の場合、`Plugin.activate()` を呼び出す
8. `PluginRepository.save(plugin)` で永続化する
9. 更新後のプラグインを出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 操作者にシステム管理権限がない | SystemPermissionDeniedError |
| プラグインが存在しない | PluginNotFoundError |
| プリインストール済みプラグインを無効化しようとした | PreinstalledPluginError |

---

## 42. プラグイン削除

### 概要

プラグインをシステムから削除する。プリインストール済みプラグインは削除不可。システム管理権限が必要。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| pluginId | PluginId | 必須 | 有効な PluginId 形式であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| (なし) | void |

### 処理フロー

1. Identity ドメインのポートから operatorId のユーザーコンテキストを取得する
2. AccessControl ドメインのポートで操作者のシステム権限を評価し、`systemAdmin` 権限があること、または `userContext.isCybozuAdmin` が true であることを検証する
3. 権限がない場合は SystemPermissionDeniedError を返す
4. `PluginRepository.findById(pluginId)` でプラグインを取得する
5. プラグインが存在しない場合は PluginNotFoundError を返す
6. プリインストール済みプラグイン（`isPreinstalled === true`）の場合は PreinstalledPluginError を返す
7. `PluginRepository.delete(pluginId)` でプラグインを削除する

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 操作者にシステム管理権限がない | SystemPermissionDeniedError |
| プラグインが存在しない | PluginNotFoundError |
| プリインストール済みプラグインを削除しようとした | PreinstalledPluginError |
