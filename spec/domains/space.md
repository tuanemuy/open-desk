# Space ドメイン設計

## 概要

Space ドメインは、OpenDesk におけるチームコラボレーション空間の管理を担う Supporting ドメインである。スペースの作成・設定・メンバー管理、スレッドによるテーマ別ディスカッション、お知らせ掲示板、ゲストスペースによる社外ユーザーとの共同作業、スペーステンプレートによる再利用可能な構成管理を提供する。

**ドメイン種別**: Supporting

**責務境界**:
- スペースのライフサイクル管理（作成・設定変更・削除）
- スレッド・コメントによるコミュニケーション管理
- スペースメンバーの参加・退会・権限管理
- ゲストスペースのライフサイクル管理とゲストユーザー参照
- お知らせ掲示板の管理
- 関連リンクの管理
- スペーステンプレートの管理
- アプリのスペース所属は App ドメインが管理する（SpaceId 参照のみ）
- 通知の配信は Notification ドメインに委譲する
- アクセス権の詳細制御は AccessControl ドメインに委譲する

---

## ユビキタス言語

| 用語 | 英語 | 定義 |
|------|------|------|
| スペース | Space | チーム単位のコラボレーション空間。お知らせ掲示板・スレッド・アプリ一覧・メンバー管理を集約する |
| ゲストスペース | GuestSpace | 社外ユーザー（ゲストユーザー）を招待して共同作業できるスペース。常に非公開で、別枠のライセンスで管理される |
| スレッド | Thread | スペース内のテーマ別ディスカッション。タイトルと本文を持ち、コメントのやり取りが行われる |
| デフォルトスレッド | DefaultThread | マルチスレッド非使用時に自動作成される唯一のスレッド。マルチスレッド有効化後も残る |
| スレッドコメント | ThreadComment | スレッドに投稿されるリッチテキストのコメント。@メンション・ファイル添付・絵文字をサポートする |
| お知らせ | SpaceAnnouncement | スペースのポータルに掲示されるリッチテキストコンテンツ。スペース管理者のみ編集可能 |
| スペースメンバー | SpaceMember | スペースに参加しているユーザー・組織・グループ。管理者フラグを持つ |
| スペース管理者 | SpaceAdmin | スペースの設定変更・メンバー管理・お知らせ編集が可能な権限を持つメンバー |
| 関連リンク | RelatedLink | スペースに紐づけられた外部URLリンク |
| スペーステンプレート | SpaceTemplate | スペースの構成を再利用可能なテンプレートとして保存したもの |
| カバー画像 | CoverImage | スペースヘッダーに表示される背景画像。28種のプリセットまたはカスタムアップロードから選択 |
| マルチスレッド | MultiThread | スペースのポータルと複数スレッドを使用するモード。一度有効化すると元に戻せない |
| フォロー | Follow | スレッドの更新通知を受け取る状態。スレッド作成時に自動的にフォロー状態になる |
| 固定メンバー | FixedMember | 参加/退会・フォロー/フォロー解除を禁止する設定が有効な状態 |
| ポータル表示設定 | PortalDisplayConfig | スペースポータルに表示するセクション（お知らせ・スレッド・アプリ・ピープル・関連リンク）の表示/非表示設定 |
| いいね | Like | スレッドコメントに対する簡易リアクション |
| メンション | Mention | コメント内の宛先指定。対象ユーザー・組織・グループに通知が送信される |

---

## エンティティ

### 1. Space（スペース）

チームコラボレーション空間の集約ルート。基本設定・ポータル表示設定・権限設定を管理する。

```typescript
type Space = {
  spaceId: SpaceId;
  name: SpaceName;                       // スペース名（1-128文字）
  isPrivate: boolean;                    // 非公開フラグ（true=メンバーのみ閲覧可能）
  isGuest: boolean;                      // ゲストスペースかどうか
  useMultiThread: boolean;               // マルチスレッド使用フラグ（一度 true にすると false に戻せない）
  fixedMember: boolean;                  // 参加/退会・フォロー/フォロー解除の禁止
  coverImage: CoverImage;               // カバー画像
  portalDisplay: PortalDisplayConfig;    // ポータル表示設定
  appCreationPermission: AppCreationPermission; // アプリ作成権限（EVERYONE / ADMIN）
  defaultThreadId: ThreadId;             // デフォルトスレッドID
  creatorId: UserId;                     // 作成者
  createdAt: Date;                       // 作成日時
  updatedAt: Date;                       // 最終更新日時
};
```

**振る舞い**:

| メソッド | シグネチャ | 説明 |
|----------|-----------|------|
| rename | `rename(name: SpaceName): void` | スペース名を変更する |
| setPrivate | `setPrivate(isPrivate: boolean): void` | 公開/非公開を切り替える。ゲストスペースの場合は常に true のため変更不可 |
| enableMultiThread | `enableMultiThread(): void` | マルチスレッドを有効化する。すでに有効な場合はエラー。一度有効化すると無効化できない |
| setFixedMember | `setFixedMember(fixedMember: boolean): void` | 参加/退会・フォロー/フォロー解除の禁止を設定する |
| setCoverImage | `setCoverImage(coverImage: CoverImage): void` | カバー画像を変更する |
| setPortalDisplay | `setPortalDisplay(config: PortalDisplayConfig): void` | ポータル表示設定を変更する |
| setAppCreationPermission | `setAppCreationPermission(permission: AppCreationPermission): void` | アプリ作成権限を変更する |

**不変条件**:
- `name` は1文字以上128文字以下
- `isGuest === true` の場合、`isPrivate` は常に `true`（変更不可）
- `useMultiThread` は `true` から `false` に変更できない（不可逆）
- `defaultThreadId` は作成時に自動設定される
- `createdAt <= updatedAt`

**ライフサイクル**:
1. **作成**: 白紙またはテンプレートからスペースを作成する。デフォルトスレッドが自動生成される。作成者が管理者として自動登録される
2. **設定変更**: スペース名・公開設定・マルチスレッド・カバー画像等の変更
3. **運用**: メンバー管理・スレッド作成・お知らせ掲示・アプリ追加
4. **削除**: スペース管理者がスペースを削除する。関連するスレッド・コメント・お知らせも連鎖削除される

---

### 2. GuestSpace（ゲストスペース）

ゲストスペースは Space エンティティの `isGuest === true` のインスタンスとして表現される。ドメインロジック上の追加制約をファクトリとバリデーションで保証する。

**追加制約（Space に対する上乗せ）**:
- `isPrivate` は常に `true`（変更不可）
- ゲストユーザーの参加が可能（通常スペースでは不可）
- ゲストユーザーはゲストスペース内のアプリのみアクセス可能
- ゲストスペース機能の有効/無効はシステム設定に依存する

**ゲストユーザー参照**:

ゲストユーザー自体は Identity ドメインで管理される。Space ドメインからは `UserId` でのみ参照し、以下の属性は Identity ドメインが保持する:
- 会社名（company）
- メールアドレス（email）
- ステータス（有効/停止）
- 最終ログイン日時（lastLogin）
- ライセンス種別（licenseType）

---

### 3. Thread（スレッド）

スペース内のテーマ別ディスカッション単位。タイトルと本文を持つ。

```typescript
type Thread = {
  threadId: ThreadId;
  spaceId: SpaceId;                      // 所属スペース
  title: ThreadTitle;                    // スレッドタイトル（1-128文字、必須）
  body: string | null;                   // スレッド本文（リッチテキスト/HTML、最大65,535文字、任意）
  creatorId: UserId;                     // 作成者
  createdAt: Date;                       // 作成日時
  updatedAt: Date;                       // 最終更新日時
  isDefault: boolean;                    // デフォルトスレッドかどうか
  notifyOnCreate: boolean;               // スレッド作成時にスペース参加メンバーに「自分宛」通知を送信するか（デフォルト: false）
};
```

**振る舞い**:

| メソッド | シグネチャ | 説明 |
|----------|-----------|------|
| rename | `rename(title: ThreadTitle): void` | スレッドタイトルを変更する |
| updateBody | `updateBody(body: string \| null): void` | スレッド本文を更新する（最大65,535文字） |

**不変条件**:
- `title` は1文字以上128文字以下
- `body` は最大65,535文字
- `isDefault === true` のスレッドは削除不可
- `createdAt <= updatedAt`
- マルチスレッド未使用のスペースではデフォルトスレッド以外のスレッドは作成不可

**ライフサイクル**:
1. **作成**: スペース作成時にデフォルトスレッドが自動生成。マルチスレッド有効時は追加スレッドを作成可能
2. **更新**: タイトル・本文の編集（スペース管理者またはスレッド作成者のみ）
3. **削除**: スペース管理者がスレッドを削除する（デフォルトスレッドは削除不可）。関連コメントも連鎖削除

---

### 4. ThreadComment（スレッドコメント）

スレッドに投稿されるコメント。リッチテキスト・@メンション・ファイル添付をサポートする。

```typescript
type ThreadComment = {
  commentId: ThreadCommentId;
  threadId: ThreadId;                    // 所属スレッド
  spaceId: SpaceId;                      // 所属スペース（検索効率のため保持）
  text: string | null;                   // コメント本文（最大65,535文字）。files と合わせていずれか必須
  mentions: Mention[];                   // 宛先指定（最大10件）
  files: CommentFile[];                  // 添付ファイル（最大5件）
  creatorId: UserId;                     // 投稿者
  createdAt: Date;                       // 投稿日時
};
```

**振る舞い**:

| メソッド | シグネチャ | 説明 |
|----------|-----------|------|
| validate | `validate(): void` | コメントが有効か検証する。text と files のいずれか必須 |

**不変条件**:
- `text` と `files` の少なくとも一方は空でないこと
- `text` は最大65,535文字
- `mentions` は最大10件
- `files` は最大5件
- コメントは作成後に編集不可（削除のみ可能）

**ライフサイクル**:
1. **作成**: スペース参加者がスレッドにコメントを投稿する
2. **削除**: 投稿者本人またはスペース管理者がコメントを削除する

---

### 5. SpaceAnnouncement（お知らせ）

スペースのポータルに掲示されるリッチテキストコンテンツ。スペースごとに1つ存在する。

```typescript
type SpaceAnnouncement = {
  spaceId: SpaceId;                      // 所属スペース
  body: string;                          // お知らせ本文（リッチテキスト/HTML）
  updatedAt: Date;                       // 最終更新日時
  updatedBy: UserId;                     // 最終更新者
};
```

**振る舞い**:

| メソッド | シグネチャ | 説明 |
|----------|-----------|------|
| updateBody | `updateBody(body: string, updatedBy: UserId): void` | お知らせ本文を更新する |

**不変条件**:
- `body` は最大65,535文字（リッチテキスト/HTML。実装時に適切な上限を設定すること）
- マルチスレッドが有効なスペースでのみ編集可能（シングルスレッドスペースの場合はデフォルトスレッドの本文がお知らせの役割を担う）
- 編集はスペース管理者のみ可能（ユースケース層で制御）

**ライフサイクル**:
1. **作成**: スペース作成時に空のお知らせが自動生成される
2. **更新**: スペース管理者がリッチテキストエディタで編集する
3. **削除**: スペース削除時に連鎖削除される

---

### 6. SpaceMember（スペースメンバー）

スペースに参加しているメンバーのエンティティ。ユーザー・組織・グループの3種別を扱う。

```typescript
type SpaceMember = {
  spaceId: SpaceId;                      // 所属スペース
  entity: MemberEntity;                  // メンバーエンティティ（ユーザー/組織/グループ）
  isAdmin: boolean;                      // 管理者フラグ
  includeSubs: boolean;                  // 下位組織を含めるか（ORGANIZATION の場合のみ有効）
};
```

**振る舞い**:

| メソッド | シグネチャ | 説明 |
|----------|-----------|------|
| setAdmin | `setAdmin(isAdmin: boolean): void` | 管理者フラグを変更する |
| setIncludeSubs | `setIncludeSubs(includeSubs: boolean): void` | 下位組織を含める設定を変更する。ORGANIZATION 以外はエラー |

**不変条件**:
- `includeSubs` は `entity.type === "ORGANIZATION"` の場合のみ `true` にできる
- スペースには少なくとも1人の管理者が必要（最後の管理者の権限剥奪は不可）
- 使用停止中・削除済みユーザーはメンバーとして追加できない

**ライフサイクル**:
1. **追加**: スペース作成時に作成者が管理者として自動追加。以降はスペース管理者がメンバーを追加
2. **更新**: 管理者フラグ・下位組織設定の変更
3. **削除**: スペース管理者がメンバーを削除（退会させる）。`fixedMember` 有効時はユーザー自身の退会が禁止される

---

### 7. SpaceTemplate（スペーステンプレート）

スペースの構成を再利用可能なテンプレートとして保存したもの。

```typescript
type SpaceTemplate = {
  templateId: SpaceTemplateId;
  name: string;                          // テンプレート名（必須）
  sourceSpaceId: SpaceId;                // 元となったスペースのID
  useMultiThread: boolean;               // マルチスレッド設定
  fixedMember: boolean;                  // 固定メンバー設定
  appCreationPermission: AppCreationPermission; // アプリ作成権限設定
  coverImage: CoverImage;               // カバー画像
  portalDisplay: PortalDisplayConfig;    // ポータル表示設定
  threadNames: string[];                 // テンプレートに含まれるスレッド名一覧
  appIds: AppId[];                       // テンプレートに含まれるアプリID一覧
  relatedLinks: RelatedLink[];           // テンプレートに含まれる関連リンク一覧
  announcementBody?: string;             // テンプレートに含まれるお知らせ本文（リッチテキスト/HTML、任意）
  createdAt: Date;                       // 作成日時
};
```

**振る舞い**:

| メソッド | シグネチャ | 説明 |
|----------|-----------|------|
| rename | `rename(name: string): void` | テンプレート名を変更する |

**不変条件**:
- `name` は空文字であってはならない

**ライフサイクル**:
1. **作成**: スペース管理者が既存スペースからテンプレートを作成する
2. **利用**: テンプレートから新しいスペースを作成する
3. **削除**: テンプレートを削除する

---

## 値オブジェクト

### 識別子

```typescript
type SpaceId = { readonly _brand: "SpaceId"; readonly value: string };
type ThreadId = { readonly _brand: "ThreadId"; readonly value: string };
type ThreadCommentId = { readonly _brand: "ThreadCommentId"; readonly value: string };
type SpaceTemplateId = { readonly _brand: "SpaceTemplateId"; readonly value: string };
type RelatedLinkId = { readonly _brand: "RelatedLinkId"; readonly value: string };
type CommentLikeId = { readonly _brand: "CommentLikeId"; readonly value: string };

// 他ドメインからの参照（IDのみ）
type UserId = { readonly _brand: "UserId"; readonly value: string };
type OrganizationId = { readonly _brand: "OrganizationId"; readonly value: string };
type GroupId = { readonly _brand: "GroupId"; readonly value: string };
type AppId = { readonly _brand: "AppId"; readonly value: string };
type FileKey = { readonly _brand: "FileKey"; readonly value: string };
```

### 列挙型

```typescript
// アプリ作成権限
type AppCreationPermission = "EVERYONE" | "ADMIN";

// カバー画像種別
type CoverType = "PRESET" | "BLOB";

// メンバーエンティティ種別
type MemberEntityType = "USER" | "ORGANIZATION" | "GROUP";

// メンション種別
type MentionType = "USER" | "ORGANIZATION" | "GROUP";
```

### 構造値オブジェクト

#### SpaceName

スペース名。1-128文字。

```typescript
type SpaceName = {
  readonly value: string;
};

// 等価性: value が一致すれば等しい
// バリデーション:
//   - 空文字でないこと
//   - 128文字以下であること
```

#### ThreadTitle

スレッドタイトル。1-128文字。必須。

```typescript
type ThreadTitle = {
  readonly value: string;
};

// 等価性: value が一致すれば等しい
// バリデーション:
//   - 空文字でないこと
//   - 128文字以下であること
```

#### CoverImage

スペースのカバー画像。28種のプリセットまたはカスタムアップロード。

```typescript
type CoverImage = {
  readonly type: CoverType;              // PRESET | BLOB
  readonly key: string | null;           // プリセットキー（PRESET 時）
  readonly fileKey: FileKey | null;      // アップロードファイルキー（BLOB 時、最大5MB）
  readonly url: string | null;           // 画像URL（表示用、読み取り専用）
};

// 等価性: type + key（PRESET）または type + fileKey（BLOB）が一致すれば等しい
// バリデーション:
//   - PRESET の場合、key が有効なプリセットキーであること
//   - BLOB の場合、fileKey が存在すること
//   - カスタム画像のファイルサイズは最大5MB
```

#### PortalDisplayConfig

スペースポータルの表示セクション設定。

```typescript
type PortalDisplayConfig = {
  readonly showAnnouncement: boolean;    // お知らせ表示（デフォルト: true）
  readonly showThreadList: boolean;      // スレッド一覧表示（デフォルト: true）
  readonly showAppList: boolean;         // アプリ一覧表示（デフォルト: true）
  readonly showMemberList: boolean;      // メンバー一覧表示（デフォルト: true）
  readonly showRelatedLinkList: boolean; // 関連リンク一覧表示（デフォルト: true）
};

// 等価性: 全フィールドが一致すれば等しい
```

#### MemberEntity

メンバーのエンティティ情報。ユーザー・組織・グループのいずれか。

```typescript
type MemberEntity = {
  readonly type: MemberEntityType;       // USER | ORGANIZATION | GROUP
  readonly id: UserId | OrganizationId | GroupId; // エンティティID
  readonly code: string;                 // エンティティコード
};

// 等価性: type + id が一致すれば等しい
// バリデーション:
//   - code が空文字でないこと
```

#### Mention

コメント内の宛先指定。

```typescript
type Mention = {
  readonly type: MentionType;            // USER | ORGANIZATION | GROUP
  readonly code: string;                 // 宛先コード（ユーザーコード/組織コード/グループコード）
};

// 等価性: type + code が一致すれば等しい
// バリデーション:
//   - code が空文字でないこと
```

#### CommentFile

コメントに添付されるファイル。

```typescript
type CommentFile = {
  readonly fileKey: FileKey;             // ファイルキー（File ドメインへの参照）
  readonly width: number | null;         // 画像の表示幅（100-750px、画像の場合のみ）
};

// 等価性: fileKey が一致すれば等しい
// バリデーション:
//   - fileKey が空でないこと
//   - width が指定される場合、100-750 の範囲内であること
```

#### RelatedLink

スペースに紐づけられた外部URLリンク。

```typescript
type RelatedLink = {
  readonly linkId: RelatedLinkId;
  readonly spaceId: SpaceId;
  readonly title: string;                // リンクタイトル（必須）
  readonly url: string;                  // リンクURL（必須）
};

// 等価性: linkId が一致すれば等しい
// バリデーション:
//   - title が空文字でないこと
//   - url が空文字でないこと
//   - url が有効なURL形式であること
```

#### CommentLike

コメントに対する「いいね」。

```typescript
type CommentLike = {
  readonly likeId: CommentLikeId;
  readonly commentId: ThreadCommentId;
  readonly userId: UserId;               // いいねしたユーザー
  readonly createdAt: Date;
};

// 等価性: likeId が一致すれば等しい
// 制約: 同一ユーザーが同一コメントに対して複数のいいねは不可
```

#### ThreadFollow

スレッドのフォロー状態。

```typescript
type ThreadFollow = {
  readonly threadId: ThreadId;
  readonly userId: UserId;
};

// 等価性: threadId + userId が一致すれば等しい
```

---

## ドメインサービス

### SpaceCreationService

スペースの作成に関するビジネスロジックを提供する。スペース・デフォルトスレッド・初期メンバーの生成を一括で行う。

#### 依存ポート

- SpaceRepository
- ThreadRepository
- SpaceMemberRepository
- SpaceTemplateRepository

#### メソッド

```typescript
// 白紙からスペースを作成する
createSpace(params: {
  name: SpaceName;
  isPrivate: boolean;
  isGuest: boolean;
  useMultiThread: boolean;
  fixedMember: boolean;
  appCreationPermission: AppCreationPermission;
  coverImage: CoverImage;
  members: Array<{
    entity: MemberEntity;
    isAdmin: boolean;
    includeSubs: boolean;
  }>;
  creatorId: UserId;
}): Result<{ space: Space; defaultThread: Thread }, SpaceCreationError>
// 処理:
//   1. isGuest === true の場合、isPrivate を true に強制
//   2. isGuest に応じてスペース数上限チェック（通常: 500, ゲスト: 500）
//   3. members に管理者が1名以上含まれることを検証
//   4. Space エンティティを生成
//   5. デフォルト Thread を生成（title はスペース名と同一）
//   6. 作成者を管理者として SpaceMember に追加
//   7. 指定されたメンバーを SpaceMember に追加
//   8. 各リポジトリに保存
// エラー:
//   - SpaceLimitExceededError: スペース数上限超過（通常500 / ゲスト500）
//   - NoAdminMemberError: 管理者が1名も指定されていない
//   - GuestSpaceFeatureDisabledError: ゲストスペース機能が無効

// テンプレートからスペースを作成する
createSpaceFromTemplate(params: {
  templateId: SpaceTemplateId;
  name: SpaceName;
  isPrivate: boolean;
  isGuest: boolean;
  fixedMember: boolean;
  members: Array<{
    entity: MemberEntity;
    isAdmin: boolean;
    includeSubs: boolean;
  }>;
  creatorId: UserId;
}): Result<{ space: Space; threads: Thread[] }, SpaceCreationError>
// 処理:
//   1. SpaceTemplateRepository からテンプレートを取得
//   2. テンプレートの設定を基に Space を生成（name, isPrivate, fixedMember はパラメータで上書き）
//   3. テンプレートの threadNames に基づいて Thread を生成
//   4. メンバーを追加
//   5. 各リポジトリに保存
// エラー:
//   - SpaceTemplateNotFoundError: テンプレートが存在しない
//   - SpaceLimitExceededError / NoAdminMemberError（createSpace と同様）
```

---

### SpaceMembershipService

スペースメンバーの参加・退会・権限変更に関するビジネスロジックを提供する。

#### 依存ポート

- SpaceRepository
- SpaceMemberRepository

#### メソッド

```typescript
// メンバーを一括更新する（既存メンバーを指定リストで置き換える）
replaceMembers(params: {
  spaceId: SpaceId;
  members: Array<{
    entity: MemberEntity;
    isAdmin: boolean;
    includeSubs: boolean;
  }>;
}): Result<void, MembershipError>
// 処理:
//   1. SpaceRepository でスペースの存在を確認
//   2. members に管理者が1名以上含まれることを検証
//   3. 使用停止中・削除済みユーザーが含まれていないことを検証（ユースケース層で Identity に問い合わせ）
//   4. 既存メンバーを全削除し、新しいメンバーリストで置き換え
// エラー:
//   - SpaceNotFoundError: スペースが存在しない
//   - NoAdminMemberError: 管理者が1名も含まれていない

// ユーザーがスペースから退会する（自発的退会）
leaveSpace(params: {
  spaceId: SpaceId;
  userId: UserId;
}): Result<void, MembershipError>
// 処理:
//   1. SpaceRepository でスペースの存在確認
//   2. space.fixedMember が true の場合は FixedMemberError
//   3. 退会するユーザーが最後の管理者の場合は LastAdminError
//   4. SpaceMemberRepository からメンバーを削除
// エラー:
//   - SpaceNotFoundError: スペースが存在しない
//   - FixedMemberError: 固定メンバー設定により退会禁止
//   - LastAdminError: 最後の管理者は退会できない
//   - NotMemberError: スペースに参加していない

// ユーザーがスペースのメンバーかどうかを判定する
isMember(params: {
  spaceId: SpaceId;
  userId: UserId;
}): Promise<boolean>
// 処理:
//   1. SpaceMemberRepository から直接メンバーとして登録されているか確認
//   2. 組織/グループ経由の間接メンバーシップも考慮（ユースケース層で Identity ドメインと連携）

// 管理者の最低1名保証を検証する
validateAdminExists(params: {
  spaceId: SpaceId;
  excludeUserId?: UserId;
}): Result<void, LastAdminError>
// 処理:
//   1. SpaceMemberRepository でスペースの管理者数を取得
//   2. excludeUserId が指定されている場合、そのユーザーを除いた管理者数で判定
//   3. 管理者が0名になる場合は LastAdminError
```

---

### ThreadFollowService

スレッドのフォロー/フォロー解除に関するビジネスロジックを提供する。

#### 依存ポート

- SpaceRepository
- ThreadFollowRepository

#### メソッド

```typescript
// スレッドをフォローする
follow(params: {
  threadId: ThreadId;
  userId: UserId;
}): Result<void, ThreadFollowError>
// 処理:
//   1. スレッドの存在を確認
//   2. スペースの fixedMember 設定を確認（fixedMember が true の場合はフォロー変更不可）
//   3. ThreadFollowRepository にフォロー関係を保存
// エラー:
//   - ThreadNotFoundError: スレッドが存在しない
//   - FixedMemberError: 固定メンバー設定によりフォロー変更禁止
//   - AlreadyFollowingError: すでにフォロー中

// スレッドのフォローを解除する
unfollow(params: {
  threadId: ThreadId;
  userId: UserId;
}): Result<void, ThreadFollowError>
// 処理:
//   1. スレッドの存在を確認
//   2. スペースの fixedMember 設定を確認
//   3. ThreadFollowRepository からフォロー関係を削除
// エラー:
//   - ThreadNotFoundError: スレッドが存在しない
//   - FixedMemberError: 固定メンバー設定によりフォロー変更禁止
//   - NotFollowingError: フォローしていない
```

---

## ポート

### 1. SpaceRepository（スペースリポジトリ）

```typescript
interface SpaceRepository {
  /** ID でスペースを取得する */
  findById(spaceId: SpaceId): Promise<Space | null>;

  /** 条件に基づきスペース一覧を取得する */
  list(filter: SpaceListFilter, offset: number, limit: number): Promise<Space[]>;

  /** 条件に基づきスペース数を取得する */
  count(filter: SpaceListFilter): Promise<number>;

  /** 通常スペースの総数を取得する */
  countRegular(): Promise<number>;

  /** ゲストスペースの総数を取得する */
  countGuest(): Promise<number>;

  /** スペースを保存する（新規作成・更新） */
  save(space: Space): Promise<void>;

  /** スペースを削除する（物理削除） */
  delete(spaceId: SpaceId): Promise<void>;
  // エラー: スペースが存在しない場合は SpaceNotFoundError
}

type SpaceListFilter = {
  isGuest?: boolean;               // ゲストスペースのみ/通常スペースのみ
  isPrivate?: boolean;             // 公開/非公開
  keyword?: string;                // スペース名で部分一致検索
  memberUserId?: UserId;           // 指定ユーザーが参加しているスペース
};
```

### 2. ThreadRepository（スレッドリポジトリ）

```typescript
interface ThreadRepository {
  /** ID でスレッドを取得する */
  findById(threadId: ThreadId): Promise<Thread | null>;

  /** スペースに属する全スレッドを取得する */
  findBySpaceId(spaceId: SpaceId): Promise<Thread[]>;

  /** スペースのデフォルトスレッドを取得する */
  findDefaultBySpaceId(spaceId: SpaceId): Promise<Thread | null>;

  /** スレッドを保存する（新規作成・更新） */
  save(thread: Thread): Promise<void>;

  /** スレッドを削除する */
  delete(threadId: ThreadId): Promise<void>;
  // エラー: デフォルトスレッドの場合は DefaultThreadDeletionError
  // エラー: スレッドが存在しない場合は ThreadNotFoundError

  /** スペースのスレッド数を取得する */
  countBySpaceId(spaceId: SpaceId): Promise<number>;
}
```

### 3. ThreadCommentRepository（スレッドコメントリポジトリ）

```typescript
interface ThreadCommentRepository {
  /** ID でコメントを取得する */
  findById(commentId: ThreadCommentId): Promise<ThreadComment | null>;

  /** スレッドに属するコメントを取得する（ページネーション付き） */
  findByThreadId(
    threadId: ThreadId,
    offset: number,
    limit: number
  ): Promise<{ comments: ThreadComment[]; totalCount: number }>;

  /** コメントを保存する（新規作成のみ、編集不可） */
  save(comment: ThreadComment): Promise<void>;

  /** コメントを削除する */
  delete(commentId: ThreadCommentId): Promise<void>;
  // エラー: コメントが存在しない場合は CommentNotFoundError

  /** スレッドの全コメントを削除する（スレッド削除時の連鎖削除用） */
  deleteByThreadId(threadId: ThreadId): Promise<void>;
}
```

### 4. SpaceMemberRepository（スペースメンバーリポジトリ）

```typescript
interface SpaceMemberRepository {
  /** スペースの全メンバーを取得する */
  findBySpaceId(spaceId: SpaceId): Promise<SpaceMember[]>;

  /** スペースの管理者メンバーを取得する */
  findAdminsBySpaceId(spaceId: SpaceId): Promise<SpaceMember[]>;

  /** 特定ユーザーの特定スペースにおけるメンバー情報を取得する */
  findBySpaceIdAndUserId(spaceId: SpaceId, userId: UserId): Promise<SpaceMember | null>;

  /** 特定ユーザーが参加している全スペースのメンバー情報を取得する */
  findByUserId(userId: UserId): Promise<SpaceMember[]>;

  /** スペースの管理者数を取得する */
  countAdminsBySpaceId(spaceId: SpaceId): Promise<number>;

  /** メンバーを保存する（新規追加・更新） */
  save(member: SpaceMember): Promise<void>;

  /** メンバーを削除する */
  delete(spaceId: SpaceId, entity: MemberEntity): Promise<void>;
  // エラー: メンバーが存在しない場合は NotMemberError

  /** スペースの全メンバーを削除する（スペース削除時の連鎖削除用） */
  deleteBySpaceId(spaceId: SpaceId): Promise<void>;

  /** スペースの全メンバーを置き換える */
  replaceAll(spaceId: SpaceId, members: SpaceMember[]): Promise<void>;
}
```

### 5. SpaceAnnouncementRepository（お知らせリポジトリ）

```typescript
interface SpaceAnnouncementRepository {
  /** スペースのお知らせを取得する */
  findBySpaceId(spaceId: SpaceId): Promise<SpaceAnnouncement | null>;

  /** お知らせを保存する（新規作成・更新） */
  save(announcement: SpaceAnnouncement): Promise<void>;

  /** お知らせを削除する（スペース削除時の連鎖削除用） */
  deleteBySpaceId(spaceId: SpaceId): Promise<void>;
}
```

### 6. RelatedLinkRepository（関連リンクリポジトリ）

```typescript
interface RelatedLinkRepository {
  /** ID で関連リンクを取得する */
  findById(linkId: RelatedLinkId): Promise<RelatedLink | null>;

  /** スペースに属する全関連リンクを取得する */
  findBySpaceId(spaceId: SpaceId): Promise<RelatedLink[]>;

  /** 関連リンクを保存する（新規作成・更新） */
  save(link: RelatedLink): Promise<void>;

  /** 関連リンクを削除する */
  delete(linkId: RelatedLinkId): Promise<void>;
  // エラー: リンクが存在しない場合は RelatedLinkNotFoundError

  /** スペースの全関連リンクを削除する（スペース削除時の連鎖削除用） */
  deleteBySpaceId(spaceId: SpaceId): Promise<void>;
}
```

### 7. SpaceTemplateRepository（スペーステンプレートリポジトリ）

```typescript
interface SpaceTemplateRepository {
  /** ID でテンプレートを取得する */
  findById(templateId: SpaceTemplateId): Promise<SpaceTemplate | null>;

  /** テンプレート一覧を取得する */
  list(offset: number, limit: number): Promise<{ templates: SpaceTemplate[]; totalCount: number }>;

  /** テンプレートを保存する（新規作成・更新） */
  save(template: SpaceTemplate): Promise<void>;

  /** テンプレートを削除する */
  delete(templateId: SpaceTemplateId): Promise<void>;
  // エラー: テンプレートが存在しない場合は SpaceTemplateNotFoundError
}
```

### 8. ThreadFollowRepository（スレッドフォローリポジトリ）

```typescript
interface ThreadFollowRepository {
  /** ユーザーがスレッドをフォローしているかどうかを取得する */
  exists(threadId: ThreadId, userId: UserId): Promise<boolean>;

  /** スレッドのフォロワー一覧を取得する */
  findByThreadId(threadId: ThreadId): Promise<ThreadFollow[]>;

  /** ユーザーがフォローしているスレッド一覧を取得する */
  findByUserId(userId: UserId): Promise<ThreadFollow[]>;

  /** フォロー関係を保存する */
  save(follow: ThreadFollow): Promise<void>;
  // エラー: すでにフォロー中の場合は AlreadyFollowingError

  /** フォロー関係を削除する */
  delete(threadId: ThreadId, userId: UserId): Promise<void>;
  // エラー: フォローしていない場合は NotFollowingError

  /** スレッドの全フォロー関係を削除する（スレッド削除時の連鎖削除用） */
  deleteByThreadId(threadId: ThreadId): Promise<void>;
}
```

### 9. CommentLikeRepository（いいねリポジトリ）

```typescript
interface CommentLikeRepository {
  /** コメントのいいね一覧を取得する */
  findByCommentId(commentId: ThreadCommentId): Promise<CommentLike[]>;

  /** ユーザーがコメントにいいねしているかどうかを取得する */
  exists(commentId: ThreadCommentId, userId: UserId): Promise<boolean>;

  /** いいねを保存する */
  save(like: CommentLike): Promise<void>;
  // エラー: すでにいいね済みの場合は AlreadyLikedError

  /** いいねを削除する（いいね取り消し） */
  delete(commentId: ThreadCommentId, userId: UserId): Promise<void>;
  // エラー: いいねしていない場合は NotLikedError

  /** コメントの全いいねを削除する（コメント削除時の連鎖削除用） */
  deleteByCommentId(commentId: ThreadCommentId): Promise<void>;
}
```

---

## エラー型

```typescript
// スペース作成エラー
type SpaceCreationError =
  | SpaceLimitExceededError
  | NoAdminMemberError
  | GuestSpaceFeatureDisabledError
  | SpaceTemplateNotFoundError;

// メンバーシップエラー
type MembershipError =
  | SpaceNotFoundError
  | NoAdminMemberError
  | FixedMemberError
  | LastAdminError
  | NotMemberError;

// スレッドフォローエラー
type ThreadFollowError =
  | ThreadNotFoundError
  | FixedMemberError
  | AlreadyFollowingError
  | NotFollowingError;

// 個別エラー型
type SpaceNotFoundError = { kind: "SpaceNotFound"; spaceId: SpaceId };
type ThreadNotFoundError = { kind: "ThreadNotFound"; threadId: ThreadId };
type CommentNotFoundError = { kind: "CommentNotFound"; commentId: ThreadCommentId };
type SpaceTemplateNotFoundError = { kind: "SpaceTemplateNotFound"; templateId: SpaceTemplateId };
type RelatedLinkNotFoundError = { kind: "RelatedLinkNotFound"; linkId: RelatedLinkId };
type DefaultThreadDeletionError = { kind: "DefaultThreadDeletion"; threadId: ThreadId };

type SpaceLimitExceededError = {
  kind: "SpaceLimitExceeded";
  spaceType: "REGULAR" | "GUEST";
  currentCount: number;
  maxCount: number;                      // 500
};

type NoAdminMemberError = { kind: "NoAdminMember"; spaceId: SpaceId };
type LastAdminError = { kind: "LastAdmin"; spaceId: SpaceId; userId: UserId };
type FixedMemberError = { kind: "FixedMember"; spaceId: SpaceId };
type GuestSpaceFeatureDisabledError = { kind: "GuestSpaceFeatureDisabled" };

type NotMemberError = { kind: "NotMember"; spaceId: SpaceId; userId: UserId };
type AlreadyFollowingError = { kind: "AlreadyFollowing"; threadId: ThreadId; userId: UserId };
type NotFollowingError = { kind: "NotFollowing"; threadId: ThreadId; userId: UserId };
type AlreadyLikedError = { kind: "AlreadyLiked"; commentId: ThreadCommentId; userId: UserId };
type NotLikedError = { kind: "NotLiked"; commentId: ThreadCommentId; userId: UserId };

type MultiThreadIrreversibleError = { kind: "MultiThreadIrreversible"; spaceId: SpaceId };
type GuestSpacePrivacyError = { kind: "GuestSpacePrivacy"; spaceId: SpaceId };

type EmptySpaceNameError = { kind: "EmptySpaceName" };
type SpaceNameTooLongError = { kind: "SpaceNameTooLong"; length: number; maxLength: 128 };
type EmptyThreadTitleError = { kind: "EmptyThreadTitle" };
type ThreadTitleTooLongError = { kind: "ThreadTitleTooLong"; length: number; maxLength: 128 };
type ThreadBodyTooLongError = { kind: "ThreadBodyTooLong"; length: number; maxLength: 65535 };
type EmptyCommentError = { kind: "EmptyComment" };
type TooManyMentionsError = { kind: "TooManyMentions"; count: number; maxCount: 10 };
type TooManyFilesError = { kind: "TooManyFiles"; count: number; maxCount: 5 };
type InvalidCoverImageError = { kind: "InvalidCoverImage"; reason: string };
type MultiThreadRequiredError = { kind: "MultiThreadRequired"; spaceId: SpaceId };
```

---

## ユースケース（概要）

### スペースライフサイクル

| # | ユースケース名 | 概要 | 主要アクター |
|---|--------------|------|-------------|
| 1 | スペース作成（白紙） | 新しいスペースを作成する。デフォルトスレッドと初期メンバーを生成 | スペース作成権限保持者 |
| 2 | スペース作成（テンプレート） | テンプレートからスペースを作成する | スペース作成権限保持者 |
| 3 | ゲストスペース作成 | ゲストスペースを作成する。isPrivate は常に true | ゲストスペース作成権限保持者 |
| 4 | スペース設定変更 | スペース名・公開設定・マルチスレッド・カバー画像・ポータル表示等を変更 | スペース管理者 |
| 5 | スペース削除 | スペースと関連データ（スレッド・コメント・メンバー・お知らせ・関連リンク）を削除 | スペース管理者 |
| 6 | スペース情報取得 | スペースの詳細情報を取得する。非公開スペースはメンバーのみ | 認証済みユーザー |
| 7 | スペース使用状況一覧取得 | 全スペースの統計情報（メンバー数・管理者数等）を一覧で取得する | システム管理者 |

### メンバー管理

| # | ユースケース名 | 概要 | 主要アクター |
|---|--------------|------|-------------|
| 8 | メンバー一覧取得 | スペースのメンバー一覧を取得する | 認証済みユーザー（メンバーまたは公開スペース） |
| 9 | メンバー一括更新 | スペースのメンバー構成を置き換える。管理者1名以上が必須 | スペース管理者 |
| 10 | スペース退会 | ユーザーが自発的にスペースを退会する。fixedMember 時は不可 | スペースメンバー |
| 11 | ゲストメンバー更新 | ゲストスペースのゲストメンバーを更新する | スペース管理者 |

### スレッド管理

| # | ユースケース名 | 概要 | 主要アクター |
|---|--------------|------|-------------|
| 12 | スレッド作成 | マルチスレッドスペースに新しいスレッドを作成する。通知オプション付き | スペースメンバー |
| 13 | スレッド更新 | スレッドのタイトル・本文を更新する | スペース管理者 / スレッド作成者 |
| 14 | スレッド削除 | スレッドと関連コメントを削除する。デフォルトスレッドは削除不可 | スペース管理者 |
| 15 | スレッドフォロー | スレッドの更新通知を受け取るようフォローする | スペースメンバー |
| 16 | スレッドフォロー解除 | スレッドのフォローを解除する。fixedMember 時は不可 | スペースメンバー |

### コメント管理

| # | ユースケース名 | 概要 | 主要アクター |
|---|--------------|------|-------------|
| 17 | コメント投稿 | スレッドにコメントを投稿する。@メンション・ファイル添付付き | スペースメンバー |
| 18 | コメント削除 | コメントを削除する | 投稿者本人 / スペース管理者 |
| 19 | コメントにいいね | コメントに「いいね」を付与する（トグル） | スペースメンバー |
| 20 | 返信（@メンション自動挿入） | 元コメント投稿者への@メンション付きでコメント投稿する | スペースメンバー |
| 21 | 全員に返信 | スレッド参加者全員への@メンション付きでコメント投稿する | スペースメンバー |

### お知らせ管理

| # | ユースケース名 | 概要 | 主要アクター |
|---|--------------|------|-------------|
| 22 | お知らせ更新 | スペースのお知らせ本文を更新する。マルチスレッドスペースのみ | スペース管理者 |

### 関連リンク管理

| # | ユースケース名 | 概要 | 主要アクター |
|---|--------------|------|-------------|
| 23 | 関連リンク追加 | スペースに関連リンクを追加する | スペース管理者 |
| 24 | 関連リンク削除 | スペースの関連リンクを削除する | スペース管理者 |
| 25 | 関連リンク一覧取得 | スペースの関連リンク一覧を取得する | スペースメンバー |

### テンプレート管理

| # | ユースケース名 | 概要 | 主要アクター |
|---|--------------|------|-------------|
| 26 | テンプレート作成 | 既存スペースの構成をテンプレートとして保存する | スペース管理者 |
| 27 | テンプレート一覧取得 | スペーステンプレートの一覧を取得する | スペース作成権限保持者 |
| 28 | テンプレート削除 | スペーステンプレートを削除する | システム管理者 |

### ゲストユーザー管理

| # | ユースケース名 | 概要 | 主要アクター |
|---|--------------|------|-------------|
| 29 | ゲストユーザー追加 | ゲストユーザーを OpenDesk に追加する。招待メールは送信されない | システム管理者 |
| 30 | ゲストユーザー削除 | ゲストユーザーを OpenDesk から削除する | システム管理者 |

---

## システム制約

| 制約 | 値 |
|------|-----|
| 通常スペース最大数 | 500 |
| ゲストスペース最大数 | 500 |
| スペース名最大文字数 | 128 |
| スレッドタイトル最大文字数 | 128 |
| スレッド本文最大文字数 | 65,535 |
| コメント本文最大文字数 | 65,535 |
| コメントあたりの最大メンション数 | 10 |
| コメントあたりの最大添付ファイル数 | 5 |
| カバー画像プリセット数 | 28 |
| カスタムカバー画像最大サイズ | 5MB |
| 画像表示幅の範囲 | 100-750px |
| スペース使用状況取得の最大件数 | 100件/リクエスト |
