# Record ドメイン

- 種別: **Core**
- 責務: アプリに属するレコードのCRUD・プロセス管理実行・コメント・変更履歴・CSV入出力・カーソルを担う

## 概要

Record ドメインはアプリ内の全データ操作を管理するコアドメインである。レコードの作成・取得・更新・削除（一括操作含む）、リビジョンベースの楽観的ロック、25種以上のフィールド型に対応した型安全な値管理、プロセス管理のステータス遷移実行、コメント・変更履歴の管理、CSV入出力、大量データ取得のためのカーソル機能を提供する。

App ドメインがアプリの「構造定義」（フォーム設計・ビュー・グラフ等）を担うのに対し、Record ドメインはアプリの「データ操作」側を担う。フィールド定義（スキーマ）は App ドメインの責務であり、Record ドメインはフィールド定義を参照してバリデーションを行う。

## ユビキタス言語

| 用語 | 説明 |
|------|------|
| Record | アプリに属する1件のデータレコード。フィールド値の集合を持つ |
| FieldValue | フィールドコードに対応する型付きの値。type と value を持つ |
| FieldCode | フィールドを一意に識別するコード文字列 |
| Revision | レコードのバージョン番号。楽観的ロックに使用する |
| SubtableRow | サブテーブル（テーブルフィールド）内の1行。行IDとフィールド値のマップを持つ |
| ProcessStatus | プロセス管理におけるレコードの現在のステータス |
| StatusTransition | ステータス間の遷移（アクション実行）。リビジョンを2増加させる |
| Assignee | プロセス管理における作業者（ステータスに対してアクションを実行できるユーザー） |
| RecordComment | レコードに対するプレーンテキストのコメント。編集不可、削除のみ |
| Mention | コメント内の宛先指定。ユーザー・グループ・組織を対象にできる |
| RecordHistory | レコードの変更履歴。フィールドごとの文字レベル差分を記録する |
| FieldDiff | 変更履歴における1フィールドの差分情報 |
| RecordCursor | 大量データ取得のためのサーバーサイドカーソル。offset上限10,000件を超える取得に使用 |
| CsvImportJob | CSVファイルからのレコード一括読み込みジョブ |
| CsvExportJob | レコードのCSVファイル書き出しジョブ |
| ImportMode | インポート時の処理方法。追加のみ（ADD_ONLY）または追加更新（UPSERT） |
| UpdateKey | UPSERT時にレコードを特定するための重複禁止フィールド |
| RecordReuse | 既存レコードの値をコピーして新規レコードを作成する操作 |

## 他ドメインとの関係

| 参照先ドメイン | 参照方法 | 用途 |
|--------------|---------|------|
| App | AppId（値オブジェクト） | レコードが属するアプリの識別。フィールド定義の参照（バリデーション時） |
| Identity | UserId（値オブジェクト） | 作成者・更新者・作業者・コメント投稿者の識別 |
| File | FileKey（値オブジェクト） | 添付ファイルフィールドのファイル参照 |

App ドメインのフィールド定義（フィールドコード・型・制約）はバリデーション時にユースケース層で取得し、RecordValidationService に渡す。Record ドメインが App ドメインのエンティティを直接保持することはない。

---

## エンティティ

### Record

アプリに属する1件のデータレコード。フィールド値の集合とリビジョンベースの楽観的ロックを持つ。プロセス管理が有効な場合はステータスと作業者も管理する。

#### フィールド

```typescript
type Record = {
  readonly recordId: RecordId;
  readonly appId: AppId;
  revision: number;
  fieldValues: Map<FieldCode, FieldValue>;
  status: ProcessStatus | null;
  statusAssignees: UserId[];
  readonly creatorId: UserId;
  readonly createdAt: Date;
  modifierId: UserId;
  updatedAt: Date;
};
```

#### 振る舞い

```typescript
/**
 * フィールド値を更新する。
 * - ルックアップ・ステータス・カテゴリー・計算・作業者・自動計算文字列は更新不可
 * - 作成者・作成日時は更新不可（作成時のみ設定可）
 * - サブテーブルは全行を指定する必要がある（省略した行は削除される）
 * - 添付ファイルは既存の fileKey を保持して送信する必要がある
 * @throws InvalidFieldUpdateError 更新不可フィールドへの書き込み時
 * @throws SubtableRowMissingError サブテーブルの行が不完全な場合
 */
updateFieldValues(values: Map<FieldCode, FieldValue>): void;

/**
 * リビジョンを1つ増加させる。通常の更新・削除操作時に呼び出す。
 */
incrementRevision(): void;

/**
 * 指定フィールドコードの値を取得する。
 * @throws FieldNotFoundError フィールドコードが存在しない場合
 */
getFieldValue(fieldCode: FieldCode): FieldValue;

/**
 * レコードを再利用（コピー）して新規レコードの下書きを作成する。
 * - システムフィールド（レコードID、リビジョン、作成者、作成日時、更新者、更新日時）はコピーしない
 * - ステータスは初期ステータスにリセットする
 * - レコード番号は新規採番される
 * - 計算フィールドは再計算される
 * @returns コピーされたフィールド値を持つ新規レコードの下書き
 */
reuse(): Record;

/**
 * 指定リビジョンとの楽観的ロックチェックを行う。
 * revision が -1 の場合はチェックをスキップする。
 * @throws RevisionConflictError リビジョンが一致しない場合
 */
checkRevision(expectedRevision: number): void;

/**
 * プロセスのステータスを変更し、リビジョンを2つ増加させる。
 * アクション実行とステータス変更の2回分でリビジョンが2増加する。
 * @throws InvalidStatusTransitionError 無効なステータス遷移の場合
 */
changeStatus(newStatus: ProcessStatus, assignees: UserId[]): void;

/**
 * 作業者を変更する。
 * @throws TooManyAssigneesError 作業者が100名を超える場合
 */
updateAssignees(assignees: UserId[]): void;
```

#### 不変条件

- `revision` は単調増加する（減少・リセット不可）
- `creatorId`、`createdAt` はレコード作成後に変更不可
- `recordId` はレコード作成後に変更不可
- `appId` はレコード作成後に変更不可
- プロセスステータス変更時、リビジョンは必ず2増加する
- `statusAssignees` の最大要素数は100

---

### RecordComment

レコードに対するプレーンテキストのコメント。投稿後の編集は不可で、削除のみ可能。投稿者本人のみ削除できる。

#### フィールド

```typescript
type RecordComment = {
  readonly commentId: CommentId;
  readonly recordId: RecordId;
  readonly appId: AppId;
  readonly text: string;
  readonly mentions: Mention[];
  likes: Set<UserId>;
  readonly creatorId: UserId;
  readonly createdAt: Date;
};
```

#### 振る舞い

```typescript
/**
 * コメントにいいねを付与する。
 * 既にいいね済みの場合は何もしない（冪等）。
 */
addLike(userId: UserId): void;

/**
 * コメントのいいねを取り消す。
 * いいねしていない場合は何もしない（冪等）。
 */
removeLike(userId: UserId): void;

/**
 * 指定ユーザーがコメントの投稿者かどうかを判定する。
 * 削除権限の確認に使用する。
 */
isOwnedBy(userId: UserId): boolean;
```

#### 不変条件

- `text` は最大65,535文字
- `mentions` は最大10件
- 投稿後に `text` と `mentions` は変更不可（編集機能なし）
- リッチテキストは不可（プレーンテキストのみ）
- 添付ファイルは不可

---

### RecordHistory

レコードの変更履歴エントリ。フィールドごとの文字レベル差分を記録する。一度作成されたら不変。

#### フィールド

```typescript
type RecordHistory = {
  readonly historyId: HistoryId;
  readonly recordId: RecordId;
  readonly appId: AppId;
  readonly version: number;
  readonly changedFields: FieldDiff[];
  readonly modifierId: UserId;
  readonly modifiedAt: Date;
};
```

#### 振る舞い

```typescript
/**
 * 指定バージョンのフィールド差分から復元用のフィールド値を構築する。
 * 復元は新しいバージョン（RecordHistory エントリ）を生成する操作であり、
 * 既存の履歴を書き換えることはない。
 * @returns 復元対象バージョンのフィールド値マップ
 */
buildRestoreValues(): Map<FieldCode, FieldValue>;

/**
 * このバージョンがレコード作成（バージョン1）かどうかを判定する。
 */
isInitialVersion(): boolean;
```

#### 不変条件

- 全フィールドが `readonly`（作成後は不変）
- `version` は1以上の正の整数
- バージョン1はレコード作成を表す（changedFields は空）

---

### CsvImportJob

CSV/Excelファイルからのレコード一括読み込みジョブ。ファイルアップロード → フォーマット設定 → マッピング → インポート実行の流れで処理される。

#### フィールド

```typescript
type CsvImportJob = {
  readonly jobId: CsvImportJobId;
  readonly appId: AppId;
  readonly fileName: string;
  readonly fileSize: number;
  readonly encoding: CsvEncoding;
  readonly delimiter: CsvDelimiter;
  readonly importMode: ImportMode;
  readonly updateKey: FieldCode | null;
  readonly errorHandling: ErrorHandling;
  readonly fieldMappings: FieldMapping[];
  status: CsvImportJobStatus;
  processedCount: number;
  errorCount: number;
  errorDetails: CsvImportError[];
  readonly creatorId: UserId;
  readonly createdAt: Date;
};
```

#### 振る舞い

```typescript
/**
 * インポートジョブを開始する。
 * @throws InvalidJobStateError ステータスが PENDING でない場合
 * @throws FileSizeLimitExceededError ファイルサイズ制限を超過している場合
 *   - Excelブック形式: 最大1MB、1,000行
 *   - CSV形式: 最大100MB、100,000行
 */
start(): void;

/**
 * インポートジョブを正常完了にする。
 * @throws InvalidJobStateError ステータスが PROCESSING でない場合
 */
complete(processedCount: number, errorCount: number): void;

/**
 * インポートジョブを失敗にする。
 * @throws InvalidJobStateError ステータスが PROCESSING でない場合
 */
fail(reason: string): void;

/**
 * インポート中にエラーが発生した行を記録する。
 * errorHandling が CONTINUE の場合はエラー行をスキップして処理を続行、
 * STOP の場合はエラー行以降の処理を中止する。
 */
recordError(rowNumber: number, fieldCode: FieldCode, message: string): void;

/**
 * UPSERT モードで更新キーが必要かどうかを検証する。
 * @throws UpdateKeyRequiredError importMode が UPSERT で updateKey が未設定の場合
 */
validateUpdateKey(): void;
```

#### 不変条件

- `importMode` が `UPSERT` の場合、`updateKey` は必須
- ステータス遷移: `PENDING` → `PROCESSING` → `COMPLETED` | `FAILED`
- Excelブック形式のファイルサイズは最大1MB、行数は最大1,000行
- CSV形式のファイルサイズは最大100MB、行数は最大100,000行

---

### CsvExportJob

レコードのCSVファイル書き出しジョブ。フィールド選択 → フォーマット設定 → 非同期エクスポート → ダウンロードの流れで処理される。

#### フィールド

```typescript
type CsvExportJob = {
  readonly jobId: CsvExportJobId;
  readonly appId: AppId;
  readonly viewId: string | null;
  readonly encoding: CsvEncoding;
  readonly delimiter: CsvDelimiter;
  readonly includeHeader: boolean;
  readonly exportFields: FieldCode[];
  readonly includeComments: boolean;
  status: CsvExportJobStatus;
  outputFileName: string | null;
  outputFileSize: number | null;
  readonly creatorId: UserId;
  readonly createdAt: Date;
  readonly expiresAt: Date;
};
```

#### 振る舞い

```typescript
/**
 * エクスポートジョブを開始する。
 * @throws InvalidJobStateError ステータスが PENDING でない場合
 * @throws NoFieldsSelectedError exportFields が空の場合
 */
start(): void;

/**
 * エクスポートジョブを正常完了にする。
 * @throws InvalidJobStateError ステータスが PROCESSING でない場合
 */
complete(fileName: string, fileSize: number): void;

/**
 * エクスポートジョブを失敗にする。
 * @throws InvalidJobStateError ステータスが PROCESSING でない場合
 */
fail(reason: string): void;

/**
 * 出力ファイルの保持期限が切れているかを判定する。
 * 出力ファイルは作成から3日後に自動削除される。
 */
isExpired(): boolean;
```

#### 不変条件

- `expiresAt` は `createdAt` の3日後
- `exportFields` は1つ以上のフィールドコードを含む必要がある
- ステータス遷移: `PENDING` → `PROCESSING` → `COMPLETED` | `FAILED`
- 出力ファイル形式はCSVのみ（Excel形式は対象外）
- 書き出し対象レコードは現在のビューの絞り込み条件に従う

---

### RecordCursor

大量データ取得のためのサーバーサイドカーソル。offset上限（10,000件）を超えるレコードの取得に使用する。

#### フィールド

```typescript
type RecordCursor = {
  readonly cursorId: CursorId;
  readonly appId: AppId;
  readonly query: string | null;
  readonly fields: FieldCode[];
  readonly size: number;
  readonly totalCount: number;
  currentOffset: number;
  readonly createdAt: Date;
  lastAccessedAt: Date;
};
```

#### 振る舞い

```typescript
/**
 * カーソルから次のバッチのレコードを取得するためにオフセットを進める。
 * 取得するレコード数は作成時に指定された size に従う。
 * @returns 取得するレコードのオフセット範囲と残りの有無
 * @throws CursorExpiredError 有効期限（10分）が切れている場合
 */
advance(): { offset: number; size: number; hasNext: boolean };

/**
 * カーソルの有効期限が切れているかを判定する。
 * 作成時または最後のレコード取得リクエストから10分間が有効期限。
 */
isExpired(): boolean;

/**
 * カーソルへのアクセス時刻を更新する。
 * レコード取得のたびに呼び出し、有効期限をリセットする。
 */
touch(): void;

/**
 * 全レコードの取得が完了したかを判定する。
 */
isCompleted(): boolean;
```

#### 不変条件

- 有効期限は作成時または最後のアクセスから10分間
- 1回の取得で返すレコード数（`size`）は1〜500（デフォルト100）
- 1ドメインあたり同時に有効なカーソルは最大10個
- カーソル作成のタイムアウトは5分間
- 全レコード取得完了後、カーソルは自動的に削除される

---

## 値オブジェクト

### 識別子

```typescript
/** レコードを一意に識別するID */
type RecordId = {
  readonly value: string;
};

/** コメントを一意に識別するID */
type CommentId = {
  readonly value: string;
};

/** 変更履歴エントリを一意に識別するID */
type HistoryId = {
  readonly value: string;
};

/** CSVインポートジョブを一意に識別するID */
type CsvImportJobId = {
  readonly value: string;
};

/** CSVエクスポートジョブを一意に識別するID */
type CsvExportJobId = {
  readonly value: string;
};

/** カーソルを一意に識別するID */
type CursorId = {
  readonly value: string;
};
```

### FieldCode

フィールドを一意に識別するコード文字列のラッパー。

```typescript
type FieldCode = {
  readonly value: string;
};
```

### FieldValue（ユニオン型）

フィールドの型と値を保持する多態な値オブジェクト。API仕様に基づき、各フィールド型ごとに固有のvalue構造を持つ。

```typescript
/** フィールド型の列挙 */
type FieldType =
  | "SINGLE_LINE_TEXT"
  | "MULTI_LINE_TEXT"
  | "RICH_TEXT"
  | "NUMBER"
  | "CALC"
  | "CHECK_BOX"
  | "RADIO_BUTTON"
  | "MULTI_SELECT"
  | "DROP_DOWN"
  | "USER_SELECT"
  | "ORGANIZATION_SELECT"
  | "GROUP_SELECT"
  | "DATE"
  | "TIME"
  | "DATETIME"
  | "LINK"
  | "FILE"
  | "SUBTABLE"
  | "RECORD_NUMBER"
  | "CATEGORY"
  | "STATUS"
  | "STATUS_ASSIGNEE"
  | "CREATOR"
  | "CREATED_TIME"
  | "MODIFIER"
  | "UPDATED_TIME"
  | "LOOKUP"
  | "REFERENCE_TABLE"
  | "__ID__"
  | "__REVISION__";

/** 文字列（1行）の値 */
type SingleLineTextFieldValue = {
  readonly type: "SINGLE_LINE_TEXT";
  readonly value: string;
};

/** 文字列（複数行）の値。改行は \n */
type MultiLineTextFieldValue = {
  readonly type: "MULTI_LINE_TEXT";
  readonly value: string;
};

/** リッチエディターの値。HTML文字列 */
type RichTextFieldValue = {
  readonly type: "RICH_TEXT";
  readonly value: string;
};

/** 数値の値。精度を保つためstring */
type NumberFieldValue = {
  readonly type: "NUMBER";
  readonly value: string;
};

/** 計算フィールドの値。読み取り専用、サーバーで計算される */
type CalcFieldValue = {
  readonly type: "CALC";
  readonly value: string;
};

/** チェックボックスの値。複数選択肢の配列 */
type CheckBoxFieldValue = {
  readonly type: "CHECK_BOX";
  readonly value: string[];
};

/** ラジオボタンの値。単一選択肢 */
type RadioButtonFieldValue = {
  readonly type: "RADIO_BUTTON";
  readonly value: string;
};

/** 複数選択の値。複数選択肢の配列 */
type MultiSelectFieldValue = {
  readonly type: "MULTI_SELECT";
  readonly value: string[];
};

/** ドロップダウンの値。単一選択肢 */
type DropDownFieldValue = {
  readonly type: "DROP_DOWN";
  readonly value: string;
};

/** ユーザー選択の値 */
type UserSelectFieldValue = {
  readonly type: "USER_SELECT";
  readonly value: UserReference[];
};

/** 組織選択の値 */
type OrganizationSelectFieldValue = {
  readonly type: "ORGANIZATION_SELECT";
  readonly value: OrganizationReference[];
};

/** グループ選択の値 */
type GroupSelectFieldValue = {
  readonly type: "GROUP_SELECT";
  readonly value: GroupReference[];
};

/** 日付の値。YYYY-MM-DD形式 */
type DateFieldValue = {
  readonly type: "DATE";
  readonly value: string | null;
};

/** 時刻の値。HH:mm形式 */
type TimeFieldValue = {
  readonly type: "TIME";
  readonly value: string | null;
};

/** 日時の値。ISO 8601 UTC形式（YYYY-MM-DDTHH:mm:ssZ） */
type DateTimeFieldValue = {
  readonly type: "DATETIME";
  readonly value: string | null;
};

/** リンクの値。URL・電話番号・メールアドレスのいずれか */
type LinkFieldValue = {
  readonly type: "LINK";
  readonly value: string;
};

/** 添付ファイルの値 */
type FileFieldValue = {
  readonly type: "FILE";
  readonly value: FileReference[];
};

/** サブテーブル（テーブル）の値。行の配列 */
type SubtableFieldValue = {
  readonly type: "SUBTABLE";
  readonly value: SubtableRow[];
};

/** レコード番号の値。読み取り専用。アプリコード付きの場合あり（例: "APP-1"） */
type RecordNumberFieldValue = {
  readonly type: "RECORD_NUMBER";
  readonly value: string;
};

/** カテゴリーの値。読み取り専用 */
type CategoryFieldValue = {
  readonly type: "CATEGORY";
  readonly value: string[];
};

/** ステータスの値。読み取り専用。変更はプロセス管理APIで行う */
type StatusFieldValue = {
  readonly type: "STATUS";
  readonly value: string;
};

/** 作業者の値。読み取り専用 */
type StatusAssigneeFieldValue = {
  readonly type: "STATUS_ASSIGNEE";
  readonly value: UserReference[];
};

/** 作成者の値。レコード作成時のみ設定可能 */
type CreatorFieldValue = {
  readonly type: "CREATOR";
  readonly value: UserReference;
};

/** 作成日時の値。レコード作成時のみ設定可能。未来日付は不可 */
type CreatedTimeFieldValue = {
  readonly type: "CREATED_TIME";
  readonly value: string;
};

/** 更新者の値。読み取り専用 */
type ModifierFieldValue = {
  readonly type: "MODIFIER";
  readonly value: UserReference;
};

/** 更新日時の値。読み取り専用 */
type UpdatedTimeFieldValue = {
  readonly type: "UPDATED_TIME";
  readonly value: string;
};

/** ルックアップフィールドの値。参照先レコードのキーフィールド値に基づきコピーされた読み取り専用の値 */
type LookupFieldValue = {
  readonly type: "LOOKUP";
  readonly value: string | string[];  // キーフィールドの型に依存（テキスト、数値等）
};

/** 関連レコード一覧フィールドの値。参照先アプリの条件に合致するレコード一覧（読み取り専用） */
type ReferenceTableFieldValue = {
  readonly type: "REFERENCE_TABLE";
  readonly value: {
    readonly recordId: RecordId;
    readonly fieldValues: Map<FieldCode, FieldValue>;
  }[];
};

/** 全フィールド値のユニオン型 */
type FieldValue =
  | SingleLineTextFieldValue
  | MultiLineTextFieldValue
  | RichTextFieldValue
  | NumberFieldValue
  | CalcFieldValue
  | CheckBoxFieldValue
  | RadioButtonFieldValue
  | MultiSelectFieldValue
  | DropDownFieldValue
  | UserSelectFieldValue
  | OrganizationSelectFieldValue
  | GroupSelectFieldValue
  | DateFieldValue
  | TimeFieldValue
  | DateTimeFieldValue
  | LinkFieldValue
  | FileFieldValue
  | SubtableFieldValue
  | RecordNumberFieldValue
  | CategoryFieldValue
  | StatusFieldValue
  | StatusAssigneeFieldValue
  | CreatorFieldValue
  | CreatedTimeFieldValue
  | ModifierFieldValue
  | UpdatedTimeFieldValue
  | LookupFieldValue
  | ReferenceTableFieldValue;
```

### 関連する値オブジェクト

```typescript
/** ユーザー参照。code と name のペア */
type UserReference = {
  readonly code: string;
  readonly name: string;
};

/** 組織参照 */
type OrganizationReference = {
  readonly code: string;
  readonly name: string;
};

/** グループ参照 */
type GroupReference = {
  readonly code: string;
  readonly name: string;
};

/** ファイル参照。添付ファイルフィールドの各ファイル情報 */
type FileReference = {
  readonly fileKey: string;
  readonly name: string;
  readonly contentType: string;
  readonly size: number;
};

/**
 * サブテーブルの1行。
 * 更新時は既存の全行を含める必要がある（省略した行は削除される）。
 * id を省略すると新規行として追加される。
 */
type SubtableRow = {
  readonly rowId: string | null;
  readonly fields: Map<FieldCode, FieldValue>;
};
```

### FieldDiff

変更履歴におけるフィールドの差分情報。文字レベルの差分を表現する。

```typescript
type FieldDiff = {
  readonly fieldCode: FieldCode;
  readonly oldValue: string;
  readonly newValue: string;
};
```

### Mention

コメントのメンション（宛先指定）。ユーザー・グループ・組織を対象にできる。

```typescript
type MentionType = "USER" | "GROUP" | "ORGANIZATION";

type Mention = {
  readonly type: MentionType;
  readonly code: string;
};
```

### FieldMapping

CSVインポート時のフィールドとファイル列の対応付け。

```typescript
type FieldMapping = {
  readonly appFieldCode: FieldCode;
  readonly fileColumn: string;
  readonly dateFormat: string | null;
};
```

### RecordQuery

レコード取得時のクエリ条件。

```typescript
type SortDirection = "asc" | "desc";

type SortSpec = {
  readonly fieldCode: FieldCode;
  readonly direction: SortDirection;
};

type RecordQuery = {
  readonly condition: string | null;
  readonly orderBy: SortSpec[];
  readonly limit: number | null;
  readonly offset: number | null;
};
```

### CsvImportError

CSVインポート中に発生したエラーの詳細。

```typescript
type CsvImportError = {
  readonly rowNumber: number;
  readonly fieldCode: FieldCode;
  readonly message: string;
};
```

### 列挙型

```typescript
/** インポートモード */
type ImportMode =
  | "ADD_ONLY"    // 新規レコードの追加のみ
  | "UPSERT";     // 既存レコードの更新 + 新規追加

/** エラー処理方法 */
type ErrorHandling =
  | "CONTINUE"    // エラー行をスキップして処理を続行
  | "STOP";       // エラー行以降の処理を中止

/** CSV文字コード */
type CsvEncoding =
  | "SHIFT_JIS"   // Shift-JIS（日本語）
  | "LATIN1"      // Latin1（西ヨーロッパ語）
  | "GBK"         // GBK/GB2312（簡体字中国語）
  | "UTF8"        // UTF-8（Unicode）
  | "UTF8_BOM";   // BOM付きUTF-8（Unicode）

/** CSV区切り文字 */
type CsvDelimiter =
  | "COMMA"       // カンマ
  | "SEMICOLON"   // セミコロン
  | "TAB"         // タブ
  | "SPACE";      // スペース

/** CSVインポートジョブのステータス */
type CsvImportJobStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

/** CSVエクスポートジョブのステータス */
type CsvExportJobStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

/** プロセスステータス（文字列ラッパー。App ドメインで定義されたステータス名） */
type ProcessStatus = {
  readonly value: string;
};
```

---

## ポート（リポジトリインターフェース）

### RecordRepository

レコードの永続化を担当するリポジトリ。

```typescript
interface RecordRepository {
  /**
   * アプリIDとレコードIDで1件のレコードを取得する。
   * @returns レコード。存在しない場合は null
   */
  findById(appId: AppId, recordId: RecordId): Promise<Record | null>;

  /**
   * クエリ条件に一致するレコードを取得する。
   * @param appId アプリID
   * @param query クエリ条件（絞り込み・ソート・limit・offset）
   * @param fields 取得するフィールドコード（省略時は全フィールド）
   * @param totalCount true の場合、合計件数もカウントして返す
   * @returns レコードの配列と合計件数（totalCount が true の場合のみ）
   */
  findByQuery(
    appId: AppId,
    query: RecordQuery,
    fields?: FieldCode[],
    totalCount?: boolean
  ): Promise<{ records: Record[]; totalCount: number | null }>;

  /**
   * 1件のレコードを保存する（新規作成・更新の両方に対応）。
   * @returns 保存されたレコード（IDとリビジョンが確定済み）
   */
  save(record: Record): Promise<Record>;

  /**
   * 複数のレコードを一括保存する。最大100件。
   * トランザクション内で処理され、1件でも失敗すると全件ロールバックされる。
   * @throws BatchSizeLimitExceededError 100件を超える場合
   */
  saveBatch(records: Record[]): Promise<Record[]>;

  /**
   * 複数のレコードを一括削除する。最大100件。
   * トランザクション内で処理され、1件でも失敗すると全件ロールバックされる。
   * @throws BatchSizeLimitExceededError 100件を超える場合
   */
  delete(appId: AppId, recordIds: RecordId[]): Promise<void>;

  /**
   * クエリ条件に一致するレコード件数をカウントする。
   * @param query 省略時はアプリ内の全レコード件数
   */
  count(appId: AppId, query?: RecordQuery): Promise<number>;
}
```

### RecordCommentRepository

レコードコメントの永続化を担当するリポジトリ。

```typescript
interface RecordCommentRepository {
  /**
   * レコードに紐づくコメントを取得する。
   * @param appId アプリID
   * @param recordId レコードID
   * @param order ソート順（"asc" | "desc"、デフォルト "desc"）
   * @param offset スキップ件数（デフォルト 0）
   * @param limit 取得件数（最大10、デフォルト 10）
   * @returns コメントの配列と、前後により古い/新しいコメントが存在するかのフラグ
   */
  findByRecordId(
    appId: AppId,
    recordId: RecordId,
    order?: "asc" | "desc",
    offset?: number,
    limit?: number
  ): Promise<{ comments: RecordComment[]; older: boolean; newer: boolean }>;

  /**
   * コメントを保存する（新規作成のみ。コメントは更新不可）。
   * @returns 保存されたコメント（IDが確定済み）
   */
  save(comment: RecordComment): Promise<RecordComment>;

  /**
   * コメントを削除する。
   */
  delete(commentId: CommentId): Promise<void>;
}
```

### RecordHistoryRepository

レコード変更履歴の永続化を担当するリポジトリ。

```typescript
interface RecordHistoryRepository {
  /**
   * レコードに紐づく変更履歴を取得する。新しいバージョン順で返す。
   * @returns 変更履歴の配列（新しい順）
   */
  findByRecordId(appId: AppId, recordId: RecordId): Promise<RecordHistory[]>;

  /**
   * 指定バージョンの変更履歴を取得する。
   * @returns 変更履歴。存在しない場合は null
   */
  findByVersion(appId: AppId, recordId: RecordId, version: number): Promise<RecordHistory | null>;

  /**
   * 変更履歴を保存する（新規作成のみ。履歴は不変）。
   */
  save(history: RecordHistory): Promise<RecordHistory>;
}
```

### CsvImportJobRepository

CSVインポートジョブの永続化を担当するリポジトリ。

```typescript
interface CsvImportJobRepository {
  /**
   * ジョブIDでインポートジョブを取得する。
   * @returns ジョブ。存在しない場合は null
   */
  findById(jobId: CsvImportJobId): Promise<CsvImportJob | null>;

  /**
   * インポートジョブを保存する（新規作成・更新の両方に対応）。
   */
  save(job: CsvImportJob): Promise<CsvImportJob>;
}
```

### CsvExportJobRepository

CSVエクスポートジョブの永続化を担当するリポジトリ。

```typescript
interface CsvExportJobRepository {
  /**
   * ジョブIDでエクスポートジョブを取得する。
   * @returns ジョブ。存在しない場合は null
   */
  findById(jobId: CsvExportJobId): Promise<CsvExportJob | null>;

  /**
   * アプリIDに紐づくエクスポートジョブを取得する。
   * ダウンロード一覧画面用。
   * @returns エクスポートジョブの配列
   */
  findByAppId(appId: AppId): Promise<CsvExportJob[]>;

  /**
   * エクスポートジョブを保存する（新規作成・更新の両方に対応）。
   */
  save(job: CsvExportJob): Promise<CsvExportJob>;

  /**
   * 有効期限切れのエクスポートジョブと出力ファイルを削除する。
   * 3日経過したジョブが対象。
   * @returns 削除されたジョブの件数
   */
  deleteExpired(): Promise<number>;
}
```

### RecordCursorRepository

レコードカーソルの永続化を担当するリポジトリ。

```typescript
interface RecordCursorRepository {
  /**
   * カーソルを作成する。
   * @throws CursorLimitExceededError 同一ドメインのカーソルが10個に達している場合
   * @throws CursorCreationTimeoutError カーソル作成が5分以内に完了しない場合
   */
  create(
    appId: AppId,
    query: string | null,
    fields: FieldCode[],
    size: number
  ): Promise<RecordCursor>;

  /**
   * カーソルIDでカーソルを取得する。
   * @returns カーソル。存在しないまたは有効期限切れの場合は null
   */
  findById(cursorId: CursorId): Promise<RecordCursor | null>;

  /**
   * カーソルを削除する。全レコード取得完了後に自動呼び出しされる。
   */
  delete(cursorId: CursorId): Promise<void>;

  /**
   * 現在のドメインで有効なカーソル数をカウントする。
   * カーソル作成時の上限チェックに使用する。
   */
  countByDomain(): Promise<number>;
}
```

---

## ドメインサービス

### RecordValidationService

フィールド値のバリデーションを担当するドメインサービス。App ドメインのフィールド定義に基づいてバリデーションを行う。

```typescript
interface RecordValidationService {
  /**
   * フィールド値をアプリのフィールド定義に基づいてバリデーションする。
   * - フィールドコードの存在確認
   * - フィールド型とvalue形式の整合性チェック
   * - 必須フィールドの未入力チェック
   * - 選択肢フィールドの選択肢存在チェック（削除済み選択肢もAPI経由では指定可能）
   * - 重複禁止フィールドの一意性チェック
   * - 郵便番号フィールドの maxLength: 7 チェック
   * - 更新不可フィールド（ルックアップ、ステータス、カテゴリー、計算、作業者、自動計算文字列）への書き込み拒否
   * - 作成者・作成日時は作成時のみ設定可能、更新時は拒否
   * - 更新者・更新日時は設定不可（システム自動設定）
   *
   * @param appId アプリID（フィールド定義の取得に使用）
   * @param fieldValues バリデーション対象のフィールド値
   * @param isUpdate true の場合は更新バリデーション（作成時のみ許可されるフィールドを拒否）
   * @throws FieldValidationError バリデーションエラーの場合（エラー詳細を含む）
   */
  validateFieldValues(
    appId: AppId,
    fieldValues: Map<FieldCode, FieldValue>,
    isUpdate: boolean
  ): Promise<void>;
}
```

### ProcessExecutionService

プロセス管理のステータス遷移実行を担当するドメインサービス。ステータス遷移ルールは App ドメインに定義されており、本サービスはその実行を担う。

```typescript
interface ProcessExecutionService {
  /**
   * プロセスのステータス遷移を実行する。
   * - アクション名に基づいて遷移先ステータスを特定する
   * - 遷移先が作業者選択を必要とする場合、assignee は必須
   * - リビジョンを2増加させる（アクション実行 + ステータス変更）
   *
   * @param record 対象レコード
   * @param action 実行するアクションの名前
   * @param assignee 次の作業者のユーザーID（遷移先のステータスが要求する場合に必須）
   * @returns 更新後のレコード
   * @throws InvalidStatusTransitionError 現在のステータスから指定アクションが実行不可の場合
   * @throws AssigneeRequiredError 作業者が必要なのに指定されていない場合
   * @throws DuplicateActionError 同名のアクションが複数存在する場合
   */
  executeTransition(
    record: Record,
    action: string,
    assignee?: UserId
  ): Promise<Record>;

  /**
   * レコードの作業者を更新する。
   * プロセス管理が有効なアプリでのみ使用可能。
   *
   * @param record 対象レコード
   * @param assignees 新しい作業者リスト（空配列で作業者クリア）
   * @returns 更新後のレコード
   * @throws TooManyAssigneesError 作業者が100名を超える場合
   * @throws ProcessNotEnabledError プロセス管理が無効の場合
   */
  updateAssignees(
    record: Record,
    assignees: UserId[]
  ): Promise<Record>;
}
```

### CsvImportService

CSVインポートのオーケストレーションを担当するドメインサービス。

```typescript
interface CsvImportService {
  /**
   * CSVファイルの内容を解析してレコードを一括作成・更新する。
   * - ADD_ONLY モード: 全行を新規レコードとして作成
   * - UPSERT モード: updateKey に基づいて既存レコードを更新、存在しなければ新規作成
   * - エラー処理: CONTINUE の場合はエラー行をスキップ、STOP の場合はエラー行で中止
   *
   * @param job インポートジョブ（マッピング情報含む）
   * @param fileContent ファイルの内容（バイナリ）
   * @returns 更新されたジョブ（処理件数・エラー件数が確定済み）
   */
  processImport(job: CsvImportJob, fileContent: ArrayBuffer): Promise<CsvImportJob>;
}
```

### RecordQueryService

クエリの構築とバリデーションを担当するドメインサービス。
クエリの詳細仕様（演算子、関数、構文）は [spec/api/query.md](../api/query.md) を参照。

```typescript
interface RecordQueryService {
  /**
   * クエリ文字列をパースしてバリデーションする。
   * - 演算子の使用可否チェック（フィールド型ごとに利用可能な演算子が異なる）
   * - 関数の使用可否チェック（LOGINUSER, TODAY, NOW, FROM_TODAY 等）
   * - offset 上限（10,000）のチェック
   * - limit 上限のチェック（レコード複数取得: 500、その他: 100）
   * - エスケープの正当性チェック
   *
   * @param queryString クエリ文字列
   * @returns パース済みの RecordQuery
   * @throws QuerySyntaxError クエリ構文が不正な場合
   * @throws QueryValidationError バリデーションエラーの場合
   */
  parseAndValidate(queryString: string): RecordQuery;

  /**
   * クエリ内の関数を実行コンテキストに基づいて解決する。
   * - LOGINUSER() → 実行ユーザーのコード
   * - PRIMARY_ORGANIZATION() → 実行ユーザーの優先組織コード
   * - TODAY() → 実行日
   * - NOW() → 実行日時
   * - FROM_TODAY(n, unit) → 実行日からの相対日付
   * - THIS_WEEK(), LAST_WEEK(), NEXT_WEEK() → 週の開始/終了日
   * - THIS_MONTH(), LAST_MONTH(), NEXT_MONTH() → 月の開始/終了日
   * - THIS_YEAR(), LAST_YEAR(), NEXT_YEAR() → 年の開始/終了日
   *
   * @param query パース済みクエリ
   * @param context 実行コンテキスト（実行ユーザー、現在日時など）
   * @returns 関数が解決された RecordQuery
   */
  resolveFunctions(
    query: RecordQuery,
    context: QueryExecutionContext
  ): RecordQuery;
}

/** クエリ関数の解決に必要な実行コンテキスト */
type QueryExecutionContext = {
  readonly loginUserId: UserId;
  readonly loginUserCode: string;
  readonly primaryOrganizationCode: string | null;
  readonly now: Date;
};
```

---

## ビジネスルール

### レコード操作

| ルール | 説明 |
|--------|------|
| リビジョンベースの楽観的ロック | 更新・削除時に期待するリビジョンを指定可能。不一致の場合はエラー。`-1` 指定または省略でスキップ |
| 一括操作の上限 | 作成・更新・削除は最大100件/リクエスト。取得は最大500件/リクエスト |
| 一括操作のトランザクション | 一括作成・一括削除は全件成功または全件ロールバック |
| 更新不可フィールド | ルックアップ、ステータス、カテゴリー、計算、作業者、自動計算文字列は直接更新不可 |
| システムフィールドの制約 | 作成者・作成日時は作成時のみ設定可能（管理者権限が必要）。更新者・更新日時はシステムが自動設定 |
| サブテーブル更新 | 更新時は全行を指定する必要がある。送信しなかった行は削除される |
| 添付ファイル更新 | 既存ファイルの fileKey を保持して送信する必要がある。UUID形式の fileKey はアップロード時のみ有効 |
| レコード番号 | 自動採番。アプリコードが設定されている場合は「APP-1」形式。手動設定不可 |
| レコード再利用 | 既存レコードのフィールド値をコピーして新規作成画面に展開。システムフィールドはコピーしない |
| 郵便番号フィールド | maxLength は7 |

### プロセス管理

| ルール | 説明 |
|--------|------|
| ステータス変更のリビジョン増分 | ステータス変更時はリビジョンが2増加する（アクション実行 + ステータス変更） |
| 作業者の上限 | 1つのステータスに対して最大100名の作業者を設定可能 |
| ステータスの直接変更不可 | ステータスフィールドはレコード更新APIでは変更不可。プロセス管理APIを使用する |
| 作業者の直接変更不可 | 作業者フィールドはレコード更新APIでは変更不可。作業者更新APIを使用する |

### コメント

| ルール | 説明 |
|--------|------|
| プレーンテキストのみ | リッチテキスト、添付ファイルは不可 |
| 編集不可 | 投稿後のコメントは編集できない。削除のみ |
| 自分のコメントのみ削除可能 | 投稿者本人のみがコメントを削除できる |
| メンション上限 | 1コメントあたり最大10件 |
| 本文上限 | 最大65,535文字 |
| 返信時の自動メンション | 返信ボタンで元コメント投稿者への @メンションが自動挿入される（自分自身は除外） |
| 一度に取得可能なコメント数 | 最大10件 |

### 変更履歴

| ルール | 説明 |
|--------|------|
| 文字レベル差分 | フィールドごとに文字レベルの差分を記録する |
| バージョン復元 | 過去バージョンに復元すると新しいバージョン（履歴エントリ）が作成される。既存の履歴は不変 |
| 表示順序 | 新しいバージョンが先頭（降順） |
| バージョン1 | レコード作成を表す。changedFields は空 |

### CSV入出力

| ルール | 説明 |
|--------|------|
| インポートモード | ADD_ONLY（追加のみ）または UPSERT（追加更新。更新キーが必要） |
| インポートのエラー処理 | CONTINUE（エラー行をスキップして続行）または STOP（エラー行で中止） |
| Excelファイル制限 | 最大1MB、1,000行 |
| CSVファイル制限 | 最大100MB、100,000行 |
| エクスポートファイル保持期間 | 作成から3日後に自動削除 |
| エクスポート形式 | CSVのみ（Excel形式は対象外） |
| エクスポート対象 | 現在のビューの絞り込み条件に従う |
| 自動マッピング | インポート時、CSVの列名とフィールド名が完全一致する場合に自動マッピング |

### カーソル

| ルール | 説明 |
|--------|------|
| 同時カーソル上限 | 1ドメインあたり最大10個 |
| 有効期限 | 作成時または最後のアクセスから10分間 |
| 作成タイムアウト | 5分間 |
| 1回の取得件数 | 1〜500件（デフォルト100件） |
| 自動削除 | 全レコード取得完了後、カーソルは自動的に削除される |
| スナップショット | カーソル作成時点のレコード集合を対象とするが、フィールドの値は取得時点のものが返る |

---

## ユースケース一覧

### レコード CRUD

| ユースケース | 説明 |
|------------|------|
| レコード作成（単体） | 1件のレコードを新規作成する。フィールド値のバリデーション後、リビジョン1で保存 |
| レコード一括作成 | 最大100件のレコードを一括作成する。全件成功または全件ロールバック |
| レコード取得（単体） | アプリIDとレコードIDで1件のレコードを取得する |
| レコード取得（クエリ） | クエリ条件に一致する複数レコードを取得する。最大500件、offset上限10,000件 |
| レコード更新（単体） | 1件のレコードを更新する。リビジョンチェック付き楽観的ロック |
| レコード一括更新 | 最大100件のレコードを一括更新する。各レコードにリビジョンチェック |
| レコード削除 | 最大100件のレコードを一括削除する。リビジョンチェック付き。全件成功または全件ロールバック |
| レコード再利用 | 既存レコードの値をコピーして新規作成用のレコードを生成する |

### プロセス管理

| ユースケース | 説明 |
|------------|------|
| プロセスステータス変更（単体） | アクションを実行してレコードのステータスを遷移させる。リビジョンが2増加 |
| プロセスステータス変更（一括） | 最大100件のレコードのステータスを一括変更する |
| ワーカー割り当て変更 | レコードの作業者を変更する。最大100名 |

### コメント

| ユースケース | 説明 |
|------------|------|
| コメント投稿 | レコードにプレーンテキストコメントを投稿する。メンション指定可能（最大10件） |
| コメント削除 | 自分が投稿したコメントを削除する |
| コメント取得 | レコードに紐づくコメントを取得する。最大10件ずつ、ページネーション対応 |
| コメントいいね | コメントにいいねを付与する |
| コメントいいね取消 | コメントのいいねを取り消す |

### 変更履歴

| ユースケース | 説明 |
|------------|------|
| 変更履歴取得 | レコードの変更履歴一覧を取得する。新しいバージョン順 |
| 過去バージョンへの復元 | レコードを過去のバージョンに復元する。新しい履歴エントリが作成される |

### CSV入出力

| ユースケース | 説明 |
|------------|------|
| CSVインポート（追加のみ） | CSVファイルからレコードを新規追加する |
| CSVインポート（追加更新） | CSVファイルからレコードを更新キーに基づいて追加・更新する |
| CSVエクスポート | レコードをCSVファイルとして非同期で書き出す |
| エクスポートファイルダウンロード | 書き出し済みのCSVファイルをダウンロードする |

### カーソル

| ユースケース | 説明 |
|------------|------|
| カーソル作成 | 大量データ取得用のカーソルを作成する |
| カーソルからレコード取得 | カーソルを使用してレコードをバッチ取得する |
| カーソル削除 | 不要になったカーソルを明示的に削除する |
