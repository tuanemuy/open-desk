# AccessControl ドメイン設計

- 種別: **Supporting**
- 責務: アプリ・レコード・フィールド単位のアクセス権およびシステム権限を管理する

## 概要

AccessControl ドメインは、OpenDesk プラットフォームにおけるアクセス制御を4つのレイヤーで管理する Supporting ドメインである。

1. **アプリアクセス権（App ACL）** — アプリに対するユーザー・組織・グループごとの操作権限（閲覧・追加・編集・削除・管理・インポート・エクスポート）を優先順位付きで制御する
2. **レコードアクセス権（Record ACL）** — レコード条件（クエリ）に基づいて、レコード単位の閲覧・編集・削除権限を制御する
3. **フィールドアクセス権（Field ACL）** — フィールド単位で閲覧・編集・アクセス不可の権限を制御する
4. **システム権限（System Permission）** — OpenDesk システム管理画面で設定する、アプリ作成・スペース作成・システム管理等のプラットフォームレベルの権限を制御する

各レイヤーは独立して設定され、ACL 評価時にはアプリ → レコード → フィールドの順で結合評価される。編集・削除権限は閲覧権限を前提とし、フィールドレベルの権限はレコードレベルの権限によって上書きされる。

---

## ユビキタス言語

| 英語名 | 日本語名 | 定義 |
|--------|---------|------|
| App ACL | アプリアクセス権 | アプリに対するユーザー・組織・グループ・作成者ごとの操作権限設定。優先順位付きのルールリストで構成される |
| Record ACL | レコードアクセス権 | レコード条件（filterCond）に合致するレコードに対する閲覧・編集・削除権限の設定 |
| Field ACL | フィールドアクセス権 | 特定フィールドに対する閲覧・編集・アクセス不可の権限設定 |
| System Permission | システム権限 | OpenDesk システム管理で設定するプラットフォームレベルの権限（システム管理・アプリ作成等） |
| ACL Entity | アクセス権対象 | 権限設定の対象となる主体。ユーザー・組織・グループ・作成者・フィールドエンティティのいずれか |
| ACL Entity Type | アクセス権対象種別 | ACL Entity の種別を示す列挙値（USER, GROUP, ORGANIZATION, CREATOR, FIELD_ENTITY） |
| App Permission | アプリ権限 | アプリアクセス権における7つの個別権限フラグの組み合わせ |
| Record Permission | レコード権限 | レコードアクセス権における閲覧・編集・削除の3つの権限フラグの組み合わせ |
| Field Permission Level | フィールド権限レベル | フィールドアクセス権における権限レベル（READ, WRITE, NONE） |
| System Right | システム権限項目 | システム権限における個別の権限フラグ（systemAdmin, appCreate 等） |
| Priority | 優先順位 | ACL ルールの評価順序。配列のインデックス順で上位が優先。Everyone グループは常に最低優先度 |
| Include Subs | 下位組織継承 | 組織に対するアクセス権を下位組織のメンバーにも適用するかのフラグ |
| Filter Condition | レコード条件 | レコードアクセス権ルールの適用条件。クエリ形式で記述し、合致するレコードにルールが適用される |
| FIELD_ENTITY | フィールドエンティティ | レコードのフィールド値に基づいてアクセス権対象を動的に決定する仕組み。例: 「作成者」フィールドの値と一致するユーザーに権限を付与 |
| Everyone | Everyone グループ | 全ユーザーを含む特殊グループ。ACL の優先順位に関わらず常に最低優先度で評価される |
| Effective Permission | 実効権限 | アプリ・レコード・フィールドの各レイヤーを結合評価した結果の最終的な権限 |
| ACL Evaluation | アクセス権評価 | 特定ユーザーの特定レコード・フィールドに対する実効権限を算出するプロセス |
| Revision | リビジョン | ACL 設定のバージョン番号。楽観的ロックに使用する |
| cybozu.com Admin | cybozu.com 共通管理者 | cybozu.com の共通管理者。OpenDesk のシステム管理権限が自動的に付与される |

---

## 他ドメインとの関係

| 参照先ドメイン | 参照方法 | 用途 |
|--------------|---------|------|
| App | AppId（値オブジェクト） | ACL 設定対象のアプリの識別 |
| Identity | UserId, OrganizationId, GroupId（値オブジェクト） | アクセス権対象のユーザー・組織・グループの識別 |
| Record | RecordId（値オブジェクト） | ACL 評価時のレコード識別 |

ACL 評価時にはユーザーの所属組織・グループの情報が必要になるが、これはユースケース層で Identity ドメインから取得し、AclEvaluationService に渡す。AccessControl ドメインが Identity ドメインのエンティティを直接保持することはない。

---

## エンティティ

### AppAcl（アプリアクセス権）

アプリに対する操作権限の設定。優先順位付きのルールリスト（`rights`）を保持する。配列の先頭が最も高い優先順位を持つ。

#### フィールド

```typescript
type AppAcl = {
  readonly appId: AppId;
  rights: AppAclEntry[];
  revision: number;
  updatedAt: Date;
};
```

#### AppAclEntry（アプリアクセス権エントリ）

```typescript
type AppAclEntry = {
  readonly entity: AclEntity;
  readonly includeSubs: boolean;
  appEditable: boolean;
  recordViewable: boolean;
  recordAddable: boolean;
  recordEditable: boolean;
  recordDeletable: boolean;
  recordImportable: boolean;
  recordExportable: boolean;
};
```

#### ビヘイビア

```typescript
/**
 * アプリアクセス権のルールリストを一括置換する。
 * - Everyone グループは指定された位置に関わらず、自動的に末尾（最低優先度）に移動される
 * - ルール間の権限依存関係が検証される
 *
 * @param entries 新しいルールリスト（優先順位順）
 * @throws EmptyRightsError entries が空の場合
 * @throws DuplicateEntityError 同一エンティティが複数含まれる場合
 * @throws PermissionDependencyError 編集/削除権限が閲覧権限なしで設定されている場合
 * @throws ImportDependencyError インポート権限が追加権限なしで設定されている場合
 */
updateRights(entries: AppAclEntry[]): void;

/**
 * 指定リビジョンとの楽観的ロックチェックを行う。
 * revision が undefined の場合はチェックをスキップする。
 * @throws RevisionConflictError リビジョンが一致しない場合
 */
checkRevision(expectedRevision?: number): void;

/**
 * 指定ユーザーに対するアプリ権限を評価する。
 * rights を優先順位順に走査し、最初に一致したエントリの権限を返す。
 *
 * @param userId 評価対象のユーザーID
 * @param userCode ユーザーコード
 * @param organizationCodes ユーザーが所属する組織コードのリスト（下位組織含む）
 * @param groupCodes ユーザーが所属するグループコードのリスト
 * @param isCreator ユーザーがアプリの作成者かどうか
 * @returns 一致したエントリの AppPermission。一致なしの場合は全権限 false
 */
evaluateForUser(
  userId: UserId,
  userCode: string,
  organizationCodes: string[],
  groupCodes: string[],
  isCreator: boolean
): AppPermission;
```

#### 不変条件

- `rights` は1つ以上のエントリを含む（空にはできない）
- Everyone グループのエントリは常にリストの末尾に位置する
- 同一エンティティ（type + code の組み合わせ）は重複して設定できない
- `recordEditable` が true の場合、`recordViewable` も true でなければならない
- `recordDeletable` が true の場合、`recordViewable` も true でなければならない
- `recordImportable` が true の場合、`recordAddable` も true でなければならない
- `revision` は単調増加する

---

### RecordAcl（レコードアクセス権）

レコード条件に基づくレコード単位の権限設定。複数のルール（`rights`）を優先順位付きで保持し、各ルールは条件（filterCond）とエンティティリストのペアで構成される。

#### フィールド

```typescript
type RecordAcl = {
  readonly appId: AppId;
  rights: RecordAclRule[];
  revision: number;
  updatedAt: Date;
};
```

#### RecordAclRule（レコードアクセス権ルール）

```typescript
type RecordAclRule = {
  readonly filterCond: string | null;
  entities: RecordAclEntity[];
};
```

#### RecordAclEntity（レコードアクセス権エンティティ）

```typescript
type RecordAclEntity = {
  readonly entity: AclEntity;
  readonly includeSubs: boolean;
  viewable: boolean;
  editable: boolean;
  deletable: boolean;
};
```

#### ビヘイビア

```typescript
/**
 * レコードアクセス権のルールリストを一括置換する。
 * - 各ルールのエンティティリスト内で Everyone グループは末尾に移動される
 * - filterCond は ACL 用クエリ制約に従ってバリデーションされる
 *
 * @param rules 新しいルールリスト（優先順位順）
 * @throws InvalidFilterCondError filterCond が不正な場合（order by, limit, offset 使用、and/or 混在等）
 * @throws PermissionDependencyError 編集/削除権限が閲覧権限なしで設定されている場合
 * @throws DuplicateEntityInRuleError 同一ルール内に同一エンティティが複数含まれる場合
 */
updateRights(rules: RecordAclRule[]): void;

/**
 * 指定リビジョンとの楽観的ロックチェックを行う。
 * @throws RevisionConflictError リビジョンが一致しない場合
 */
checkRevision(expectedRevision?: number): void;

/**
 * 指定ユーザー・レコードの組み合わせに対するレコード権限を評価する。
 * rules を優先順位順に走査し、filterCond がレコードに合致するルールの中で
 * 最初に一致したエンティティの権限を返す。
 *
 * @param userId 評価対象のユーザーID
 * @param userCode ユーザーコード
 * @param organizationCodes ユーザーが所属する組織コードのリスト
 * @param groupCodes ユーザーが所属するグループコードのリスト
 * @param recordFieldValues レコードのフィールド値マップ（FIELD_ENTITY の解決と filterCond の評価に使用）
 * @returns 評価結果の RecordPermission。ルールに一致しない場合は null（アプリアクセス権にフォールバック）
 */
evaluateForRecord(
  userId: UserId,
  userCode: string,
  organizationCodes: string[],
  groupCodes: string[],
  recordFieldValues: Map<FieldCode, FieldValue>
): RecordPermission | null;
```

#### 不変条件

- `rights` は空配列を許容する（レコードアクセス権が未設定の場合）
- `filterCond` で `order by`, `limit`, `offset` は使用不可
- `filterCond` で `and` と `or` の混在は不可
- `filterCond` で日付関数（NOW(), TODAY() 等）は使用不可
- `filterCond` で複数行テキスト・リッチエディター・添付ファイルフィールドは条件に使用不可
- `editable` が true の場合、`viewable` も true でなければならない
- `deletable` が true の場合、`viewable` も true でなければならない
- `revision` は単調増加する

---

### FieldAcl（フィールドアクセス権）

フィールド単位の閲覧・編集・アクセス不可の権限設定。複数のフィールドに対するルールを保持する。

#### フィールド

```typescript
type FieldAcl = {
  readonly appId: AppId;
  rights: FieldAclRule[];
  revision: number;
  updatedAt: Date;
};
```

#### FieldAclRule（フィールドアクセス権ルール）

```typescript
type FieldAclRule = {
  readonly fieldCode: FieldCode;
  entities: FieldAclEntity[];
};
```

#### FieldAclEntity（フィールドアクセス権エンティティ）

```typescript
type FieldAclEntity = {
  readonly entity: AclEntity;
  readonly includeSubs: boolean;
  readonly accessibility: FieldPermissionLevel;
};
```

#### ビヘイビア

```typescript
/**
 * フィールドアクセス権のルールリストを一括置換する。
 * - 各ルールのエンティティリスト内で Everyone グループは末尾に移動される
 * - Everyone を省略したフィールドは全ユーザーのアクセスが拒否される
 *
 * @param rules 新しいルールリスト
 * @throws DuplicateFieldCodeError 同一フィールドコードのルールが複数含まれる場合
 * @throws DuplicateEntityInRuleError 同一ルール内に同一エンティティが複数含まれる場合
 */
updateRights(rules: FieldAclRule[]): void;

/**
 * 指定リビジョンとの楽観的ロックチェックを行う。
 * @throws RevisionConflictError リビジョンが一致しない場合
 */
checkRevision(expectedRevision?: number): void;

/**
 * 指定ユーザー・フィールドに対するフィールド権限レベルを評価する。
 * 指定フィールドコードに対応するルールを検索し、エンティティリストを優先順位順に走査して
 * 最初に一致したエンティティの accessibility を返す。
 *
 * @param fieldCode 評価対象のフィールドコード
 * @param userId 評価対象のユーザーID
 * @param userCode ユーザーコード
 * @param organizationCodes ユーザーが所属する組織コードのリスト
 * @param groupCodes ユーザーが所属するグループコードのリスト
 * @param recordFieldValues レコードのフィールド値マップ（FIELD_ENTITY の解決に使用）
 * @returns FieldPermissionLevel。該当フィールドのルールが存在しない場合は WRITE（制限なし）
 */
evaluateForField(
  fieldCode: FieldCode,
  userId: UserId,
  userCode: string,
  organizationCodes: string[],
  groupCodes: string[],
  recordFieldValues: Map<FieldCode, FieldValue>
): FieldPermissionLevel;
```

#### 不変条件

- `rights` は空配列を許容する（フィールドアクセス権が未設定の場合）
- 同一フィールドコードに対するルールは1つだけ（重複不可）
- 各ルール内で同一エンティティ（type + code の組み合わせ）は重複不可
- Everyone グループのエンティティは各ルール内で常に末尾に位置する
- `revision` は単調増加する
- フィールドアクセス権で設定不可なフィールド: レコード番号、ラベル、セパレーター、スペース、テーブル、グループ、関連レコード一覧、作成者、作成日時、更新者、更新日時
- FieldAcl にルールが定義されていないフィールドは、全ユーザーに対して WRITE（閲覧・編集可）がデフォルト。Everyone エントリを省略したフィールドは全ユーザーのアクセスが拒否される

---

### SystemPermission（システム権限）

OpenDesk システム管理画面で設定するプラットフォームレベルの権限。ユーザー・組織・グループごとに権限項目を設定する。

#### フィールド

```typescript
type SystemPermission = {
  readonly systemPermissionId: SystemPermissionId;
  readonly entity: AclEntity;
  readonly includeSubs: boolean;
  systemAdmin: boolean;
  appGroupViewable: boolean;
  appGroupManageable: boolean;
  appCreate: boolean;
  appManage: boolean;
  spaceCreate: boolean;
  guestSpaceCreate: boolean; // デフォルト: false
  updatedAt: Date;
};
```

#### ビヘイビア

```typescript
/**
 * システム権限を更新する。
 * - systemAdmin が true の場合、他のすべての権限も暗黙的に true として評価される
 *
 * @param params 更新する権限項目
 */
updateRights(params: {
  systemAdmin: boolean;
  appGroupViewable: boolean;
  appGroupManageable: boolean;
  appCreate: boolean;
  appManage: boolean;
  spaceCreate: boolean;
  guestSpaceCreate: boolean;
}): void;

/**
 * 指定された権限項目が有効かどうかを判定する。
 * systemAdmin が true の場合は、どの権限項目を指定しても true を返す。
 *
 * @param right 確認する権限項目
 * @returns 権限が有効かどうか
 */
hasRight(right: SystemRightType): boolean;
```

#### 不変条件

- `entity.type` は USER, GROUP, ORGANIZATION のいずれか（CREATOR, FIELD_ENTITY は使用不可）
- `systemAdmin` が true のエンティティは、すべての権限項目について暗黙的に true として評価される
- cybozu.com 共通管理者は systemAdmin が自動的に true になる（ユースケース層で保証）

---

## 値オブジェクト

### 識別子

```typescript
/** システム権限設定の一意識別子 */
type SystemPermissionId = {
  readonly value: string;
};
```

### AclEntityType

アクセス権対象の種別。レイヤーによって使用可能な種別が異なる。

```typescript
type AclEntityType =
  | "USER"            // ユーザー
  | "GROUP"           // グループ
  | "ORGANIZATION"    // 組織
  | "CREATOR"         // アプリの作成者（App ACL のみ）
  | "FIELD_ENTITY";   // フィールドエンティティ（Record ACL, Field ACL のみ）

// 使用可能なレイヤー:
//   App ACL:    USER, GROUP, ORGANIZATION, CREATOR
//   Record ACL: USER, GROUP, ORGANIZATION, FIELD_ENTITY
//   Field ACL:  USER, GROUP, ORGANIZATION, FIELD_ENTITY
//   System:     USER, GROUP, ORGANIZATION
```

### AclEntity

アクセス権の対象となるエンティティ。type と code の組み合わせで一意に識別される。

```typescript
type AclEntity = {
  readonly type: AclEntityType;
  readonly code: string | null;
};

// 等価性: type と code が共に一致すれば等しい
// バリデーション:
//   - type が CREATOR の場合、code は null
//   - type が CREATOR 以外の場合、code は空文字でないこと
//   - type が FIELD_ENTITY の場合、code はフォーム内のフィールドコード
//     （ユーザー選択・組織選択・グループ選択・作成者・更新者フィールド）
//   - ゲストユーザーの場合、code は "guest/" プレフィックス付き
```

### AppPermission

アプリアクセス権の7つの個別権限フラグをまとめた値オブジェクト。

```typescript
type AppPermission = {
  readonly appEditable: boolean;
  readonly recordViewable: boolean;
  readonly recordAddable: boolean;
  readonly recordEditable: boolean;
  readonly recordDeletable: boolean;
  readonly recordImportable: boolean;
  readonly recordExportable: boolean;
};

// ファクトリメソッド:
//   AppPermission.allDenied() — 全権限 false
//   AppPermission.allGranted() — 全権限 true

// 不変条件:
//   recordEditable === true の場合、recordViewable === true
//   recordDeletable === true の場合、recordViewable === true
//   recordImportable === true の場合、recordAddable === true
```

### RecordPermission

レコードアクセス権の3つの権限フラグをまとめた値オブジェクト。

```typescript
type RecordPermission = {
  readonly viewable: boolean;
  readonly editable: boolean;
  readonly deletable: boolean;
};

// ファクトリメソッド:
//   RecordPermission.allDenied() — 全権限 false
//   RecordPermission.allGranted() — 全権限 true

// 不変条件:
//   editable === true の場合、viewable === true
//   deletable === true の場合、viewable === true
```

### FieldPermission

フィールドの実効権限を表す値オブジェクト。レコードレベルとフィールドレベルの権限を結合した結果。

```typescript
type FieldPermission = {
  readonly viewable: boolean;
  readonly editable: boolean;
};

// ファクトリメソッド:
//   FieldPermission.fromLevel(level: FieldPermissionLevel) — レベルから生成
//     WRITE → { viewable: true, editable: true }
//     READ  → { viewable: true, editable: false }
//     NONE  → { viewable: false, editable: false }
```

### FieldPermissionLevel

フィールドアクセス権における権限レベル。

```typescript
type FieldPermissionLevel =
  | "READ"    // 閲覧のみ
  | "WRITE"   // 閲覧 + 編集
  | "NONE";   // アクセス不可
```

### SystemRightType

システム権限の個別項目の列挙。

```typescript
type SystemRightType =
  | "SYSTEM_ADMIN"          // OpenDesk システム管理権限
  | "APP_GROUP_VIEWABLE"    // アプリグループの閲覧権限
  | "APP_GROUP_MANAGEABLE"  // アプリグループの管理権限
  | "APP_CREATE"            // アプリ作成権限
  | "APP_MANAGE"            // アプリ管理権限
  | "SPACE_CREATE"          // スペース作成権限
  | "GUEST_SPACE_CREATE";   // ゲストスペース作成権限
```

### EffectiveRecordPermission

特定レコードに対する全レイヤーを結合した実効権限。ACL 評価 API のレスポンスに対応する。

```typescript
type EffectiveRecordPermission = {
  readonly recordId: RecordId;
  readonly record: RecordPermission;
  readonly fields: Map<FieldCode, FieldPermission>;
};
```

### UserAclContext

ACL 評価に必要なユーザーのコンテキスト情報。ユースケース層で Identity ドメインから組み立てて渡す。

```typescript
type UserAclContext = {
  readonly userId: UserId;
  readonly userCode: string;
  readonly organizationCodes: string[];
  readonly groupCodes: string[];
  readonly isCybozuAdmin: boolean;
};
```

---

## ドメインサービス

### AclEvaluationService

アプリ・レコード・フィールドの各レイヤーの ACL を結合し、特定ユーザーの実効権限を算出するドメインサービス。

#### 依存

- AppAcl, RecordAcl, FieldAcl（エンティティとして渡される）
- FilterCondEvaluator（ポート — filterCond のレコードに対する評価を行う）

#### メソッド

```typescript
interface AclEvaluationService {
  /**
   * 指定ユーザーのアプリに対する実効権限を評価する。
   * cybozu.com 共通管理者の場合は全権限 true を返す。
   *
   * @param appAcl アプリアクセス権設定
   * @param userContext ユーザーコンテキスト
   * @param isAppCreator ユーザーがアプリの作成者かどうか
   * @returns アプリ権限
   */
  evaluateAppPermission(
    appAcl: AppAcl,
    userContext: UserAclContext,
    isAppCreator: boolean
  ): AppPermission;

  /**
   * 指定ユーザー・レコードに対するレコードレベルの実効権限を評価する。
   * アプリアクセス権とレコードアクセス権を結合する。
   *
   * 評価ルール:
   * 1. アプリアクセス権で recordViewable が false の場合、レコード権限はすべて false
   * 2. レコードアクセス権のルールを優先順位順に評価
   * 3. filterCond がレコードに合致するルール内のエンティティを優先順位順に評価
   * 4. 最初に一致したエンティティの権限を返す
   * 5. いずれのルールにも一致しない場合はアプリアクセス権の権限をフォールバックとして使用
   *
   * @param appAcl アプリアクセス権設定
   * @param recordAcl レコードアクセス権設定
   * @param userContext ユーザーコンテキスト
   * @param isAppCreator ユーザーがアプリの作成者かどうか
   * @param recordFieldValues レコードのフィールド値マップ
   * @returns レコード権限
   */
  evaluateRecordPermission(
    appAcl: AppAcl,
    recordAcl: RecordAcl,
    userContext: UserAclContext,
    isAppCreator: boolean,
    recordFieldValues: Map<FieldCode, FieldValue>
  ): RecordPermission;

  /**
   * 指定ユーザー・レコード・フィールドに対するフィールドレベルの実効権限を評価する。
   * レコードレベル権限とフィールドアクセス権を結合する。
   *
   * 評価ルール:
   * 1. レコードレベルで viewable が false の場合、フィールド権限はすべて false
   * 2. レコードレベルで editable が false の場合、フィールドの editable も false
   * 3. フィールドアクセス権のルールが存在する場合、フィールドアクセス権で上書きする
   * 4. ただしレコードレベルで閲覧不可の場合、フィールドアクセス権に WRITE があっても閲覧不可
   *
   * @param recordPermission 評価済みのレコード権限
   * @param fieldAcl フィールドアクセス権設定
   * @param userContext ユーザーコンテキスト
   * @param recordFieldValues レコードのフィールド値マップ（FIELD_ENTITY 解決用）
   * @param fieldCodes 評価対象のフィールドコードリスト
   * @returns フィールドコードと FieldPermission のマップ
   */
  evaluateFieldPermissions(
    recordPermission: RecordPermission,
    fieldAcl: FieldAcl,
    userContext: UserAclContext,
    recordFieldValues: Map<FieldCode, FieldValue>,
    fieldCodes: FieldCode[]
  ): Map<FieldCode, FieldPermission>;

  /**
   * 指定ユーザーの複数レコードに対する実効権限を一括評価する。
   * ACL 評価 API に対応する。最大100レコード。
   *
   * @param appAcl アプリアクセス権設定
   * @param recordAcl レコードアクセス権設定
   * @param fieldAcl フィールドアクセス権設定
   * @param userContext ユーザーコンテキスト
   * @param isAppCreator ユーザーがアプリの作成者かどうか
   * @param records 評価対象のレコードリスト（RecordId とフィールド値のペア）
   * @param evaluableFieldCodes 評価対象のフィールドコードリスト
   * @returns レコードごとの実効権限リスト
   * @throws TooManyRecordsError レコードが100件を超える場合
   */
  evaluateBatch(
    appAcl: AppAcl,
    recordAcl: RecordAcl,
    fieldAcl: FieldAcl,
    userContext: UserAclContext,
    isAppCreator: boolean,
    records: Array<{ recordId: RecordId; fieldValues: Map<FieldCode, FieldValue> }>,
    evaluableFieldCodes: FieldCode[]
  ): EffectiveRecordPermission[];
}
```

### FieldEntityResolver

FIELD_ENTITY の解決を担当するドメインサービス。レコードのフィールド値に基づいて、FIELD_ENTITY に一致するかどうかを判定する。

```typescript
interface FieldEntityResolver {
  /**
   * レコードのフィールド値を参照し、指定ユーザーが FIELD_ENTITY に一致するかを判定する。
   *
   * FIELD_ENTITY の code はフィールドコードを指す。
   * 対象フィールドの値（ユーザー選択・組織選択・グループ選択・作成者・更新者）に
   * 指定ユーザーが含まれる場合に true を返す。
   *
   * 例: code="作成者" の FIELD_ENTITY で、レコードの「作成者」フィールドの値が
   *     評価対象ユーザーと一致すれば true
   *
   * @param entityCode FIELD_ENTITY のコード（= フィールドコード）
   * @param userContext ユーザーコンテキスト
   * @param recordFieldValues レコードのフィールド値マップ
   * @returns ユーザーが FIELD_ENTITY に一致するかどうか
   */
  matches(
    entityCode: string,
    userContext: UserAclContext,
    recordFieldValues: Map<FieldCode, FieldValue>
  ): boolean;
}
```

### FilterCondValidator

レコードアクセス権の filterCond に対する構文・制約バリデーションを担当するドメインサービス。

```typescript
interface FilterCondValidator {
  /**
   * filterCond がレコードアクセス権の制約に従っているかを検証する。
   *
   * 禁止事項:
   * - order by, limit, offset の使用
   * - and と or の混在
   * - 文字列1行、リンクフィールドでの like, not like の使用
   * - レコード番号、数値、計算フィールドでの in, >, < の使用
   * - ステータスフィールドでの = の使用
   * - 複数行テキスト、リッチエディター、添付ファイルフィールドの使用
   * - 日付関数（NOW(), TODAY() 等）の使用
   *
   * @param filterCond 検証対象のクエリ文字列
   * @throws InvalidFilterCondError 制約に違反している場合（詳細なエラーメッセージを含む）
   */
  validate(filterCond: string): void;
}
```

---

## ポート（リポジトリインターフェース）

### AppAclRepository

アプリアクセス権の永続化を担当するリポジトリ。

```typescript
interface AppAclRepository {
  /**
   * アプリIDでアプリアクセス権を取得する。
   * @returns アプリアクセス権。未設定の場合はデフォルト値（Everyone に全権限付与）を返す
   */
  findByAppId(appId: AppId): Promise<AppAcl>;

  /**
   * アプリアクセス権を保存する（新規作成・更新の両方に対応）。
   * リビジョンをインクリメントして保存する。
   * @returns 保存されたアプリアクセス権（リビジョンが確定済み）
   */
  save(appAcl: AppAcl): Promise<AppAcl>;
}
```

### RecordAclRepository

レコードアクセス権の永続化を担当するリポジトリ。

```typescript
interface RecordAclRepository {
  /**
   * アプリIDでレコードアクセス権を取得する。
   * @returns レコードアクセス権。未設定の場合はデフォルト値（rights 空配列）を返す
   */
  findByAppId(appId: AppId): Promise<RecordAcl>;

  /**
   * レコードアクセス権を保存する（新規作成・更新の両方に対応）。
   * リビジョンをインクリメントして保存する。
   * @returns 保存されたレコードアクセス権（リビジョンが確定済み）
   */
  save(recordAcl: RecordAcl): Promise<RecordAcl>;
}
```

### FieldAclRepository

フィールドアクセス権の永続化を担当するリポジトリ。

```typescript
interface FieldAclRepository {
  /**
   * アプリIDでフィールドアクセス権を取得する。
   * @returns フィールドアクセス権。未設定の場合はデフォルト値（rights 空配列）を返す
   */
  findByAppId(appId: AppId): Promise<FieldAcl>;

  /**
   * フィールドアクセス権を保存する（新規作成・更新の両方に対応）。
   * リビジョンをインクリメントして保存する。
   * @returns 保存されたフィールドアクセス権（リビジョンが確定済み）
   */
  save(fieldAcl: FieldAcl): Promise<FieldAcl>;
}
```

### SystemPermissionRepository

システム権限の永続化を担当するリポジトリ。

```typescript
interface SystemPermissionRepository {
  /**
   * システム権限を全件取得する。
   * @returns システム権限のリスト
   */
  findAll(): Promise<SystemPermission[]>;

  /**
   * エンティティ（type + code）でシステム権限を取得する。
   * @returns システム権限。存在しない場合は null
   */
  findByEntity(entity: AclEntity): Promise<SystemPermission | null>;

  /**
   * 指定ユーザーに適用されるシステム権限を全て取得する。
   * ユーザー自身、ユーザーが所属する組織（下位組織継承を考慮）、
   * ユーザーが所属するグループに設定された権限をすべて返す。
   *
   * @param userId ユーザーID
   * @param userCode ユーザーコード
   * @param organizationCodes ユーザーが所属する組織コードのリスト（上位組織含む）
   * @param groupCodes ユーザーが所属するグループコードのリスト
   * @returns 該当するシステム権限のリスト
   */
  findByUser(
    userId: UserId,
    userCode: string,
    organizationCodes: string[],
    groupCodes: string[]
  ): Promise<SystemPermission[]>;

  /**
   * システム権限を保存する（新規作成・更新の両方に対応）。
   * @returns 保存されたシステム権限
   */
  save(permission: SystemPermission): Promise<SystemPermission>;

  /**
   * システム権限を削除する。
   */
  delete(systemPermissionId: SystemPermissionId): Promise<void>;
}
```

### FilterCondEvaluator

レコードアクセス権の filterCond をレコードに対して評価するポート。クエリエンジンの実装に依存するため、ポートとして定義する。

```typescript
interface FilterCondEvaluator {
  /**
   * filterCond がレコードのフィールド値に合致するかを評価する。
   *
   * @param filterCond クエリ文字列（null の場合は全レコードに合致）
   * @param fieldValues レコードのフィールド値マップ
   * @returns 合致する場合 true
   */
  evaluate(
    filterCond: string | null,
    fieldValues: Map<FieldCode, FieldValue>
  ): boolean;
}
```

---

## ビジネスルール

### アプリアクセス権

| ルール | 説明 |
|--------|------|
| 優先順位評価 | ルールリストの先頭から走査し、最初に一致したエントリの権限が適用される |
| Everyone 最低優先度 | Everyone グループは指定位置に関わらず常にリスト末尾（最低優先度）に移動される |
| 権限の依存関係 | レコード編集/削除には閲覧権限が必要。インポートには追加権限が必要 |
| CREATOR エンティティ | アプリの作成者を対象とする特殊なエンティティ。code は null |
| ゲストユーザー | ログイン名に "guest/" プレフィックスが必要 |

### レコードアクセス権

| ルール | 説明 |
|--------|------|
| 条件付きルール | filterCond に合致するレコードに対してのみルールが適用される |
| filterCond の制約 | order by, limit, offset 不可。and/or 混在不可。日付関数不可 |
| FIELD_ENTITY | フィールド値に基づく動的な権限対象。ユーザー選択・作成者・更新者フィールド等を参照 |
| 権限の依存関係 | 編集/削除には閲覧権限が必要。閲覧を無効にすると編集/削除も強制的に無効 |
| アプリ権限との結合 | アプリアクセス権で閲覧不可の場合、レコードアクセス権に関係なくすべて不可 |

### フィールドアクセス権

| ルール | 説明 |
|--------|------|
| レコード権限による上書き | レコードレベルで閲覧不可の場合、フィールドアクセス権に関わらずアクセス不可 |
| レコード権限による編集制限 | レコードレベルで編集不可の場合、フィールドに WRITE が設定されていても編集不可 |
| Everyone 省略時のデフォルト | Everyone を省略したフィールドは全ユーザーのアクセスが拒否される |
| 設定不可フィールド | レコード番号、ラベル、セパレーター、スペース、テーブル、グループ、関連レコード一覧、作成者、作成日時、更新者、更新日時 |
| テーブル内フィールド | テーブル内のフィールドは通常フィールドと同じ階層で評価される |

### システム権限

| ルール | 説明 |
|--------|------|
| システム管理者の全権限 | systemAdmin が true のエンティティはすべての権限項目が暗黙的に true |
| cybozu.com 共通管理者 | cybozu.com 共通管理者には全 OpenDesk システム管理権限が自動付与される |
| デフォルト権限 | アプリ作成・アプリ管理・スペース作成は Everyone にデフォルトで許可 |
| 権限の OR 結合 | ユーザーに直接設定された権限と、所属組織・グループに設定された権限は OR で結合される |

### ACL 評価

| ルール | 説明 |
|--------|------|
| 評価順序 | アプリ → レコード → フィールドの順で評価。上位レイヤーが不可なら下位も不可 |
| 一括評価上限 | 一度に評価できるレコードは最大100件 |
| 認証方式制限 | ACL 評価 API はパスワード認証・セッション認証のみ対応。API トークン認証は不可 |
| メンテナンス中 | メンテナンス中はすべてのレコード権限が false になる |

---

## ユースケース一覧

### アプリアクセス権

| ユースケース | 説明 |
|------------|------|
| アプリアクセス権の取得 | アプリIDを指定してアプリアクセス権設定を取得する。アプリ管理権限が必要 |
| アプリアクセス権の更新 | アプリのアクセス権ルールリストを一括更新する。リビジョンチェック付き楽観的ロック。アプリ管理権限が必要 |

### レコードアクセス権

| ユースケース | 説明 |
|------------|------|
| レコードアクセス権の取得 | アプリIDを指定してレコードアクセス権設定を取得する。言語パラメータによるフィールド名のローカライズに対応。アプリ管理権限が必要 |
| レコードアクセス権の更新 | レコードアクセス権のルールリストを一括更新する。filterCond のバリデーション付き。リビジョンチェック付き楽観的ロック。アプリ管理権限が必要 |

### フィールドアクセス権

| ユースケース | 説明 |
|------------|------|
| フィールドアクセス権の取得 | アプリIDを指定してフィールドアクセス権設定を取得する。アプリ管理権限が必要 |
| フィールドアクセス権の更新 | フィールドアクセス権のルールリストを一括更新する。リビジョンチェック付き楽観的ロック。アプリ管理権限が必要 |

### システム権限

| ユースケース | 説明 |
|------------|------|
| システム権限一覧の取得 | 全システム権限設定を取得する。OpenDesk システム管理権限が必要 |
| システム権限の追加 | ユーザー・組織・グループに対するシステム権限を新規追加する。OpenDesk システム管理権限が必要 |
| システム権限の更新 | 既存のシステム権限設定を更新する。OpenDesk システム管理権限が必要 |
| システム権限の削除 | システム権限設定を削除する。OpenDesk システム管理権限が必要 |
| ユーザーのシステム権限評価 | 指定ユーザーに適用されるシステム権限を結合評価し、各権限項目の有効/無効を返す。cybozu.com 共通管理者フラグも考慮する |

### ACL 評価

| ユースケース | 説明 |
|------------|------|
| レコードアクセス権の一括評価 | 指定ユーザーの複数レコード（最大100件）に対する実効権限を一括評価する。レコードレベルとフィールドレベルの権限を返す。パスワード認証・セッション認証のみ対応 |
