# App ドメイン設計

## 概要

App ドメインは、OpenDesk における業務アプリケーションのライフサイクル全体を管理するコアドメインである。アプリの作成・フォーム設計・ビュー定義・グラフ/レポート・プロセス管理定義・カスタマイズ・API連携設定など、アプリの「構造と設定」に関するすべてのビジネスロジックを担う。

**ドメイン種別**: Core（最も複雑なビジネスロジックを持つ）

**責務境界**:
- アプリの構造定義（スキーマ）を管理する（データ操作は Record ドメイン）
- プロセス管理の「定義」を管理する（ステータス変更の「実行」は Record ドメイン）
- 通知条件の「設定」を管理する（通知の「配信」は Notification ドメイン）
- アクセス権の設定は AccessControl ドメインに委譲する

---

## ユビキタス言語

| 用語 | 英語 | 定義 |
|------|------|------|
| アプリ | App | 業務データを管理するためのデータベースアプリケーション。フォーム・ビュー・グラフ等の設定を持つ |
| フィールド | Field | アプリのフォームを構成するデータ入力項目。型ごとに固有のプロパティを持つ |
| フィールドコード | FieldCode | フィールドを一意に識別する文字列。API やカスタマイズで使用する |
| フォームレイアウト | FormLayout | フィールドの配置・順序・グルーピングを定義する構造 |
| ビュー（一覧） | View | レコードの表示形式を定義する。表形式・カレンダー形式・カスタマイズの3種類 |
| グラフ/レポート | Report | レコードの集計・可視化を定義する。9種類のグラフタイプをサポート |
| 定期レポート | PeriodicReport | グラフの集計結果を定期的にスナップショットとして記録する機能 |
| プロセス管理 | ProcessDefinition | レコードの業務フロー（ステータス遷移）を定義する機能 |
| ステータス | ProcessStatus | プロセス管理におけるレコードの状態。初期ステータスは削除不可 |
| アクション（プロセス） | ProcessTransition | ステータス間の遷移ルール。遷移元・アクション名・遷移先・作業者・条件で構成 |
| デプロイ | Deploy | 動作テスト環境（preview）の設定を運用環境（production）に反映する操作 |
| リバート | Revert | 動作テスト環境の未デプロイ変更を破棄し、運用環境の設定に戻す操作 |
| リビジョン | Revision | アプリ設定のバージョン番号。楽観的ロックに使用する |
| デザインテーマ | AppTheme | アプリの外観テーマ。6種類から選択 |
| ルックアップ | Lookup | 他のアプリのレコードを参照してフィールド値をコピーする機能 |
| 関連レコード一覧 | ReferenceTable | 他のアプリのレコードを条件に基づいて表示する機能 |
| サブテーブル | Subtable | レコード内に行を動的に追加できるテーブル構造 |
| Webhook | WebhookConfig | レコード操作時に外部URLへHTTPリクエストを送信する設定 |
| APIトークン | ApiTokenConfig | REST APIへのアクセスに使用するトークンとそのスコープ設定 |
| アクション（レコード再利用） | AppAction | レコードのデータを別アプリに転記するための設定 |
| カテゴリー | AppCategory | レコードを階層的に分類するための設定 |
| 通知条件設定 | AppNotificationConfig | アプリ・レコード・リマインダーの通知トリガー条件を定義する設定 |
| カスタマイズ | AppCustomization | JavaScript/CSS ファイルによるアプリの外観・動作のカスタマイズ |
| プラグイン | PluginConfig | アプリに追加するプラグインとその設定 |

---

## エンティティ

### 1. App（アプリ）

アプリケーションの基本情報とライフサイクルを管理する集約ルート。

```typescript
type App = {
  appId: AppId;
  code: AppCode | null;           // アプリコード（任意、ユニーク、英数字、先頭は英字）
  name: AppName;                  // アプリ名（必須、1-64文字）
  description: string | null;     // アプリの説明（リッチテキスト、最大10,000文字）
  spaceId: SpaceId | null;        // 所属スペース（任意）
  threadId: ThreadId | null;      // 所属スレッド（任意、spaceId と連動）
  theme: AppTheme;                // デザインテーマ
  icon: AppIcon;                  // アプリアイコン
  titleField: TitleFieldConfig;   // レコードタイトルフィールド設定
  enableThumbnails: boolean;      // サムネイル表示
  enableBulkDeletion: boolean;    // 一括削除
  enableRecordHistory: boolean;   // 変更履歴記録
  enableComments: boolean;        // コメント機能
  enableDuplicateRecord: boolean; // レコード複製
  enableInlineEditing: boolean;   // インライン編集
  numberPrecision: NumberPrecision; // 数値精度設定
  firstMonthOfFiscalYear: number; // 年度開始月（1-12）
  revision: Revision;             // リビジョン番号
  status: AppStatus;              // アプリ状態
  creatorId: UserId;              // 作成者
  modifierId: UserId;             // 最終更新者
  createdAt: Date;                // 作成日時
  updatedAt: Date;                // 更新日時
};
```

**振る舞い**:

| メソッド | シグネチャ | 説明 |
|----------|-----------|------|
| rename | `rename(name: AppName): void` | アプリ名を変更する |
| setCode | `setCode(code: AppCode \| null): void` | アプリコードを設定する |
| setDescription | `setDescription(description: string \| null): void` | 説明を設定する（最大10,000文字） |
| setTheme | `setTheme(theme: AppTheme): void` | デザインテーマを変更する |
| setIcon | `setIcon(icon: AppIcon): void` | アイコンを変更する |
| setTitleField | `setTitleField(config: TitleFieldConfig): void` | レコードタイトルフィールドを設定する |
| setNumberPrecision | `setNumberPrecision(precision: NumberPrecision): void` | 数値精度を変更する |
| setFiscalYearStart | `setFiscalYearStart(month: number): void` | 年度開始月を変更する |
| updateFeatureFlags | `updateFeatureFlags(flags: AppFeatureFlags): void` | 各種機能の有効/無効を変更する |
| deploy | `deploy(): void` | preview から production へデプロイする。status を ACTIVE に変更 |
| revert | `revert(): void` | 未デプロイの変更を破棄する |
| incrementRevision | `incrementRevision(): void` | リビジョンを1増加する |
| checkRevision | `checkRevision(expectedRevision: Revision): void` | 楽観的ロックの競合チェック |
| markAsDeleted | `markAsDeleted(): void` | 論理削除する |
| restore | `restore(): void` | 論理削除から復元する |
| assignToSpace | `assignToSpace(spaceId: SpaceId, threadId: ThreadId): void` | スペースに所属させる |
| removeFromSpace | `removeFromSpace(): void` | スペースから切り離す |

**不変条件**:
- `name` は1文字以上64文字以下
- `code` は設定する場合、英字で始まる半角英数字でシステム全体でユニーク
- `revision` は単調増加する（0以上の整数）
- `threadId` は `spaceId` がある場合のみ設定可能
- `description` は最大10,000文字
- `firstMonthOfFiscalYear` は1-12の整数
- 削除済み（DELETED）のアプリへの設定変更は不可

**ライフサイクル**:
1. **作成**: `PREVIEW` 状態で作成（白紙/テンプレート/Excel/CSV/既存アプリ再利用）
2. **設定**: preview 環境でフォーム・ビュー・グラフ等を設定
3. **デプロイ**: `ACTIVE` 状態に遷移（運用環境に反映）
4. **運用**: レコードの CRUD が可能に
5. **再設定**: preview 環境で変更 → 再デプロイ
6. **削除**: `DELETED` 状態に遷移（論理削除）
7. **復元**: `DELETED` から `ACTIVE` に復元可能

---

### 2. Field（フィールド）

アプリのフォームを構成するフィールドを管理するエンティティ。

```typescript
type Field = {
  fieldId: FieldId;
  appId: AppId;                        // 所属アプリ
  fieldCode: FieldCode;                // フィールドコード（アプリ内ユニーク）
  label: string;                       // フィールド名（必須）
  noLabel: boolean;                    // フィールド名を非表示にするか
  fieldType: FieldType;                // フィールドタイプ
  required: boolean;                   // 必須項目か
  unique: boolean;                     // 値の重複を禁止するか
  defaultValue: FieldDefaultValue | null; // 初期値
  properties: FieldProperties;         // フィールドタイプ固有のプロパティ
};
```

**振る舞い**:

| メソッド | シグネチャ | 説明 |
|----------|-----------|------|
| updateLabel | `updateLabel(label: string): void` | フィールド名を変更する |
| updateFieldCode | `updateFieldCode(code: FieldCode): void` | フィールドコードを変更する。システムフィールドは不可 |
| setNoLabel | `setNoLabel(noLabel: boolean): void` | フィールド名の表示/非表示を切り替える |
| setRequired | `setRequired(required: boolean): void` | 必須項目の設定を変更する |
| setUnique | `setUnique(unique: boolean): void` | 重複禁止の設定を変更する |
| setDefaultValue | `setDefaultValue(value: FieldDefaultValue \| null): void` | 初期値を設定する |
| updateProperties | `updateProperties(props: FieldProperties): void` | フィールドタイプ固有のプロパティを更新する |
| validate | `validate(value: unknown): ValidationResult` | 値がフィールド定義に適合するか検証する |
| isSystemField | `isSystemField(): boolean` | システムフィールドかどうか判定する |
| isImmutableAfterSave | `isImmutableAfterSave(): boolean` | 保存後に変更不可のプロパティがあるか判定する |
| canBeInSubtable | `canBeInSubtable(): boolean` | サブテーブル内に配置可能か判定する |

**不変条件**:
- `fieldCode` はアプリ内でユニーク
- システムフィールド（RECORD_NUMBER, CREATOR, MODIFIER, CREATED_TIME, UPDATED_TIME）の `fieldType` は変更不可
- ルックアップの `relatedAppId` と `relatedKeyField` は保存後に変更不可
- 関連レコード一覧の `relatedAppId` は保存後に変更不可
- `required` を設定できるフィールドタイプは限定される（ラジオボタン等は不可）
- `unique` を設定できるフィールドタイプは限定される（文字列1行、数値、日付、日時、リンク）
- リンクフィールドの `protocol` は保存後に変更不可

**ライフサイクル**:
1. **作成**: フォーム設計画面でフィールドを追加
2. **設定**: プロパティの編集
3. **保存**: preview 環境に保存（一部プロパティはこの時点でイミュータブルになる）
4. **デプロイ**: production 環境に反映
5. **削除**: フォームから削除（グループ/テーブル削除時は内部フィールドも連鎖削除）

---

### 3. FormLayout（フォームレイアウト）

フィールドの配置・順序・グルーピングを管理するエンティティ。

```typescript
type FormLayout = {
  appId: AppId;
  rows: LayoutRow[];                   // 行単位のレイアウト構造（順序付き）
  revision: Revision;
};

type LayoutRow = {
  type: LayoutRowType;                 // ROW | SUBTABLE | GROUP
  code: FieldCode | null;             // SUBTABLE/GROUP のフィールドコード（ROW は null）
  fields: LayoutField[];              // 行内のフィールド
  innerLayout: LayoutRow[] | null;    // GROUP 内のネストレイアウト
};

type LayoutField = {
  type: FieldType;                    // フィールドタイプ
  code: FieldCode | null;            // フィールドコード（LABEL, SPACER, HR は null の場合あり）
  label: string | null;              // ラベルテキスト（LABEL タイプのみ）
  elementId: string | null;          // 要素ID（LABEL, SPACER, HR 用）
  size: FieldSize;                   // 表示サイズ
};
```

**振る舞い**:

| メソッド | シグネチャ | 説明 |
|----------|-----------|------|
| addField | `addField(field: LayoutField, position: LayoutPosition): void` | フィールドを指定位置に追加する |
| removeField | `removeField(fieldCode: FieldCode): void` | フィールドをレイアウトから削除する |
| moveField | `moveField(fieldCode: FieldCode, newPosition: LayoutPosition): void` | フィールドの位置を移動する |
| addGroup | `addGroup(code: FieldCode, openGroup: boolean, innerFields: LayoutField[]): void` | グループを追加する |
| addSubtable | `addSubtable(code: FieldCode, fields: LayoutField[]): void` | サブテーブルを追加する |
| removeRow | `removeRow(index: number): void` | 行を削除する |
| reorderRows | `reorderRows(order: number[]): void` | 行の順序を変更する |
| resizeField | `resizeField(fieldCode: FieldCode, size: FieldSize): void` | フィールドのサイズを変更する |
| replaceAll | `replaceAll(rows: LayoutRow[]): void` | レイアウト全体を置き換える |

**不変条件**:
- すべてのフォームフィールドがレイアウトに含まれなければならない
- サブテーブル内に配置不可のフィールドタイプはサブテーブル内に配置できない
- グループ内にサブテーブルをネストできない

---

### 4. View（ビュー/一覧）

レコードの表示形式を定義するエンティティ。

```typescript
type View = {
  viewId: ViewId;
  appId: AppId;
  viewName: string;                    // 一覧名（必須、アプリ内ユニーク）
  viewType: ViewType;                  // LIST | CALENDAR | CUSTOM
  fields: FieldCode[];                 // 表示フィールド（LIST のみ）
  calendarDateField: FieldCode | null; // カレンダー日付フィールド（CALENDAR のみ）
  calendarTitleField: FieldCode | null;// カレンダータイトルフィールド（CALENDAR のみ）
  html: string | null;                 // カスタムHTML（CUSTOM のみ）
  pager: boolean;                      // ページネーション表示（CUSTOM のみ）
  deviceScope: DeviceScope | null;     // 表示範囲（CUSTOM のみ: PC_AND_MOBILE | PC_ONLY）
  filterCondition: string | null;      // 絞り込み条件（クエリ文字列）
  sort: SortSpec[];                    // ソート条件
  index: number;                       // 表示順序
  builtinType: BuiltinViewType | null; // ビルトイン種別（ASSIGNEE | ALL）
};
```

**振る舞い**:

| メソッド | シグネチャ | 説明 |
|----------|-----------|------|
| rename | `rename(name: string): void` | 一覧名を変更する |
| setFields | `setFields(fields: FieldCode[]): void` | 表示フィールドを設定する（LIST のみ） |
| setCalendarFields | `setCalendarFields(dateField: FieldCode, titleField: FieldCode): void` | カレンダーフィールドを設定する（CALENDAR のみ） |
| setHtml | `setHtml(html: string): void` | カスタムHTMLを設定する（CUSTOM のみ） |
| setFilter | `setFilter(condition: string \| null): void` | 絞り込み条件を設定する |
| setSort | `setSort(sort: SortSpec[]): void` | ソート条件を設定する |
| reorder | `reorder(index: number): void` | 表示順序を変更する |
| isBuiltin | `isBuiltin(): boolean` | ビルトイン一覧か判定する |
| duplicate | `duplicate(newName: string): View` | ビューを複製する |

**不変条件**:
- `viewName` はアプリ内でユニーク
- CALENDAR 形式は日付/日時型フィールドを1つ指定する必要がある
- ビルトイン一覧（作業者が自分、すべて）は複製・削除不可
- LIST 形式は1つ以上のフィールドを含む必要がある

---

### 5. Report（グラフ/レポート）

レコードの集計・可視化を定義するエンティティ。

```typescript
type Report = {
  reportId: ReportId;
  appId: AppId;
  reportName: string;                  // グラフ名（必須）
  chartType: ChartType;               // グラフ種別（9種類）
  chartSubType: ChartSubType | null;  // サブタイプ（棒グラフ・面グラフのみ）
  groups: ReportGroup[];               // 分類項目（最大3: 大項目/中項目/小項目）
  aggregations: ReportAggregation[];   // 集計方法（最大10、PIVOT_TABLE は最大1）
  filterCondition: string | null;      // 絞り込み条件
  sort: ReportSortSpec[];              // ソート条件
  periodicReport: PeriodicReportConfig | null; // 定期レポート設定
};
```

**振る舞い**:

| メソッド | シグネチャ | 説明 |
|----------|-----------|------|
| rename | `rename(name: string): void` | グラフ名を変更する（定期レポート有効時も変更可能） |
| setChartType | `setChartType(type: ChartType, subType: ChartSubType \| null): void` | グラフ種別を変更する（定期レポート有効時は不可） |
| setGroups | `setGroups(groups: ReportGroup[]): void` | 分類項目を設定する（最大3） |
| setAggregations | `setAggregations(aggs: ReportAggregation[]): void` | 集計方法を設定する |
| setFilter | `setFilter(condition: string \| null): void` | 絞り込み条件を設定する |
| setSort | `setSort(sort: ReportSortSpec[]): void` | ソート条件を設定する |
| enablePeriodicReport | `enablePeriodicReport(config: PeriodicReportConfig): void` | 定期レポートを有効化する |
| disablePeriodicReport | `disablePeriodicReport(): void` | 定期レポートを無効化する |
| pausePeriodicReport | `pausePeriodicReport(): void` | 定期レポートを一時停止する |
| resumePeriodicReport | `resumePeriodicReport(): void` | 定期レポートを再開する |
| isSettingsLocked | `isSettingsLocked(): boolean` | 定期レポート有効化によりグラフ設定がロックされているか判定する |

**不変条件**:
- `groups` は最大3つ（大項目/中項目/小項目）
- `aggregations` は最大10（PIVOT_TABLE の場合は最大1）
- PIVOT_TABLE は大項目と中項目の両方が必須
- 定期レポートを一度有効化すると、`reportName` 以外のグラフ設定は変更不可
- スナップショットは最大30件保持（超過分は古い順に削除）

---

### 6. ProcessDefinition（プロセス管理定義）

レコードの業務フロー（ステータス遷移）を定義するエンティティ。

```typescript
type ProcessDefinition = {
  appId: AppId;
  isEnabled: boolean;                  // プロセス管理の有効/無効
  statuses: ProcessStatus[];           // ステータス一覧（順序付き）
  transitions: ProcessTransition[];    // 遷移ルール一覧
  revision: Revision;
};
```

**振る舞い**:

| メソッド | シグネチャ | 説明 |
|----------|-----------|------|
| enable | `enable(): void` | プロセス管理を有効化する |
| disable | `disable(): void` | プロセス管理を無効化する |
| addStatus | `addStatus(name: string, insertAfter: ProcessStatusId \| null): void` | ステータスを追加する |
| renameStatus | `renameStatus(statusId: ProcessStatusId, name: string): void` | ステータス名を変更する |
| removeStatus | `removeStatus(statusId: ProcessStatusId): void` | ステータスを削除する（初期ステータスは不可） |
| reorderStatuses | `reorderStatuses(order: ProcessStatusId[]): void` | ステータスの順序を変更する（初期ステータスの位置は固定） |
| addTransition | `addTransition(transition: ProcessTransitionInput): void` | 遷移ルールを追加する |
| updateTransition | `updateTransition(transitionId: ProcessTransitionId, input: ProcessTransitionInput): void` | 遷移ルールを更新する |
| removeTransition | `removeTransition(transitionId: ProcessTransitionId): void` | 遷移ルールを削除する |
| getTransitionsFromStatus | `getTransitionsFromStatus(statusId: ProcessStatusId): ProcessTransition[]` | 指定ステータスからの遷移を取得する |
| isTerminalStatus | `isTerminalStatus(statusId: ProcessStatusId): boolean` | アクションが定義されていない終端ステータスか判定する |

**不変条件**:
- 初期ステータス（リスト先頭）は削除不可・並び替え不可
- 有効化する場合、少なくとも初期ステータスが存在する必要がある
- 同一ステータスから複数のアクション（分岐）を定義可能
- 遷移元と遷移先のステータスはともに存在するステータスでなければならない
- 削除するステータスが遷移ルールで参照されている場合は削除不可

---

### 7. WebhookConfig（Webhook設定）

レコード操作時に外部URLへ通知する設定を管理するエンティティ。

```typescript
type WebhookConfig = {
  webhookId: WebhookId;
  appId: AppId;
  url: WebhookUrl;                     // Webhook URL（HTTPS 必須）
  description: string;                 // 説明
  events: WebhookEvent[];              // トリガーイベント
  isActive: boolean;                   // 有効/無効
};
```

**振る舞い**:

| メソッド | シグネチャ | 説明 |
|----------|-----------|------|
| setUrl | `setUrl(url: WebhookUrl): void` | Webhook URLを設定する |
| setDescription | `setDescription(description: string): void` | 説明を設定する |
| setEvents | `setEvents(events: WebhookEvent[]): void` | トリガーイベントを設定する |
| activate | `activate(): void` | Webhookを有効化する |
| deactivate | `deactivate(): void` | Webhookを無効化する |

**不変条件**:
- `url` は HTTPS のみ許可
- 1アプリあたり最大10個
- レート制限: 60リクエスト/分

---

### 8. ApiTokenConfig（APIトークン設定）

REST API アクセス用のトークンとスコープを管理するエンティティ。

```typescript
type ApiTokenConfig = {
  tokenId: ApiTokenId;
  appId: AppId;
  tokenHash: string;                   // トークン（ハッシュ保存）
  scopes: ApiScope[];                  // 付与するスコープ
  memo: string;                        // 用途メモ
};
```

**振る舞い**:

| メソッド | シグネチャ | 説明 |
|----------|-----------|------|
| updateScopes | `updateScopes(scopes: ApiScope[]): void` | スコープを変更する |
| updateMemo | `updateMemo(memo: string): void` | メモを変更する |
| regenerate | `regenerate(): string` | トークンを再生成し、新しいトークン文字列を返す |

**不変条件**:
- 1アプリあたり最大20個
- `scopes` は1つ以上設定する必要がある

---

### 9. AppNotificationConfig（通知条件設定）

アプリに関する通知条件を管理するエンティティ。通知の「設定」を管理し、実際の通知配信は Notification ドメインが担う。

```typescript
type AppNotificationConfig = {
  appId: AppId;
  generalNotifications: GeneralNotification[];     // アプリの条件通知
  perRecordNotifications: PerRecordNotification[]; // レコードの条件通知
  reminderNotifications: ReminderNotification[];   // リマインダーの条件通知
  revision: Revision;
};

type GeneralNotification = {
  recipients: NotificationRecipient[];             // 通知先
  events: GeneralNotificationEvent[];              // トリガーイベント
  enableCommentTracking: boolean;                  // コメント追跡
};

type PerRecordNotification = {
  filterCondition: string;                         // レコード条件式
  recipients: NotificationRecipient[];             // 通知先
};

type ReminderNotification = {
  dateFieldCode: FieldCode;                        // 起算日付フィールド
  offsetDays: number;                              // 相対日数（負=前、正=後）
  offsetTime: string | null;                       // 時刻
  timezone: string;                                // タイムゾーン
  recipients: NotificationRecipient[];             // 通知先
};

type NotificationRecipient = {
  type: RecipientType;    // USER | ORGANIZATION | GROUP | FIELD_ENTITY | CREATOR | MODIFIER
  code: string | null;    // エンティティコード
  fieldCode: FieldCode | null; // フォームフィールド指定時
};
```

**振る舞い**:

| メソッド | シグネチャ | 説明 |
|----------|-----------|------|
| setGeneralNotifications | `setGeneralNotifications(notifications: GeneralNotification[]): void` | アプリ条件通知を設定する |
| setPerRecordNotifications | `setPerRecordNotifications(notifications: PerRecordNotification[]): void` | レコード条件通知を設定する |
| setReminderNotifications | `setReminderNotifications(notifications: ReminderNotification[]): void` | リマインダーを設定する |

**不変条件**:
- リマインダーは日付/日時型フィールドが必要

---

### 10. AppAction（アクション/レコード再利用）

レコードデータを別アプリに転記するための設定を管理するエンティティ。

```typescript
type AppAction = {
  actionId: AppActionId;
  appId: AppId;                        // コピー元アプリ
  actionName: string;                  // アクション名（レコード画面のボタン名）
  destinationAppId: AppId;             // コピー先アプリ
  fieldMappings: ActionFieldMapping[]; // フィールドマッピング
  allowedEntities: ActionAllowedEntity[]; // 利用可能なユーザー/組織/グループ
  filterCondition: string | null;      // 利用条件
  index: number;                       // 表示順序
};

type ActionFieldMapping = {
  srcFieldCode: FieldCode;             // コピー元フィールド
  destFieldCode: FieldCode;            // コピー先フィールド
};
```

**振る舞い**:

| メソッド | シグネチャ | 説明 |
|----------|-----------|------|
| rename | `rename(name: string): void` | アクション名を変更する |
| setDestination | `setDestination(appId: AppId): void` | コピー先アプリを変更する |
| setFieldMappings | `setFieldMappings(mappings: ActionFieldMapping[]): void` | フィールドマッピングを設定する |
| setAllowedEntities | `setAllowedEntities(entities: ActionAllowedEntity[]): void` | 利用者を設定する |
| setFilter | `setFilter(condition: string \| null): void` | 利用条件を設定する |
| reorder | `reorder(index: number): void` | 表示順序を変更する |

**不変条件**:
- フィールドマッピングは型が一致するフィールド間でのみ設定可能
- 同じアプリへの自己転記も可能

---

### 11. AppCustomization（カスタマイズ設定）

JavaScript/CSS ファイルによるカスタマイズ設定を管理するエンティティ。

```typescript
type AppCustomization = {
  appId: AppId;
  scope: CustomizationScope;           // 適用範囲
  desktop: PlatformCustomization;      // PC用カスタマイズ
  mobile: PlatformCustomization;       // スマートフォン用カスタマイズ
  revision: Revision;
};

type PlatformCustomization = {
  jsFiles: CustomizationFile[];        // JavaScript ファイル
  cssFiles: CustomizationFile[];       // CSS ファイル
};

type CustomizationFile = {
  type: CustomizationFileType;         // URL | FILE
  url: string | null;                  // URL 指定時
  fileKey: string | null;              // アップロードファイル時
  name: string | null;                 // ファイル名
};
```

**振る舞い**:

| メソッド | シグネチャ | 説明 |
|----------|-----------|------|
| setScope | `setScope(scope: CustomizationScope): void` | 適用範囲を変更する |
| setDesktopJs | `setDesktopJs(files: CustomizationFile[]): void` | PC用JSファイルを設定する |
| setDesktopCss | `setDesktopCss(files: CustomizationFile[]): void` | PC用CSSファイルを設定する |
| setMobileJs | `setMobileJs(files: CustomizationFile[]): void` | スマートフォン用JSファイルを設定する |
| setMobileCss | `setMobileCss(files: CustomizationFile[]): void` | スマートフォン用CSSファイルを設定する |

**不変条件**:
- アップロードファイルは最大20MB
- `scope` は ALL_USERS / ADMIN_ONLY / NONE の3択

---

### 12. PluginConfig（プラグイン設定）

アプリに追加するプラグインの設定を管理するエンティティ。

```typescript
type PluginConfig = {
  pluginId: PluginId;
  appId: AppId;
  isActive: boolean;                   // 有効/無効
  config: string;                      // プラグイン設定（JSON 文字列、最大256KB）
};
```

**振る舞い**:

| メソッド | シグネチャ | 説明 |
|----------|-----------|------|
| activate | `activate(): void` | プラグインを有効化する |
| deactivate | `deactivate(): void` | プラグインを無効化する |
| updateConfig | `updateConfig(config: string): void` | 設定を更新する（最大256KB） |

**不変条件**:
- `config` は最大256KB
- プラグイン自体の登録はシステム管理画面で行う（このエンティティはアプリへの適用設定のみ）

---

### 13. AppCategory（カテゴリー設定）

レコードの階層的分類を定義するエンティティ。

```typescript
type AppCategory = {
  appId: AppId;
  isEnabled: boolean;                  // カテゴリーの有効/無効
  categories: CategoryNode[];          // カテゴリーツリー（階層構造）
  revision: Revision;
};

type CategoryNode = {
  categoryId: CategoryId;
  name: string;                        // カテゴリー名
  children: CategoryNode[];            // 子カテゴリー
};
```

**振る舞い**:

| メソッド | シグネチャ | 説明 |
|----------|-----------|------|
| enable | `enable(): void` | カテゴリーを有効化する |
| disable | `disable(): void` | カテゴリーを無効化する |
| addCategory | `addCategory(name: string, parentId: CategoryId \| null): CategoryId` | カテゴリーを追加する |
| renameCategory | `renameCategory(categoryId: CategoryId, name: string): void` | カテゴリー名を変更する |
| removeCategory | `removeCategory(categoryId: CategoryId): void` | カテゴリーを削除する |
| moveCategory | `moveCategory(categoryId: CategoryId, newParentId: CategoryId \| null, index: number): void` | カテゴリーを移動する |
| addChildCategory | `addChildCategory(parentId: CategoryId, name: string): CategoryId` | 子カテゴリーを追加する |

**不変条件**:
- カテゴリー名は必須
- 階層構造を持つ（親子関係）

---

### 14. AppI18nConfig（多言語名設定）

アプリの各項目名を言語ごとに設定するエンティティ。

```typescript
type AppI18nConfig = {
  appId: AppId;
  translations: I18nTranslation[];
  revision: Revision;
};

type I18nTranslation = {
  scope: I18nScope;                    // GENERAL | FORM | VIEW | PROCESS | REPORT | CATEGORY | ACTION
  itemKey: string;                     // 対象項目の識別子
  localizedNames: LocalizedName[];     // 言語ごとの名称
};

type LocalizedName = {
  language: AppLanguage;               // 言語コード
  value: string;                       // 翻訳テキスト
};
```

**振る舞い**:

| メソッド | シグネチャ | 説明 |
|----------|-----------|------|
| setTranslation | `setTranslation(scope: I18nScope, itemKey: string, language: AppLanguage, value: string): void` | 翻訳を設定する |
| removeTranslation | `removeTranslation(scope: I18nScope, itemKey: string, language: AppLanguage): void` | 翻訳を削除する |
| getLocalizedName | `getLocalizedName(scope: I18nScope, itemKey: string, language: AppLanguage): string \| null` | 翻訳テキストを取得する |

**不変条件**:
- 空文字列の場合はデフォルト名称が使用される
- 対応言語は7種類（English (US), 日本語, 中文(简体), 中文(繁體), Tieng Viet, Bahasa Indonesia, Thai）

---

## 値オブジェクト

### 識別子

```typescript
type AppId = { readonly _brand: "AppId"; readonly value: string };
type FieldId = { readonly _brand: "FieldId"; readonly value: string };
type ViewId = { readonly _brand: "ViewId"; readonly value: string };
type ReportId = { readonly _brand: "ReportId"; readonly value: string };
type WebhookId = { readonly _brand: "WebhookId"; readonly value: string };
type ApiTokenId = { readonly _brand: "ApiTokenId"; readonly value: string };
type AppActionId = { readonly _brand: "AppActionId"; readonly value: string };
type ProcessStatusId = { readonly _brand: "ProcessStatusId"; readonly value: string };
type ProcessTransitionId = { readonly _brand: "ProcessTransitionId"; readonly value: string };
type CategoryId = { readonly _brand: "CategoryId"; readonly value: string };
type PluginId = { readonly _brand: "PluginId"; readonly value: string };

// 他ドメインからの参照（IDのみ）
type UserId = { readonly _brand: "UserId"; readonly value: string };
type SpaceId = { readonly _brand: "SpaceId"; readonly value: string };
type ThreadId = { readonly _brand: "ThreadId"; readonly value: string };
```

### 列挙型

```typescript
// アプリ状態
type AppStatus = "PREVIEW" | "ACTIVE" | "DELETED";

// デザインテーマ
type AppTheme = "WHITE" | "RED" | "GREEN" | "BLUE" | "YELLOW" | "BLACK";

// フィールドタイプ（全32種）
type FieldType =
  // データ入力フィールド（15種）
  | "SINGLE_LINE_TEXT"       // 文字列（1行）
  | "MULTI_LINE_TEXT"        // 文字列（複数行）
  | "RICH_TEXT"              // リッチエディター
  | "NUMBER"                 // 数値
  | "CALC"                   // 計算
  | "RADIO_BUTTON"           // ラジオボタン
  | "CHECK_BOX"              // チェックボックス
  | "MULTI_SELECT"           // 複数選択
  | "DROP_DOWN"              // ドロップダウン
  | "DATE"                   // 日付
  | "TIME"                   // 時刻
  | "DATETIME"               // 日時
  | "FILE"                   // 添付ファイル
  | "LINK"                   // リンク
  | "USER_SELECT"            // ユーザー選択
  | "ORGANIZATION_SELECT"    // 組織選択
  | "GROUP_SELECT"           // グループ選択
  // 参照フィールド（2種）
  | "LOOKUP"                 // ルックアップ
  | "REFERENCE_TABLE"        // 関連レコード一覧
  // レイアウト・構造要素（5種）
  | "LABEL"                  // ラベル
  | "SPACER"                 // スペース
  | "HR"                     // 罫線
  | "GROUP"                  // グループ
  | "SUBTABLE"               // テーブル（サブテーブル）
  // システムフィールド（5種）
  | "RECORD_NUMBER"          // レコード番号
  | "CREATOR"                // 作成者
  | "CREATED_TIME"           // 作成日時
  | "MODIFIER"               // 更新者
  | "UPDATED_TIME"           // 更新日時
  // プロセス管理系（3種、システム自動生成）
  | "STATUS"                 // ステータス
  | "STATUS_ASSIGNEE"        // 作業者
  | "CATEGORY";              // カテゴリー

// ビュータイプ
type ViewType = "LIST" | "CALENDAR" | "CUSTOM";

// ビルトインビュー種別
type BuiltinViewType = "ASSIGNEE" | "ALL";

// デバイス表示範囲
type DeviceScope = "PC_AND_MOBILE" | "PC_ONLY";

// グラフ種別
type ChartType =
  | "BAR"           // 横棒グラフ
  | "COLUMN"        // 縦棒グラフ
  | "PIE"           // 円グラフ
  | "LINE"          // 折れ線グラフ
  | "PIVOT_TABLE"   // クロス集計表
  | "TABLE"         // 表
  | "AREA"          // 面グラフ
  | "SPLINE"        // 曲線グラフ
  | "SPLINE_AREA";  // 曲線面グラフ

// グラフサブタイプ
type ChartSubType = "NORMAL" | "STACKED" | "PERCENTAGE";

// Webhook イベント
type WebhookEvent =
  | "ADD_RECORD"
  | "UPDATE_RECORD"
  | "DELETE_RECORD"
  | "UPDATE_STATUS"
  | "ADD_RECORD_COMMENT";

// API スコープ
type ApiScope =
  | "READ"           // レコード閲覧
  | "WRITE"          // レコード追加
  | "UPDATE"         // レコード編集
  | "DELETE"         // レコード削除
  | "MANAGE_APP";    // アプリ管理

// 通知イベント（アプリ条件通知）
type GeneralNotificationEvent =
  | "ADD_RECORD"
  | "UPDATE_RECORD"
  | "ADD_COMMENT"
  | "UPDATE_STATUS"
  | "IMPORT_FILE";

// 通知先タイプ
type RecipientType =
  | "USER"
  | "ORGANIZATION"
  | "GROUP"
  | "FIELD_ENTITY"    // フォームフィールド指定
  | "CREATOR"
  | "MODIFIER";

// リンクプロトコル
type LinkProtocol = "WEB" | "CALL" | "MAIL";

// カスタマイズ適用範囲
type CustomizationScope = "ALL_USERS" | "ADMIN_ONLY" | "NONE";

// カスタマイズファイル種別
type CustomizationFileType = "URL" | "FILE";

// 数値丸めモード
type RoundingMode = "HALF_EVEN" | "UP" | "DOWN";

// 計算フィールド表示形式
type CalcDisplayFormat =
  | "NUMBER"           // 数値（例：1000）
  | "NUMBER_DIGIT"     // 数値（例：1,000）
  | "DATETIME"         // 日時
  | "DATE"             // 日付
  | "TIME"             // 時刻
  | "HOUR_MINUTE"      // 時間（時間+分）
  | "DAY_HOUR_MINUTE"; // 時間（日+時間+分）

// 選択肢の表示方向
type OptionAlign = "HORIZONTAL" | "VERTICAL";

// レイアウト行タイプ
type LayoutRowType = "ROW" | "SUBTABLE" | "GROUP";

// 多言語対応の対象スコープ
type I18nScope = "GENERAL" | "FORM" | "VIEW" | "PROCESS" | "REPORT" | "CATEGORY" | "ACTION";

// 対応言語
type AppLanguage = "en" | "ja" | "zh" | "zh-TW" | "vi" | "id" | "th";

// 定期レポート集計間隔
type PeriodicInterval = "YEARLY" | "QUARTERLY" | "MONTHLY" | "WEEKLY" | "DAILY" | "HOURLY";

// 作業者割当タイプ
type WorkerEntityType = "USER" | "ORGANIZATION" | "GROUP" | "FIELD_ENTITY" | "CREATOR";

// タイトルフィールド選択モード
type TitleFieldSelectionMode = "AUTO" | "MANUAL";

// ソート順
type SortOrder = "ASC" | "DESC";
```

### 構造値オブジェクト

```typescript
// アプリ名（1-64文字）
type AppName = { readonly value: string };

// アプリコード（英字開始の半角英数字）
type AppCode = { readonly value: string };

// フィールドコード
type FieldCode = { readonly value: string };

// リビジョン番号
type Revision = { readonly value: number };

// アプリアイコン
type AppIcon = {
  type: "PRESET" | "FILE";
  key: string | null;                  // プリセットアイコンキー（PRESET 時）
  fileKey: string | null;              // アップロードファイルキー（FILE 時、最大800KB）
};

// タイトルフィールド設定
type TitleFieldConfig = {
  selectionMode: TitleFieldSelectionMode;
  fieldCode: FieldCode | null;         // MANUAL 時に指定
};

// 数値精度設定
type NumberPrecision = {
  digits: number;                      // 全体桁数（1-30）
  decimalPlaces: number;               // 小数部桁数（0-10）
  roundingMode: RoundingMode;          // 丸めモード
};

// 機能フラグ
type AppFeatureFlags = {
  enableThumbnails?: boolean;
  enableBulkDeletion?: boolean;
  enableRecordHistory?: boolean;
  enableComments?: boolean;
  enableDuplicateRecord?: boolean;
  enableInlineEditing?: boolean;
};

// Webhook URL（HTTPS 必須）
type WebhookUrl = { readonly value: string };

// ソート仕様
type SortSpec = {
  fieldCode: FieldCode;
  order: SortOrder;
};

// レポートソート仕様
type ReportSortSpec = {
  by: "TOTAL" | "GROUP1" | "GROUP2" | "GROUP3";
  order: SortOrder;
};

// レポート分類項目
type ReportGroup = {
  fieldCode: FieldCode;
  timeUnit: ReportTimeUnit | null;     // 日付/日時フィールドの場合の集計単位
};

type ReportTimeUnit = "YEAR" | "QUARTER" | "MONTH" | "WEEK" | "DAY" | "HOUR" | "MINUTE";

// レポート集計方法
type ReportAggregation = {
  fieldCode: FieldCode | null;         // null の場合はレコード数
  method: AggregationMethod;
};

type AggregationMethod = "COUNT" | "SUM" | "AVERAGE" | "MAX" | "MIN";

// 定期レポート設定
type PeriodicReportConfig = {
  interval: PeriodicInterval;          // 集計間隔
  dayOfMonth: number | null;           // 日（毎月/四半期/年の場合、1-31 または 32=末日）
  dayOfWeek: number | null;            // 曜日（毎週の場合、0=日-6=土）
  quarterMonth: number | null;         // 四半期の月（1-3）
  hourMinute: { hour: number; minute: number } | null; // 時刻（毎時以外）
  minuteOfHour: number | null;         // 分（毎時の場合、0/10/20/30/40/50）
  timezone: string;                    // タイムゾーン
  isRunning: boolean;                  // 実行中/停止中
};

// プロセスステータス
type ProcessStatus = {
  statusId: ProcessStatusId;
  name: string;                        // ステータス名
  index: number;                       // 表示順序（0始まり）
};

// プロセス遷移ルール
type ProcessTransition = {
  transitionId: ProcessTransitionId;
  fromStatusId: ProcessStatusId;       // 遷移元ステータス
  actionName: string;                  // アクション名（ボタン表示名）
  toStatusId: ProcessStatusId;         // 遷移先ステータス
  workers: WorkerAssignment[];         // 作業者設定
  filterCondition: string | null;      // 実行条件
  filterConditionType: "AND" | "OR" | null; // 条件結合（AND/OR）
};

// プロセス遷移入力
type ProcessTransitionInput = {
  fromStatusId: ProcessStatusId;
  actionName: string;
  toStatusId: ProcessStatusId;
  workers: WorkerAssignment[];
  filterCondition: string | null;
  filterConditionType: "AND" | "OR" | null;
};

// 作業者割当
type WorkerAssignment = {
  entityType: WorkerEntityType;
  entityCode: string | null;           // USER/ORGANIZATION/GROUP の場合のコード
  fieldCode: FieldCode | null;         // FIELD_ENTITY の場合のフィールドコード
  includeSubs: boolean;                // 下位組織への継承
};

// フィールドサイズ
type FieldSize = {
  width: number | null;                // 幅（ピクセル）
  height: number | null;               // 高さ（ピクセル、SPACER 等）
  innerHeight: number | null;          // 内部高さ（複数行テキスト等）
};

// レイアウト位置
type LayoutPosition = {
  rowIndex: number;                    // 行インデックス
  fieldIndex: number;                  // 行内のフィールドインデックス
};

// バリデーション結果
type ValidationResult = {
  isValid: boolean;
  errors: ValidationError[];
};

type ValidationError = {
  fieldCode: FieldCode;
  message: string;
  errorType: "REQUIRED" | "UNIQUE" | "FORMAT" | "RANGE" | "LENGTH" | "TYPE_MISMATCH";
};

// アクション許可エンティティ
type ActionAllowedEntity = {
  type: "USER" | "ORGANIZATION" | "GROUP" | "EVERYONE";
  code: string | null;                 // EVERYONE の場合は null
};

// フィールド初期値
type FieldDefaultValue =
  | { type: "STRING"; value: string }
  | { type: "STRING_LIST"; values: string[] }  // チェックボックス、複数選択
  | { type: "NOW"; }                           // 現在日時
  | { type: "LOGIN_USER"; };                   // ログインユーザー
```

### FieldProperties（フィールドタイプ固有プロパティ）

フィールドタイプごとに異なるプロパティを持つ判別共用体型。

```typescript
type FieldProperties =
  | SingleLineTextProperties
  | MultiLineTextProperties
  | RichTextProperties
  | NumberProperties
  | CalcProperties
  | RadioButtonProperties
  | CheckBoxProperties
  | MultiSelectProperties
  | DropDownProperties
  | DateProperties
  | TimeProperties
  | DateTimeProperties
  | FileProperties
  | LinkProperties
  | UserSelectProperties
  | OrganizationSelectProperties
  | GroupSelectProperties
  | LookupProperties
  | ReferenceTableProperties
  | SubtableProperties
  | GroupProperties
  | LabelProperties
  | SpacerProperties
  | HrProperties
  | RecordNumberProperties
  | CreatorProperties
  | ModifierProperties
  | CreatedTimeProperties
  | UpdatedTimeProperties
  | StatusProperties
  | StatusAssigneeProperties
  | CategoryProperties;

// 文字列（1行）
type SingleLineTextProperties = {
  type: "SINGLE_LINE_TEXT";
  expression: string | null;           // 自動計算式（null の場合は自動計算なし）
  hideExpression: boolean;             // 計算式を非表示
  minLength: number | null;            // 最小文字数
  maxLength: number | null;            // 最大文字数
};

// 文字列（複数行）
type MultiLineTextProperties = {
  type: "MULTI_LINE_TEXT";
};

// リッチエディター
type RichTextProperties = {
  type: "RICH_TEXT";
};

// 数値
type NumberProperties = {
  type: "NUMBER";
  digit: boolean;                      // 桁区切り表示
  minValue: number | null;             // 最小値
  maxValue: number | null;             // 最大値
  displayScale: number | null;         // 小数点以下の表示桁数
  unit: string | null;                 // 単位記号
  unitPosition: "BEFORE" | "AFTER";    // 単位記号の位置
};

// 計算
type CalcProperties = {
  type: "CALC";
  expression: string;                  // 計算式（必須）
  hideExpression: boolean;             // 計算式を非表示
  format: CalcDisplayFormat;           // 表示形式
  displayScale: number | null;         // 小数点以下の表示桁数
  unit: string | null;                 // 単位記号
  unitPosition: "BEFORE" | "AFTER";    // 単位記号の位置
};

// ラジオボタン
type RadioButtonProperties = {
  type: "RADIO_BUTTON";
  options: SelectOption[];             // 選択肢（順序付き）
  align: OptionAlign;                  // 表示方向（横/縦）
};

// チェックボックス
type CheckBoxProperties = {
  type: "CHECK_BOX";
  options: SelectOption[];             // 選択肢（順序付き）
  align: OptionAlign;                  // 表示方向（横/縦）
};

// 複数選択
type MultiSelectProperties = {
  type: "MULTI_SELECT";
  options: SelectOption[];             // 選択肢（順序付き）
};

// ドロップダウン
type DropDownProperties = {
  type: "DROP_DOWN";
  options: SelectOption[];             // 選択肢（順序付き）
};

// 選択肢
type SelectOption = {
  label: string;                       // 表示ラベル
  index: number;                       // 順序
};

// 日付
type DateProperties = {
  type: "DATE";
  defaultNowValue: boolean;            // レコード登録時の日付を初期値にする
};

// 時刻
type TimeProperties = {
  type: "TIME";
  defaultNowValue: boolean;            // レコード登録時の時刻を初期値にする
};

// 日時
type DateTimeProperties = {
  type: "DATETIME";
  defaultNowValue: boolean;            // レコード登録時の日時を初期値にする
};

// 添付ファイル
type FileProperties = {
  type: "FILE";
  thumbnailSize: number;               // サムネイルサイズ（50/150/250/500）
};

// リンク
type LinkProperties = {
  type: "LINK";
  protocol: LinkProtocol;              // 入力値の種類（WEB/CALL/MAIL）。保存後変更不可
  minLength: number | null;            // 最小文字数
  maxLength: number | null;            // 最大文字数
};

// ユーザー選択
type UserSelectProperties = {
  type: "USER_SELECT";
  entities: UserSelectEntity[];        // 選択肢の限定（空の場合は全ユーザー）
};

type UserSelectEntity = {
  type: "USER" | "ORGANIZATION" | "GROUP";
  code: string;
};

// 組織選択
type OrganizationSelectProperties = {
  type: "ORGANIZATION_SELECT";
  entities: OrganizationSelectEntity[]; // 選択肢の限定
};

type OrganizationSelectEntity = {
  type: "ORGANIZATION";
  code: string;
};

// グループ選択
type GroupSelectProperties = {
  type: "GROUP_SELECT";
  entities: GroupSelectEntity[];        // 選択肢の限定
};

type GroupSelectEntity = {
  type: "GROUP";
  code: string;
};

// ルックアップ
type LookupProperties = {
  type: "LOOKUP";
  relatedAppId: AppId;                 // 関連付けるアプリ（保存後変更不可）
  relatedKeyFieldCode: FieldCode;      // コピー元のキーフィールド（保存後変更不可）
  fieldMappings: LookupFieldMapping[]; // 他フィールドのコピー設定
  lookupPickerFields: FieldCode[];     // 選択ダイアログに表示するフィールド
  filterCondition: string | null;      // 絞り込み初期条件
  sort: SortSpec | null;               // ソート初期設定
};

type LookupFieldMapping = {
  srcFieldCode: FieldCode;             // コピー元フィールド
  destFieldCode: FieldCode;            // コピー先フィールド
};

// 関連レコード一覧
type ReferenceTableProperties = {
  type: "REFERENCE_TABLE";
  relatedAppId: AppId;                 // 参照するアプリ（保存後変更不可）
  condition: ReferenceTableCondition;  // 表示するレコードの条件
  additionalFilter: string | null;     // さらに絞り込む条件
  displayFields: FieldCode[];          // 表示するフィールド
  sort: SortSpec | null;               // レコードのソート
  maxRecords: number;                  // 一度に表示する最大レコード数
};

type ReferenceTableCondition = {
  thisFieldCode: FieldCode;            // このアプリのフィールド
  relatedFieldCode: FieldCode;         // 参照するアプリのフィールド
};

// サブテーブル
type SubtableProperties = {
  type: "SUBTABLE";
  fields: Field[];                     // テーブル内のフィールド
};

// グループ（フィールドグループ）
type GroupProperties = {
  type: "GROUP";
  openGroup: boolean;                  // 初期展開状態
};

// ラベル
type LabelProperties = {
  type: "LABEL";
  label: string;                       // リッチテキストコンテンツ
  elementId: string | null;            // 要素ID
};

// スペース
type SpacerProperties = {
  type: "SPACER";
  elementId: string | null;            // 要素ID
};

// 罫線
type HrProperties = {
  type: "HR";
  elementId: string | null;            // 要素ID
};

// レコード番号
type RecordNumberProperties = {
  type: "RECORD_NUMBER";
};

// 作成者
type CreatorProperties = {
  type: "CREATOR";
};

// 更新者
type ModifierProperties = {
  type: "MODIFIER";
};

// 作成日時
type CreatedTimeProperties = {
  type: "CREATED_TIME";
};

// 更新日時
type UpdatedTimeProperties = {
  type: "UPDATED_TIME";
};

// ステータス（プロセス管理有効時に自動生成）
type StatusProperties = {
  type: "STATUS";
  enabled: boolean;
};

// 作業者（プロセス管理有効時に自動生成）
type StatusAssigneeProperties = {
  type: "STATUS_ASSIGNEE";
  enabled: boolean;
};

// カテゴリー（カテゴリー有効時に自動生成）
type CategoryProperties = {
  type: "CATEGORY";
  enabled: boolean;
};
```

---

## ドメインサービス

### 1. FieldValidationService（フィールドバリデーションサービス）

フィールドタイプとプロパティに基づく値の検証ロジックを提供する。

**責務**:
- フィールドタイプに応じた値の型チェック
- 必須チェック
- ユニーク制約チェック（リポジトリ連携）
- 文字数制限チェック
- 数値範囲チェック
- 選択肢の妥当性チェック
- 計算式の構文チェック

```typescript
interface FieldValidationService {
  /** 単一フィールドの値を検証する */
  validateFieldValue(field: Field, value: unknown): ValidationResult;

  /** 複数フィールドの値を一括検証する */
  validateRecord(fields: Field[], values: Record<string, unknown>): ValidationResult;

  /** 計算式の構文を検証する */
  validateExpression(expression: string, availableFields: Field[]): ValidationResult;

  /** フィールドコードの妥当性を検証する */
  validateFieldCode(code: string, existingCodes: FieldCode[]): ValidationResult;
}
```

### 2. FormLayoutService（フォームレイアウトサービス）

フィールドのレイアウト配置に関する整合性チェックとレイアウト操作を提供する。

**責務**:
- レイアウトとフィールド一覧の整合性チェック（すべてのフィールドが配置されているか）
- サブテーブル内に配置不可のフィールドタイプの制約チェック
- グループ内にサブテーブルをネストしない制約チェック
- レイアウト変更時の整合性維持

```typescript
interface FormLayoutService {
  /** レイアウトとフィールド一覧の整合性を検証する */
  validateLayoutConsistency(layout: FormLayout, fields: Field[]): ValidationResult;

  /** フィールドがサブテーブル内に配置可能か判定する */
  canPlaceInSubtable(fieldType: FieldType): boolean;

  /** フィールド削除時にレイアウトを自動調整する */
  adjustLayoutAfterFieldDeletion(layout: FormLayout, deletedFieldCode: FieldCode): FormLayout;
}
```

### 3. AppDeploymentService（アプリデプロイサービス）

preview 環境から production 環境へのデプロイを管理する。

**責務**:
- デプロイの前提条件チェック（フォーム整合性、レイアウト整合性など）
- 複数アプリの一括デプロイ（最大300アプリ）
- デプロイのトランザクション管理
- リバート操作

```typescript
interface AppDeploymentService {
  /** 単一アプリをデプロイする */
  deploy(appId: AppId): Promise<void>;

  /** 複数アプリを一括デプロイする（最大300） */
  deployBatch(appIds: AppId[]): Promise<void>;

  /** デプロイ可能か事前検証する */
  validateForDeployment(appId: AppId): Promise<ValidationResult>;

  /** 未デプロイの変更をリバートする */
  revert(appId: AppId): Promise<void>;

  /** デプロイステータスを取得する */
  getDeployStatus(appIds: AppId[]): Promise<DeployStatus[]>;
}

type DeployStatus = {
  appId: AppId;
  status: "PROCESSING" | "SUCCESS" | "FAIL" | "CANCEL";
};
```

### 4. AppCreationService（アプリ作成サービス）

さまざまな方法でのアプリ作成を管理する。

**責務**:
- 白紙からの作成
- テンプレートからの作成
- Excel/CSV ファイルからの作成
- 既存アプリの再利用（複製）

```typescript
interface AppCreationService {
  /** 白紙からアプリを作成する */
  createBlank(name: AppName, spaceId: SpaceId | null, threadId: ThreadId | null): Promise<App>;

  /** テンプレートからアプリを作成する */
  createFromTemplate(templateId: string, name: AppName, spaceId: SpaceId | null): Promise<App>;

  /** Excel ファイルからアプリを作成する */
  createFromExcel(file: ArrayBuffer, name: AppName, spaceId: SpaceId | null): Promise<App>;

  /** CSV ファイルからアプリを作成する */
  createFromCsv(file: ArrayBuffer, name: AppName, spaceId: SpaceId | null): Promise<App>;

  /** 既存アプリを複製する */
  duplicateApp(sourceAppId: AppId, name: AppName, spaceId: SpaceId | null): Promise<App>;
}
```

---

## ポート

### 1. AppRepository（アプリリポジトリ）

```typescript
interface AppRepository {
  /** ID でアプリを取得する */
  findById(appId: AppId): Promise<App | null>;

  /** アプリコードでアプリを取得する */
  findByCode(code: AppCode): Promise<App | null>;

  /** スペースに所属するアプリ一覧を取得する */
  findBySpaceId(spaceId: SpaceId, offset: number, limit: number): Promise<App[]>;

  /** 条件に基づきアプリ一覧を取得する */
  list(filter: AppListFilter, offset: number, limit: number): Promise<App[]>;

  /** 条件に基づきアプリ数を取得する */
  count(filter: AppListFilter): Promise<number>;

  /** アプリを保存する（新規作成・更新） */
  save(app: App): Promise<void>;

  /** アプリを削除する（物理削除） */
  delete(appId: AppId): Promise<void>;

  /** アプリコードの重複チェック */
  existsByCode(code: AppCode, excludeAppId?: AppId): Promise<boolean>;

  /** 全アプリ数を取得する */
  countAll(): Promise<number>;
}

type AppListFilter = {
  ids?: AppId[];
  codes?: AppCode[];
  name?: string;                       // 部分一致
  spaceIds?: SpaceId[];
  status?: AppStatus;
};
```

### 2. FieldRepository（フィールドリポジトリ）

```typescript
interface FieldRepository {
  /** ID でフィールドを取得する */
  findById(fieldId: FieldId): Promise<Field | null>;

  /** アプリに属する全フィールドを取得する */
  findByAppId(appId: AppId): Promise<Field[]>;

  /** アプリ内のフィールドコードでフィールドを取得する */
  findByCode(appId: AppId, fieldCode: FieldCode): Promise<Field | null>;

  /** フィールドを保存する（新規作成・更新） */
  save(field: Field): Promise<void>;

  /** 複数フィールドを一括保存する */
  saveBatch(fields: Field[]): Promise<void>;

  /** フィールドを削除する */
  delete(fieldId: FieldId): Promise<void>;

  /** 複数フィールドを一括削除する */
  deleteBatch(fieldIds: FieldId[]): Promise<void>;

  /** アプリ内のフィールドコードの重複チェック */
  existsByCode(appId: AppId, fieldCode: FieldCode, excludeFieldId?: FieldId): Promise<boolean>;

  /** アプリのフィールド数を取得する */
  countByAppId(appId: AppId): Promise<number>;
}
```

### 3. FormLayoutRepository（フォームレイアウトリポジトリ）

```typescript
interface FormLayoutRepository {
  /** アプリのフォームレイアウトを取得する */
  findByAppId(appId: AppId): Promise<FormLayout | null>;

  /** フォームレイアウトを保存する */
  save(layout: FormLayout): Promise<void>;
}
```

### 4. ViewRepository（ビューリポジトリ）

```typescript
interface ViewRepository {
  /** ID でビューを取得する */
  findById(viewId: ViewId): Promise<View | null>;

  /** アプリに属する全ビューを取得する */
  findByAppId(appId: AppId): Promise<View[]>;

  /** ビューを保存する（新規作成・更新） */
  save(view: View): Promise<void>;

  /** ビューを削除する */
  delete(viewId: ViewId): Promise<void>;

  /** アプリ内のビュー名の重複チェック */
  existsByName(appId: AppId, viewName: string, excludeViewId?: ViewId): Promise<boolean>;
}
```

### 5. ReportRepository（レポートリポジトリ）

```typescript
interface ReportRepository {
  /** ID でレポートを取得する */
  findById(reportId: ReportId): Promise<Report | null>;

  /** アプリに属する全レポートを取得する */
  findByAppId(appId: AppId): Promise<Report[]>;

  /** レポートを保存する（新規作成・更新） */
  save(report: Report): Promise<void>;

  /** レポートを削除する */
  delete(reportId: ReportId): Promise<void>;
}
```

### 6. ProcessDefinitionRepository（プロセス管理定義リポジトリ）

```typescript
interface ProcessDefinitionRepository {
  /** アプリのプロセス管理定義を取得する */
  findByAppId(appId: AppId): Promise<ProcessDefinition | null>;

  /** プロセス管理定義を保存する */
  save(definition: ProcessDefinition): Promise<void>;
}
```

### 7. WebhookConfigRepository（Webhook設定リポジトリ）

```typescript
interface WebhookConfigRepository {
  /** ID で Webhook を取得する */
  findById(webhookId: WebhookId): Promise<WebhookConfig | null>;

  /** アプリに属する全 Webhook を取得する */
  findByAppId(appId: AppId): Promise<WebhookConfig[]>;

  /** Webhook を保存する（新規作成・更新） */
  save(config: WebhookConfig): Promise<void>;

  /** Webhook を削除する */
  delete(webhookId: WebhookId): Promise<void>;

  /** アプリの Webhook 数を取得する */
  countByAppId(appId: AppId): Promise<number>;
}
```

### 8. ApiTokenConfigRepository（APIトークン設定リポジトリ）

```typescript
interface ApiTokenConfigRepository {
  /** ID で APIトークンを取得する */
  findById(tokenId: ApiTokenId): Promise<ApiTokenConfig | null>;

  /** アプリに属する全 APIトークンを取得する */
  findByAppId(appId: AppId): Promise<ApiTokenConfig[]>;

  /** APIトークンを保存する（新規作成・更新） */
  save(config: ApiTokenConfig): Promise<void>;

  /** APIトークンを削除する */
  delete(tokenId: ApiTokenId): Promise<void>;

  /** アプリの APIトークン数を取得する */
  countByAppId(appId: AppId): Promise<number>;

  /** トークンハッシュで認証する */
  findByTokenHash(tokenHash: string): Promise<ApiTokenConfig | null>;
}
```

### 9. AppNotificationConfigRepository（通知条件設定リポジトリ）

```typescript
interface AppNotificationConfigRepository {
  /** アプリの通知条件設定を取得する */
  findByAppId(appId: AppId): Promise<AppNotificationConfig | null>;

  /** 通知条件設定を保存する */
  save(config: AppNotificationConfig): Promise<void>;
}
```

### 10. AppActionRepository（アクションリポジトリ）

```typescript
interface AppActionRepository {
  /** ID でアクションを取得する */
  findById(actionId: AppActionId): Promise<AppAction | null>;

  /** アプリに属する全アクションを取得する */
  findByAppId(appId: AppId): Promise<AppAction[]>;

  /** アクションを保存する（新規作成・更新） */
  save(action: AppAction): Promise<void>;

  /** アクションを削除する */
  delete(actionId: AppActionId): Promise<void>;
}
```

### 11. AppCustomizationRepository（カスタマイズ設定リポジトリ）

```typescript
interface AppCustomizationRepository {
  /** アプリのカスタマイズ設定を取得する */
  findByAppId(appId: AppId): Promise<AppCustomization | null>;

  /** カスタマイズ設定を保存する */
  save(customization: AppCustomization): Promise<void>;
}
```

### 12. PluginConfigRepository（プラグイン設定リポジトリ）

```typescript
interface PluginConfigRepository {
  /** アプリに適用されている全プラグインを取得する */
  findByAppId(appId: AppId): Promise<PluginConfig[]>;

  /** プラグイン設定を保存する */
  save(config: PluginConfig): Promise<void>;

  /** プラグイン設定を削除する */
  delete(appId: AppId, pluginId: PluginId): Promise<void>;
}
```

### 13. AppCategoryRepository（カテゴリーリポジトリ）

```typescript
interface AppCategoryRepository {
  /** アプリのカテゴリー設定を取得する */
  findByAppId(appId: AppId): Promise<AppCategory | null>;

  /** カテゴリー設定を保存する */
  save(category: AppCategory): Promise<void>;
}
```

### 14. AppI18nConfigRepository（多言語名設定リポジトリ）

```typescript
interface AppI18nConfigRepository {
  /** アプリの多言語設定を取得する */
  findByAppId(appId: AppId): Promise<AppI18nConfig | null>;

  /** 多言語設定を保存する */
  save(config: AppI18nConfig): Promise<void>;
}
```

---

## ユースケース（概要）

### アプリライフサイクル

| ユースケース | 説明 | 主要ステップ |
|-------------|------|-------------|
| アプリ作成（白紙） | 空のアプリを新規作成する | 名前入力 → preview 環境に作成 → AppId 返却 |
| アプリ作成（テンプレート） | テンプレートからアプリを作成する | テンプレート選択 → 設定コピー → preview 環境に作成 |
| アプリ作成（Excel/CSV） | ファイルからアプリを作成する | ファイル解析 → フィールド自動生成 → preview 環境に作成 |
| アプリ作成（既存アプリ再利用） | 既存アプリの設定を複製する | ソースアプリ選択 → 設定コピー → preview 環境に作成 |
| アプリ設定更新 | アプリの基本設定を変更する | リビジョンチェック → 設定変更 → リビジョン増加 |
| アプリ公開（デプロイ） | preview 設定を production に反映する | 整合性チェック → デプロイ実行（非同期） → ステータス更新 |
| アプリ取消（リバート） | 未デプロイの変更を破棄する | preview の変更を破棄 → production 設定に復元 |
| アプリ削除 | アプリを論理削除する | 削除確認 → DELETED ステータスに変更 |
| アプリ復元 | 削除されたアプリを復元する | 復元確認 → ACTIVE ステータスに変更 |

### フォーム設計

| ユースケース | 説明 | 主要ステップ |
|-------------|------|-------------|
| フィールド追加 | フォームにフィールドを追加する | フィールドタイプ選択 → プロパティ設定 → コード生成 → preview 保存 |
| フィールド更新 | フィールドのプロパティを変更する | リビジョンチェック → プロパティ変更 → イミュータブル制約チェック → 保存 |
| フィールド削除 | フォームからフィールドを削除する | 参照チェック → フィールド削除 → レイアウト自動調整 |
| フォームレイアウト更新 | フィールドの配置・順序を変更する | レイアウト変更 → 整合性チェック → 保存 |

### ビュー管理

| ユースケース | 説明 | 主要ステップ |
|-------------|------|-------------|
| ビュー作成 | 新しい一覧を作成する | タイプ選択 → 設定入力 → 名前重複チェック → 保存 |
| ビュー更新 | 一覧の設定を変更する | 設定変更 → 保存 |
| ビュー削除 | 一覧を削除する | ビルトインチェック → 削除 |

### グラフ/レポート管理

| ユースケース | 説明 | 主要ステップ |
|-------------|------|-------------|
| グラフ/レポート作成 | 新しいグラフを作成する | 種別選択 → 分類・集計設定 → 保存 |
| グラフ/レポート更新 | グラフの設定を変更する | 定期レポートロックチェック → 設定変更 → 保存 |
| グラフ/レポート削除 | グラフを削除する | 定期レポート停止確認 → 削除 |
| 定期レポート有効化 | グラフの定期記録を開始する | 間隔・時刻設定 → 有効化 → グラフ設定ロック |
| 定期レポート無効化 | 定期記録を停止する | 停止確認 → 無効化 |

### プロセス管理設定

| ユースケース | 説明 | 主要ステップ |
|-------------|------|-------------|
| プロセス管理設定 | ステータスと遷移を定義する | ステータス定義 → 遷移ルール定義 → 作業者設定 → 保存 |

### 外部連携設定

| ユースケース | 説明 | 主要ステップ |
|-------------|------|-------------|
| Webhook設定 | Webhook を追加・編集する | URL・イベント設定 → HTTPS チェック → 上限チェック → 保存 |
| APIトークン管理 | APIトークンを生成・管理する | トークン生成 → スコープ設定 → 上限チェック → 保存 |

### 通知・カスタマイズ

| ユースケース | 説明 | 主要ステップ |
|-------------|------|-------------|
| 通知条件設定 | アプリ/レコード/リマインダーの通知条件を設定する | 条件入力 → 通知先設定 → 保存 |
| カスタマイズ管理 | JS/CSS ファイルの設定を行う | 適用範囲設定 → ファイル追加 → 保存 |

### その他設定

| ユースケース | 説明 | 主要ステップ |
|-------------|------|-------------|
| アクション設定 | レコード再利用のアクションを設定する | コピー先アプリ選択 → フィールドマッピング → 保存 |
| アプリカテゴリ設定 | レコード分類のカテゴリーを設定する | カテゴリー追加/編集 → 階層構造設定 → 保存 |
| 多言語名設定 | アプリ各項目の翻訳を設定する | 対象項目・言語選択 → 翻訳入力 → 保存 |

---

## システム制約

| 制約 | 値 |
|------|-----|
| 最大アプリ数 | 1,000 |
| アプリあたりの API リクエスト数/日 | 10,000 |
| アプリあたりの最大 Webhook 数 | 10 |
| アプリあたりの最大 APIトークン数 | 20 |
| Webhook レート制限 | 60回/分 |
| 一括デプロイ最大アプリ数 | 300 |
| 定期レポート最大スナップショット数 | 30 |
| アプリ名最大文字数 | 64 |
| アプリ説明最大文字数 | 10,000 |
| プラグイン設定最大サイズ | 256KB |
| アイコンファイル最大サイズ | 800KB |
| カスタマイズファイル最大サイズ | 20MB |
