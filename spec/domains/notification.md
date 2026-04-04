# Notification ドメイン設計

- 種別: **Supporting**
- 責務: 通知の生成・一覧表示・既読管理・フィルタリング・通知設定（メール・デスクトップ）を担う

## 概要

Notification ドメインは、OpenDesk プラットフォーム上で発生する各種イベント（レコードの追加・編集・コメント、ステータス変更、@メンション、スペーススレッド投稿など）に応じた通知の生成と管理を担う Supporting ドメインである。通知の既読/未読管理、「あとで読む」フラグ、ユーザーごとのカスタムフィルタ、メール通知・デスクトップ通知の設定を提供する。

App ドメイン（条件通知・レコード条件通知・リマインダー通知の設定定義）と連携して通知を生成するが、通知設定の定義自体は App ドメインの責務であり、本ドメインは生成された通知のライフサイクル管理と、ユーザー側の通知受信設定・フィルタリングを担う。

---

## ユビキタス言語

| 英語名 | 日本語名 | 定義 |
|--------|---------|------|
| Notification | 通知 | イベント発生時に受信者に対して生成される通知メッセージ。既読/未読状態と「あとで読む」フラグを持つ |
| NotificationType | 通知種別 | 通知の発生元の種類を分類する列挙値。MENTION、APP_CONDITION、RECORD_CONDITION、REMINDER、SPACE の5種類 |
| SourceType | 発生元種別 | 通知の発生元となったリソースの種別。RECORD、COMMENT、THREAD の3種類 |
| Recipient | 受信者 | 通知を受け取るユーザー。UserId で識別される |
| Sender | 送信者 | 通知の原因となるアクションを実行したユーザー。UserId で識別される |
| Read Status | 既読状態 | 通知が既読か未読かを表す状態。トグルで切り替え可能 |
| Read Later | あとで読む | 通知に付与するフラグ。後から確認したい通知をマークする。トグルで切り替え可能 |
| NotificationFilter | 通知フィルタ | 通知一覧の表示を絞り込むためのユーザー作成のカスタムフィルタ |
| Built-in Filter | ビルトインフィルタ | システムが提供する削除不可のフィルタ。「自分宛」「あとで読む」「すべて」の3種類 |
| LocationCondition | 場所条件 | 通知フィルタにおける発生元の場所による絞り込み条件。アプリ・スペース・ピープル・メッセージの4種類の場所タイプを指定可能 |
| SenderCondition | 送信者条件 | 通知フィルタにおける送信者による絞り込み条件。ユーザー・組織・グループで指定可能 |
| NotificationPreference | 通知設定 | ユーザーごとのメール通知・デスクトップ通知の受信設定 |
| Detail Mode | 詳細表示 | 通知一覧の2ペインレイアウト表示モード。左ペインに通知リスト、右ペインに iframe で元画面の内容を表示 |
| List Mode | 一覧表示 | 通知一覧のコンパクトリスト表示モード（デフォルト） |

---

## 他ドメインとの関係

| 参照先ドメイン | 参照方法 | 用途 |
|--------------|---------|------|
| Identity | UserId（値オブジェクト） | 通知の受信者・送信者の識別 |
| Identity | OrganizationId（値オブジェクト） | 送信者条件での組織指定 |
| Identity | GroupId（値オブジェクト） | 送信者条件でのグループ指定 |
| App | AppId（値オブジェクト） | 通知の発生元アプリの識別、場所条件でのアプリ指定 |
| Space | SpaceId（値オブジェクト） | 通知の発生元スペースの識別、場所条件でのスペース指定 |
| Record | RecordId（値オブジェクト） | 通知の発生元レコードの識別 |
| Record | CommentId（値オブジェクト） | 通知の発生元コメントの識別 |

通知の生成はユースケース層で他ドメインのイベントを受けてオーケストレーションする。Notification ドメインが他ドメインのエンティティを直接保持することはない。

---

## エンティティ

### Notification（通知）

イベント発生時に受信者に対して生成される通知メッセージ。発生元へのリンクと既読/未読・「あとで読む」状態を管理する。

#### フィールド

```typescript
type Notification = {
  readonly notificationId: NotificationId;
  readonly recipientId: UserId;
  readonly type: NotificationType;
  readonly sourceType: SourceType;
  readonly sourceId: string;
  readonly senderId: UserId | null;
  readonly title: string;
  readonly content: string;
  isRead: boolean;
  isReadLater: boolean;
  readonly createdAt: Date;
};
```

| フィールド名 | 型 | 必須 | 説明 |
|-------------|-----|------|------|
| notificationId | NotificationId | 必須 | 通知の一意識別子 |
| recipientId | UserId | 必須 | 通知を受け取るユーザーの ID |
| type | NotificationType | 必須 | 通知種別（MENTION, APP_CONDITION, RECORD_CONDITION, REMINDER, SPACE） |
| sourceType | SourceType | 必須 | 発生元種別（RECORD, COMMENT, THREAD） |
| sourceId | string | 必須 | 発生元リソースの ID（RecordId, CommentId, ThreadId の文字列表現） |
| senderId | UserId | 任意 | 通知の原因アクションを実行したユーザー。システム通知（リマインダー等）の場合は null |
| title | string | 必須 | 通知のタイトル（例: 「user1さんがコメントであなた宛に書きました」）。最大256文字 |
| content | string | 必須 | 通知の本文スニペット（元のコメントやレコード内容の抜粋）。最大1024文字 |
| isRead | boolean | 必須 | 既読状態（true=既読、false=未読）。デフォルト: false |
| isReadLater | boolean | 必須 | 「あとで読む」フラグ（true=マーク済み、false=未マーク）。デフォルト: false |
| createdAt | Date | 必須 | 通知の生成日時 |

#### ビヘイビア

```typescript
/**
 * 通知を既読にする。
 * すでに既読の場合は何もしない（冪等）。
 * @事後条件: isRead === true
 */
markAsRead(): void;

/**
 * 通知を未読にする。
 * すでに未読の場合は何もしない（冪等）。
 * @事後条件: isRead === false
 */
markAsUnread(): void;

/**
 * 「あとで読む」フラグをトグルする。
 * @事後条件: isReadLater が反転する
 */
toggleReadLater(): void;

/**
 * 指定ユーザーがこの通知の受信者かどうかを判定する。
 * 通知の操作権限チェックに使用する。
 */
isOwnedBy(userId: UserId): boolean;
```

#### 不変条件

- `notificationId` は作成後に変更不可
- `recipientId` は作成後に変更不可
- `type`、`sourceType`、`sourceId` は作成後に変更不可
- `senderId` は作成後に変更不可
- `title` は空文字であってはならず、256文字以下でなければならない
- `content` は1024文字以下でなければならない
- `createdAt` は作成後に変更不可
- `isRead` と `isReadLater` のみが変更可能なフィールド

#### ライフサイクル

1. **生成**: イベント発生時にシステムが通知を生成する。`isRead = false`、`isReadLater = false` で作成される
2. **既読化**: ユーザーが通知を既読にする（手動トグル、または詳細表示で自動既読化）
3. **未読化**: ユーザーが既読通知を未読に戻す
4. **あとで読むマーク**: ユーザーが「あとで読む」フラグをトグルする
5. **削除**: 古い通知はシステムにより一定期間後に自動削除される（保持期間はシステム設定に依存）

---

### NotificationFilter（通知フィルタ）

ユーザーが作成するカスタムの通知絞り込み条件。通知種別・場所条件・送信者条件の組み合わせで通知一覧を絞り込む。

#### フィールド

```typescript
type NotificationFilter = {
  readonly filterId: NotificationFilterId;
  readonly userId: UserId;
  readonly isBuiltIn: boolean;
  name: FilterName;
  notificationType: FilterNotificationType;
  locationMode: LocationFilterMode;
  locationConditions: LocationCondition[];
  senderConditions: SenderCondition[];
  readonly createdAt: Date;
  updatedAt: Date;
};
```

| フィールド名 | 型 | 必須 | 説明 |
|-------------|-----|------|------|
| filterId | NotificationFilterId | 必須 | フィルタの一意識別子 |
| userId | UserId | 必須 | フィルタを作成したユーザーの ID |
| isBuiltIn | boolean | 必須 | ビルトインフィルタ（@自分宛、あとで読む、すべて）の場合 true。編集・削除不可 |
| name | FilterName | 必須 | フィルタ名（1〜100文字） |
| notificationType | FilterNotificationType | 必須 | 通知種別フィルタ（ALL または MENTION） |
| locationMode | LocationFilterMode | 必須 | 場所条件のモード（ALL, INCLUDE, EXCLUDE） |
| locationConditions | LocationCondition[] | 必須 | 場所条件のリスト（locationMode が INCLUDE または EXCLUDE の場合に使用） |
| senderConditions | SenderCondition[] | 必須 | 送信者条件のリスト（空配列の場合は全送信者が対象） |
| createdAt | Date | 必須 | 作成日時 |
| updatedAt | Date | 必須 | 最終更新日時 |

#### ビヘイビア

```typescript
/**
 * フィルタ名を変更する。
 * @param name 新しいフィルタ名（1〜100文字）
 * @throws InvalidFilterNameError name が空文字、または100文字を超える場合
 * @事後条件: name が更新され、updatedAt が現在時刻に更新される
 */
rename(name: FilterName): void;

/**
 * 通知種別フィルタを変更する。
 * @param type 新しい通知種別フィルタ（ALL または MENTION）
 * @事後条件: notificationType が更新され、updatedAt が現在時刻に更新される
 */
changeNotificationType(type: FilterNotificationType): void;

/**
 * 場所条件を更新する。
 * @param mode 場所条件のモード
 * @param conditions 場所条件のリスト（mode が ALL の場合は無視される）
 * @throws EmptyLocationConditionsError mode が INCLUDE/EXCLUDE で conditions が空の場合
 * @事後条件: locationMode と locationConditions が更新され、updatedAt が現在時刻に更新される
 */
updateLocationConditions(mode: LocationFilterMode, conditions: LocationCondition[]): void;

/**
 * 送信者条件を更新する。
 * @param conditions 送信者条件のリスト（空配列で全送信者対象にリセット）
 * @事後条件: senderConditions が更新され、updatedAt が現在時刻に更新される
 */
updateSenderConditions(conditions: SenderCondition[]): void;

/**
 * 指定ユーザーがこのフィルタの所有者かどうかを判定する。
 * 編集・削除権限のチェックに使用する。
 */
isOwnedBy(userId: UserId): boolean;
```

#### 不変条件

- `filterId` は作成後に変更不可
- `userId` は作成後に変更不可
- `isBuiltIn` は作成後に変更不可
- `isBuiltIn` が true の場合、rename/update 系メソッドは呼び出し不可（エラーを返す）
- `name` は1文字以上100文字以下でなければならない
- `locationMode` が `INCLUDE` または `EXCLUDE` の場合、`locationConditions` は1件以上でなければならない
- `locationMode` が `ALL` の場合、`locationConditions` は空配列でなければならない
- `createdAt <= updatedAt` でなければならない

#### ライフサイクル

1. **作成**: ユーザーが絞り込み設定ダイアログでカスタムフィルタを新規作成する
2. **更新**: ユーザーがフィルタ名・条件を編集する
3. **削除**: ユーザーがカスタムフィルタを削除する。ビルトインフィルタは削除不可

---

### NotificationPreference（通知設定）

ユーザーごとのメール通知・デスクトップ通知の受信設定。設定変更は即時反映（auto-save）される。

#### フィールド

```typescript
type NotificationPreference = {
  readonly userId: UserId;
  emailEnabled: boolean;
  emailScope: EmailNotificationScope;
  emailFormat: EmailNotificationFormat;
  desktopEnabled: boolean;
  updatedAt: Date;
};
```

| フィールド名 | 型 | 必須 | 説明 |
|-------------|-----|------|------|
| userId | UserId | 必須 | 設定の所有者であるユーザーの ID |
| emailEnabled | boolean | 必須 | メール通知の有効/無効（true=受信する、false=受信しない）。デフォルト: true |
| emailScope | EmailNotificationScope | 必須 | メール通知の対象範囲。デフォルト: MENTION_ONLY |
| emailFormat | EmailNotificationFormat | 必須 | メール通知の形式。デフォルト: HTML |
| desktopEnabled | boolean | 必須 | デスクトップ通知の有効/無効（true=有効、false=無効）。デフォルト: false |
| updatedAt | Date | 必須 | 最終更新日時 |

#### ビヘイビア

```typescript
/**
 * メール通知の有効/無効を切り替える。
 * @param enabled true=受信する、false=受信しない
 * @事後条件: emailEnabled が更新され、updatedAt が現在時刻に更新される
 */
setEmailEnabled(enabled: boolean): void;

/**
 * メール通知の対象範囲を変更する。
 * @param scope 新しい対象範囲
 * @throws EmailNotEnabledError emailEnabled が false の場合
 * @事後条件: emailScope が更新され、updatedAt が現在時刻に更新される
 */
setEmailScope(scope: EmailNotificationScope): void;

/**
 * メール通知の形式を変更する。
 * @param format 新しい形式
 * @throws EmailNotEnabledError emailEnabled が false の場合
 * @事後条件: emailFormat が更新され、updatedAt が現在時刻に更新される
 */
setEmailFormat(format: EmailNotificationFormat): void;

/**
 * デスクトップ通知の有効/無効を切り替える。
 * デスクトップ通知は Google Chrome または Microsoft Edge でのみ利用可能。
 * ブラウザ判定はプレゼンテーション層の責務であり、ドメイン層では制約しない。
 * @param enabled true=有効、false=無効
 * @事後条件: desktopEnabled が更新され、updatedAt が現在時刻に更新される
 */
setDesktopEnabled(enabled: boolean): void;

/**
 * 指定ユーザーがこの設定の所有者かどうかを判定する。
 */
isOwnedBy(userId: UserId): boolean;
```

#### 不変条件

- `userId` は作成後に変更不可
- `emailScope` と `emailFormat` は `emailEnabled` が true の場合のみ意味を持つ（false の場合でも値は保持され、再有効化時に復元される）

#### ライフサイクル

1. **作成**: ユーザーアカウント作成時にデフォルト値で自動生成される
2. **更新**: ユーザーが個人設定画面から各項目を変更する（auto-save で即時反映）
3. **削除**: ユーザーアカウント削除時に連動して削除される

---

## 値オブジェクト

### 識別子

```typescript
/** 通知を一意に識別する ID */
type NotificationId = {
  readonly value: string; // UUID v4 形式
};

// 等価性: value が一致すれば等しい
// バリデーション: 空文字でないこと、有効な UUID 形式であること

/** 通知フィルタを一意に識別する ID */
type NotificationFilterId = {
  readonly value: string; // UUID v4 形式
};

// 等価性: value が一致すれば等しい
// バリデーション: 空文字でないこと、有効な UUID 形式であること
```

### 外部ドメインの ID（参照用）

```typescript
/** ユーザー ID（Identity ドメインからの参照） */
type UserId = {
  readonly value: string;
};

/** アプリ ID（App ドメインからの参照） */
type AppId = {
  readonly value: string;
};

/** スペース ID（Space ドメインからの参照） */
type SpaceId = {
  readonly value: string;
};

/** 組織 ID（Identity ドメインからの参照） */
type OrganizationId = {
  readonly value: string;
};

/** グループ ID（Identity ドメインからの参照） */
type GroupId = {
  readonly value: string;
};
```

### FilterName

通知フィルタの名前。1〜100文字の制約を持つ。

```typescript
type FilterName = {
  readonly value: string;
};

// 等価性: value が一致すれば等しい
// バリデーション:
//   - 空文字でないこと
//   - 100文字以下であること
// エラーメッセージ: 「1文字以上、100文字以下である必要があります。必須です。」
```

### LocationCondition

通知フィルタにおける場所条件。異なる種類（アプリ・スペース・ピープル・メッセージ）の条件を混在させることが可能。

```typescript
type LocationCondition = {
  readonly locationType: LocationType;
  readonly locationId: string | null;
};

// locationType: 場所の種類（APP, SPACE, PEOPLE, MESSAGE）
// locationId: 特定の場所の ID。null の場合は「すべてのXXX」（例: すべてのアプリ）を表す
// 等価性: locationType と locationId の組み合わせが一致すれば等しい
```

### SenderCondition

通知フィルタにおける送信者条件。ユーザー・組織・グループで指定可能。

```typescript
type SenderCondition = {
  readonly senderType: SenderFilterType;
  readonly senderId: string;
};

// senderType: 送信者の種類（USER, ORGANIZATION, GROUP）
// senderId: ユーザー ID、組織 ID、またはグループ ID
// 等価性: senderType と senderId の組み合わせが一致すれば等しい
```

### 条件の結合ロジック

フィルタ評価時に複数の条件がどのように結合されるかを以下に定義する。

#### 場所条件（LocationCondition）の結合

- **INCLUDE モード**: 場所条件は **OR（いずれかに一致）** で結合される。指定された場所条件のうち、いずれか1つでも一致すれば通知はフィルタに含まれる
- **EXCLUDE モード**: 場所条件は **NOR（いずれにも一致しない）** で結合される。指定された場所条件のいずれにも一致しない場合のみ通知はフィルタに含まれる

#### 送信者条件（SenderCondition）の結合

- 送信者条件は **OR（指定された送信者のいずれか）** で結合される。指定された送信者条件のうち、いずれか1つでも一致すれば条件を満たす
- 空の `senderConditions`（空配列）= **全送信者が対象**。送信者による絞り込みは行わない

### 列挙型

```typescript
/** 通知種別 */
type NotificationType =
  | "MENTION"            // @メンション通知（コメント・スレッドでの宛先指定）
  | "APP_CONDITION"      // アプリ条件通知（レコード追加・編集・コメント・ステータス変更等）
  | "RECORD_CONDITION"   // レコード条件通知（特定条件に一致するレコードの変更）
  | "REMINDER"           // リマインダー通知（日時フィールドに基づく予定通知）
  | "SPACE";             // スペース通知（スレッド投稿・返信等）

/** 発生元種別 */
type SourceType =
  | "RECORD"             // レコードが発生元
  | "COMMENT"            // コメントが発生元
  | "THREAD";            // スペーススレッドが発生元

/** 場所の種類（フィルタ用） */
type LocationType =
  | "APP"                // アプリ
  | "SPACE"              // スペース
  | "PEOPLE"             // ピープル
  | "MESSAGE";           // メッセージ

/** 送信者フィルタの対象種別 */
type SenderFilterType =
  | "USER"               // ユーザー
  | "ORGANIZATION"       // 組織
  | "GROUP";             // グループ

/** 通知種別フィルタ（フィルタ設定用） */
type FilterNotificationType =
  | "ALL"                // すべての通知
  | "MENTION";           // 自分宛（@メンション）の通知のみ

/** 場所条件のモード */
type LocationFilterMode =
  | "ALL"                // すべての通知を表示する（場所条件なし）
  | "INCLUDE"            // 指定場所からの通知だけ表示する
  | "EXCLUDE";           // 指定場所からの通知を除外する

/** メール通知の対象範囲 */
type EmailNotificationScope =
  | "MENTION_ONLY"       // 自分宛の通知のみ
  | "ALL";               // すべての通知

/** メール通知の形式 */
type EmailNotificationFormat =
  | "HTML"               // HTML 形式
  | "TEXT";              // テキスト形式

/** ビルトインフィルタの種別 */
type BuiltInFilterType =
  | "MENTION"            // 自分宛（デフォルト）
  | "READ_LATER"         // あとで読む
  | "ALL";               // すべて
```

---

## ドメインサービス

### NotificationGenerationService

通知の生成を担当するドメインサービス。イベントの種類に応じて適切な通知タイトル・コンテンツを組み立て、受信者リストを決定する。

#### 依存ポート

- NotificationRepository

#### メソッド

```typescript
/**
 * @メンション通知を生成する。
 * コメントまたはスレッド投稿でユーザーが宛先指定された場合に呼び出される。
 *
 * @param params 通知生成パラメータ
 * @returns 生成された通知のリスト（メンション対象ユーザーごとに1件）
 */
generateMentionNotifications(params: {
  senderId: UserId;
  sourceType: SourceType;
  sourceId: string;
  mentionedUserIds: UserId[];
  title: string;
  content: string;
}): Notification[];

/**
 * アプリ条件通知を生成する。
 * レコード追加・編集・コメント追加・ステータス変更・ファイルインポート時に呼び出される。
 * 通知対象者は App ドメインの条件通知設定から決定される（ユースケース層で取得済み）。
 *
 * @param params 通知生成パラメータ
 * @returns 生成された通知のリスト（通知対象者ごとに1件）
 */
generateAppConditionNotifications(params: {
  senderId: UserId;
  sourceType: SourceType;
  sourceId: string;
  recipientIds: UserId[];
  title: string;
  content: string;
}): Notification[];

/**
 * レコード条件通知を生成する。
 * レコードが特定のフィルター条件に一致した場合に呼び出される。
 *
 * @param params 通知生成パラメータ
 * @returns 生成された通知のリスト（通知対象者ごとに1件）
 */
generateRecordConditionNotifications(params: {
  senderId: UserId;
  sourceType: SourceType;
  sourceId: string;
  recipientIds: UserId[];
  title: string;
  content: string;
}): Notification[];

/**
 * リマインダー通知を生成する。
 * スケジューラーにより日時条件が満たされた場合に呼び出される。
 * リマインダーはシステムが自動生成するため senderId は null。
 *
 * @param params 通知生成パラメータ
 * @returns 生成された通知のリスト（通知対象者ごとに1件）
 */
generateReminderNotifications(params: {
  sourceType: SourceType;
  sourceId: string;
  recipientIds: UserId[];
  title: string;
  content: string;
}): Notification[];

/**
 * スペース通知を生成する。
 * スペースのスレッドに投稿・返信があった場合に呼び出される。
 *
 * @param params 通知生成パラメータ
 * @returns 生成された通知のリスト（スペースメンバーごとに1件）
 */
generateSpaceNotifications(params: {
  senderId: UserId;
  sourceType: SourceType;
  sourceId: string;
  recipientIds: UserId[];
  title: string;
  content: string;
}): Notification[];
```

---

### NotificationFilterMatchingService

通知がユーザーのカスタムフィルタ条件に一致するかどうかを判定するドメインサービス。

#### 依存ポート

なし（純粋なドメインロジック）

#### メソッド

```typescript
/**
 * 通知がフィルタ条件に一致するかを判定する。
 * ビルトインフィルタおよびカスタムフィルタの両方に対応する。
 *
 * @param notification 判定対象の通知
 * @param filter 適用するフィルタ条件
 * @param notificationSource 通知の発生元情報（場所条件の評価に必要）
 * @returns 通知がフィルタ条件に一致する場合 true
 */
matches(
  notification: Notification,
  filter: NotificationFilter,
  notificationSource: NotificationSource
): boolean;

/**
 * ビルトインフィルタに基づく一致判定を行う。
 *
 * @param notification 判定対象の通知
 * @param builtInFilter ビルトインフィルタ種別
 * @returns 通知がビルトインフィルタ条件に一致する場合 true
 */
matchesBuiltIn(
  notification: Notification,
  builtInFilter: BuiltInFilterType
): boolean;
// 処理:
//   - MENTION: notification.type === "MENTION"
//   - READ_LATER: notification.isReadLater === true
//   - ALL: 常に true
```

---

## ポート（リポジトリインターフェース）

### NotificationRepository

通知の永続化を担当するリポジトリ。

```typescript
interface NotificationRepository {
  /**
   * ID で通知を取得する。
   * @returns 通知。存在しない場合は null
   */
  findById(notificationId: NotificationId): Promise<Notification | null>;

  /**
   * 受信者のユーザー ID に紐づく通知を取得する。
   * ビルトインフィルタおよびカスタムフィルタに基づく絞り込みとページネーションに対応。
   *
   * @param recipientId 受信者のユーザー ID
   * @param params 検索条件
   * @returns 通知のリストと合計件数
   */
  findByRecipientId(
    recipientId: UserId,
    params: {
      isRead?: boolean;
      isReadLater?: boolean;
      notificationType?: NotificationType;
      offset: number;
      limit: number;
    }
  ): Promise<{ notifications: Notification[]; totalCount: number }>;

  /**
   * 通知を保存する（新規作成または更新）。
   * @returns 保存された通知
   */
  save(notification: Notification): Promise<Notification>;

  /**
   * 複数の通知を一括保存する（通知生成時に使用）。
   * @param notifications 保存する通知のリスト
   * @returns 保存された通知のリスト
   */
  saveBatch(notifications: Notification[]): Promise<Notification[]>;

  /**
   * 通知を削除する。
   * @param notificationId 削除対象の通知 ID
   */
  delete(notificationId: NotificationId): Promise<void>;

  /**
   * 指定ユーザーの通知を一括既読にする。
   * @param recipientId 受信者のユーザー ID
   * @param notificationIds 既読にする通知 ID のリスト（省略時は全未読を既読にする）
   * @returns 既読にした件数
   */
  markAsReadBatch(recipientId: UserId, notificationIds?: NotificationId[]): Promise<number>;

  /**
   * 指定ユーザーの未読通知件数をカウントする。
   * ヘッダーのバッジ表示に使用する。
   * @param recipientId 受信者のユーザー ID
   * @returns 未読通知の件数
   */
  countUnread(recipientId: UserId): Promise<number>;

  /**
   * 保持期限切れの通知を一括削除する（バッチ処理用）。
   * @param before この日時より前に作成された通知を削除する
   * @returns 削除された通知の件数
   */
  deleteExpired(before: Date): Promise<number>;
}
```

### NotificationFilterRepository

通知フィルタの永続化を担当するリポジトリ。

```typescript
interface NotificationFilterRepository {
  /**
   * ID でフィルタを取得する。
   * @returns フィルタ。存在しない場合は null
   */
  findById(filterId: NotificationFilterId): Promise<NotificationFilter | null>;

  /**
   * ユーザー ID に紐づくカスタムフィルタ一覧を取得する。
   * 作成日時の昇順で返す。
   * @param userId フィルタ所有者のユーザー ID
   * @returns カスタムフィルタのリスト
   */
  findByUserId(userId: UserId): Promise<NotificationFilter[]>;

  /**
   * フィルタを保存する（新規作成または更新）。
   * @returns 保存されたフィルタ
   */
  save(filter: NotificationFilter): Promise<NotificationFilter>;

  /**
   * フィルタを削除する。
   * @param filterId 削除対象のフィルタ ID
   * @throws FilterNotFoundError フィルタが存在しない場合
   */
  delete(filterId: NotificationFilterId): Promise<void>;
}
```

### NotificationPreferenceRepository

通知設定の永続化を担当するリポジトリ。

```typescript
interface NotificationPreferenceRepository {
  /**
   * ユーザー ID で通知設定を取得する。
   * @returns 通知設定。存在しない場合は null（ユーザー作成時に自動生成されるため、通常は null にならない）
   */
  findByUserId(userId: UserId): Promise<NotificationPreference | null>;

  /**
   * 通知設定を保存する（新規作成または更新）。
   * @returns 保存された通知設定
   */
  save(preference: NotificationPreference): Promise<NotificationPreference>;

  /**
   * 通知設定を削除する（ユーザーアカウント削除時に使用）。
   * @param userId 削除対象のユーザー ID
   */
  delete(userId: UserId): Promise<void>;
}
```

### NotificationSourceResolver

通知の発生元情報を解決するためのポートインターフェース。フィルタの場所条件評価に必要な情報を取得する。実装はインフラ層で他ドメインのリポジトリを参照して解決する。

```typescript
interface NotificationSourceResolver {
  /**
   * 通知の発生元情報を解決する。
   * 場所条件の評価に必要な appId, spaceId 等を取得する。
   *
   * @param sourceType 発生元種別
   * @param sourceId 発生元リソースの ID
   * @returns 発生元情報。解決できない場合は null
   */
  resolve(sourceType: SourceType, sourceId: string): Promise<NotificationSource | null>;
}

/** 通知の発生元情報。フィルタの場所条件評価に使用する */
type NotificationSource = {
  readonly appId: AppId | null;
  readonly spaceId: SpaceId | null;
  readonly locationType: LocationType;
};
```

### EmailNotificationSender

メール通知の送信を担うポートインターフェース。

```typescript
interface EmailNotificationSender {
  /**
   * 通知をメールで送信する。
   * @param notification 送信対象の通知
   * @param recipientEmail 受信者のメールアドレス
   * @param format メールの形式（HTML またはテキスト）
   */
  send(
    notification: Notification,
    recipientEmail: string,
    format: EmailNotificationFormat
  ): Promise<void>;

  /**
   * 複数の通知メールを一括送信する（バッチ処理用）。
   * @param items 送信対象のリスト
   */
  sendBatch(items: {
    notification: Notification;
    recipientEmail: string;
    format: EmailNotificationFormat;
  }[]): Promise<void>;
}
```

### DesktopNotificationPublisher

デスクトップ通知（Web Push）のパブリッシュを担うポートインターフェース。

```typescript
interface DesktopNotificationPublisher {
  /**
   * デスクトップ通知をパブリッシュする。
   * 実際の表示はブラウザ側の Service Worker が処理する。
   *
   * @param recipientId 受信者のユーザー ID
   * @param notification 通知内容
   */
  publish(recipientId: UserId, notification: Notification): Promise<void>;
}
```

---

## エラー型

```typescript
// 通知操作エラー
type NotificationNotFoundError = {
  kind: "NotificationNotFound";
  notificationId: NotificationId;
};

type NotificationAccessDeniedError = {
  kind: "NotificationAccessDenied";
  notificationId: NotificationId;
  userId: UserId;
};

// フィルタ操作エラー
type FilterNotFoundError = {
  kind: "FilterNotFound";
  filterId: NotificationFilterId;
};

type FilterAccessDeniedError = {
  kind: "FilterAccessDenied";
  filterId: NotificationFilterId;
  userId: UserId;
};

type InvalidFilterNameError = {
  kind: "InvalidFilterName";
  reason: string; // 「1文字以上、100文字以下である必要があります。必須です。」
};

type EmptyLocationConditionsError = {
  kind: "EmptyLocationConditions";
  locationMode: LocationFilterMode;
};

type CannotDeleteBuiltInFilterError = {
  kind: "CannotDeleteBuiltInFilter";
  builtInFilter: BuiltInFilterType;
};

// 通知設定エラー
type PreferenceNotFoundError = {
  kind: "PreferenceNotFound";
  userId: UserId;
};

type EmailNotEnabledError = {
  kind: "EmailNotEnabled";
  userId: UserId;
};
```

---

## ビジネスルール

### 通知

| ルール | 説明 |
|--------|------|
| 通知の不変性 | 通知の本体（type, sourceType, sourceId, senderId, title, content）は作成後に変更不可。変更可能なのは isRead と isReadLater のみ |
| 既読/未読トグル | ユーザーは自分宛の通知の既読/未読状態をいつでもトグルできる |
| あとで読むフラグ | ユーザーは自分宛の通知の「あとで読む」フラグをいつでもトグルできる。既読/未読状態とは独立 |
| 発生元リンク | 通知は sourceType と sourceId を通じて発生元リソースに紐づく。詳細表示モードでは iframe で発生元の画面を表示する |
| 自分自身への通知除外 | 自分が実行したアクションに対する通知は自分自身には生成しない（senderId === recipientId の場合は除外） |
| メンション通知の優先 | 同一イベントでメンション通知とアプリ条件通知の両方の対象となる場合、メンション通知のみを生成する（重複排除） |

### 通知フィルタ

| ルール | 説明 |
|--------|------|
| ビルトインフィルタ | 「自分宛」「あとで読む」「すべて」の3種類はシステム提供。削除・名称変更は不可 |
| カスタムフィルタの作成 | ユーザーは通知フィルタを自由に作成・編集・削除できる |
| フィルタ名の制約 | 1文字以上100文字以下。空文字は不可 |
| 場所条件の混在 | 1つのフィルタ内で異なる場所タイプ（アプリ + スペース + ピープル等）の条件を混在させることが可能 |
| 送信者条件 | ユーザー・組織・グループの3種類で送信者を絞り込める。複数指定は OR 条件 |
| フィルタ削除時のリセット | カスタムフィルタを削除すると、表示フィルタが「自分宛」にリセットされる |

### 通知設定

| ルール | 説明 |
|--------|------|
| メール通知 | 有効/無効をトグルで切り替え可能。有効時は対象範囲（自分宛のみ/すべて）と形式（HTML/テキスト）を設定可能 |
| デスクトップ通知 | Google Chrome または Microsoft Edge でのみ利用可能。ブラウザの通知許可が必要 |
| 即時反映 | 通知設定の変更は即時反映（auto-save）。明示的な保存ボタンは不要 |
| システム管理者のメール通知無効化 | システム管理者がメール通知機能を無効にしている場合、ユーザーのメール通知設定は無視される |
| デフォルト値 | メール通知=受信する、対象=自分宛のみ、形式=HTML、デスクトップ通知=無効 |

---

## ユースケース一覧

### 通知の閲覧・管理

| ユースケース | 説明 |
|------------|------|
| 通知一覧取得 | ユーザー宛の通知をフィルタ条件と既読/未読条件に基づいて取得する。ページネーション対応 |
| 通知詳細取得 | 通知 ID で1件の通知を取得し、発生元の情報を合わせて返す。詳細表示モード用 |
| 通知既読化 | 1件の通知を既読にする。通知の受信者のみが操作可能 |
| 通知未読化 | 1件の既読通知を未読に戻す。通知の受信者のみが操作可能 |
| 通知一括既読化 | 指定した複数の通知、またはフィルタ条件に一致する全未読通知を一括既読にする |
| あとで読むトグル | 1件の通知の「あとで読む」フラグをトグルする |
| 未読通知件数取得 | ユーザーの未読通知件数を取得する。ヘッダーのバッジ表示に使用 |

### 通知の生成

| ユースケース | 説明 |
|------------|------|
| メンション通知生成 | コメントまたはスレッド投稿で @メンションされたユーザーに通知を生成する |
| アプリ条件通知生成 | アプリの条件通知設定に基づき、レコード操作時に該当ユーザーに通知を生成する |
| レコード条件通知生成 | レコードの条件通知設定に基づき、条件に一致するレコード変更時に通知を生成する |
| リマインダー通知生成 | リマインダー設定に基づき、指定日時に該当ユーザーにリマインダー通知を生成する |
| スペース通知生成 | スペースのスレッド投稿・返信時にスペースメンバーに通知を生成する |

### 通知フィルタ

| ユースケース | 説明 |
|------------|------|
| カスタムフィルタ作成 | ユーザーが通知フィルタを新規作成する。フィルタ名・通知種別・場所条件・送信者条件を設定 |
| カスタムフィルタ更新 | 既存のカスタムフィルタの設定を変更する。フィルタの所有者のみが操作可能 |
| カスタムフィルタ削除 | カスタムフィルタを削除する。ビルトインフィルタは削除不可。フィルタの所有者のみが操作可能 |
| フィルタ一覧取得 | ユーザーのビルトインフィルタとカスタムフィルタの一覧を取得する |

### 通知設定

| ユースケース | 説明 |
|------------|------|
| 通知設定取得 | ユーザーのメール通知・デスクトップ通知の現在の設定を取得する |
| メール通知設定変更 | メール通知の有効/無効、対象範囲、形式を変更する。即時反映 |
| デスクトップ通知設定変更 | デスクトップ通知の有効/無効を変更する。即時反映 |
| 通知設定初期化 | ユーザーアカウント作成時にデフォルト値で通知設定を生成する |

### メンテナンス

| ユースケース | 説明 |
|------------|------|
| 期限切れ通知の一括削除 | 保持期限を超過した古い通知を一括削除するバッチ処理 |
