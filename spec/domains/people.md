# People ドメイン設計

## 概要

People ドメインは、ユーザーの個人プロフィール拡張情報・ステータス投稿・フォロー関係を管理する Generic ドメインである。Identity ドメインが管理する基本的なユーザー情報（表示名・メールアドレス・組織等）を土台として、カバー画像やプロフィールセクション（コメント・基本情報・連絡先・その他）による拡張プロフィール、SNS的なステータス投稿（リッチテキスト、メンション、ファイル添付、絵文字対応）、ユーザー間のフォロー/フォロワー関係を提供する。

OpenDesk システム管理で「ピープル機能とメッセージ機能を利用する」が有効な場合のみ使用可能。機能を無効にしても既存データは保持される。

---

## ユビキタス言語

| 英語名 | 日本語名 | 定義 |
|--------|---------|------|
| Profile | プロフィール | Identity ドメインのユーザー情報を拡張するプロフィール情報。カバー画像やプロフィールセクションを持つ |
| CoverImage | カバー画像 | プロフィールページの上部に表示される背景画像。最大5MB |
| ProfileSection | プロフィールセクション | プロフィール詳細に表示される情報グループ。コメント・基本情報・連絡先・その他の4種類 |
| Post | 投稿（ステータス投稿） | ユーザーがプロフィールページに書き込むステータス的なメッセージ。リッチテキスト形式 |
| Follow | フォロー | あるユーザーが別のユーザーを「フォロー」する関係。フォロワーはフォロイーの投稿を通知で受け取れる |
| Follower | フォロワー | 自分をフォローしているユーザー |
| Followee | フォロイー（フォロー中） | 自分がフォローしているユーザー |
| Mention | 宛先指定 | 投稿内で特定のユーザー・グループ・組織を宛先として指定すること |

---

## 他ドメインとの関係

| 参照先ドメイン | 参照方法 | 用途 |
|--------------|---------|------|
| Identity | UserId（値オブジェクト） | プロフィールの所有者・投稿の著者・フォロー関係の参照 |
| File | FileKey（値オブジェクト） | カバー画像・投稿の添付ファイルの参照 |

プロフィールの基本情報（表示名・メールアドレス・組織等）は Identity ドメインのユーザーエンティティが保持する。People ドメインはそれを補完する拡張情報のみを管理する。プロフィール表示時は、ユースケース層で Identity ドメインの情報と統合する。

---

## エンティティ

### Profile（プロフィール）

Identity ドメインのユーザー情報を拡張するプロフィール。カバー画像とプロフィールセクションの追加情報を管理する。ユーザーと1対1の関係を持つ。

#### フィールド

| フィールド名 | 型 | 必須 | 説明 |
|-------------|-----|------|------|
| userId | UserId | 必須 | Identity ドメインのユーザーIDへの参照（プロフィールの所有者） |
| coverImageFileKey | FileKey | 任意 | カバー画像のファイルキー（null の場合はカバー画像なし） |
| comment | string | 任意 | 自由記述のコメント・メッセージ（プレーンテキスト） |
| updatedAt | Date | 必須 | 最終更新日時 |

#### ビヘイビア

```typescript
/**
 * カバー画像を設定する。
 * カバー画像は1枚のみ。既存のカバー画像がある場合は置き換えられる。
 * @param fileKey - 設定するカバー画像のファイルキー
 * 事後条件: coverImageFileKey が更新される
 * 事後条件: updatedAt が現在時刻に更新される
 */
setCoverImage(fileKey: FileKey): void;

/**
 * カバー画像を削除する。
 * カバー画像が設定されていない場合は何もしない（冪等）。
 * 事後条件: coverImageFileKey が null になる
 * 事後条件: updatedAt が現在時刻に更新される
 */
removeCoverImage(): void;

/**
 * コメントを更新する。
 * @param comment - 新しいコメント文字列（空文字でクリア可能）
 * 事後条件: comment が更新される
 * 事後条件: updatedAt が現在時刻に更新される
 */
updateComment(comment: string): void;
```

#### 不変条件

- `userId` はプロフィール作成後に変更不可
- カバー画像のファイルサイズは最大5MB（ファイルサイズ検証はユースケース層で File ドメインと連携）

#### ライフサイクル

1. **作成**: Identity ドメインでユーザー作成時に連動して自動作成される
2. **更新**: カバー画像の設定/削除、コメントの編集
3. **削除**: ユーザーが削除された場合にプロフィールも削除される（Identity ドメインのユーザー削除に連動）

---

### Post（投稿）

ユーザーがプロフィールページに書き込むステータス的なメッセージ。リッチテキスト形式（メンション・ファイル添付・絵文字対応）で、作成後は編集不可（削除のみ可能）。

#### フィールド

| フィールド名 | 型 | 必須 | 説明 |
|-------------|-----|------|------|
| postId | PostId | 必須 | 投稿の一意識別子 |
| authorId | UserId | 必須 | 投稿者のユーザーID |
| content | RichTextHtml | 必須 | 投稿本文（リッチテキスト HTML 形式） |
| mentions | Mention[] | 必須 | 宛先指定の一覧（空配列可） |
| attachmentFileKeys | FileKey[] | 必須 | 添付ファイルのキー一覧（空配列可） |
| createdAt | Date | 必須 | 投稿日時 |

#### ビヘイビア

```typescript
/**
 * 指定ユーザーが投稿の著者かどうかを判定する。
 * 削除権限の確認に使用する。
 * @param userId - 判定対象のユーザーID
 * @returns 投稿者本人の場合 true
 */
isOwnedBy(userId: UserId): boolean;
```

#### 不変条件

- `content` は空であってはならない（空文字の投稿は不可）
- 作成後に `content`、`mentions`、`attachmentFileKeys` は変更不可（編集機能なし、削除のみ）
- `authorId` は作成後に変更不可
- `createdAt` は作成後に変更不可

#### ライフサイクル

1. **作成**: ユーザーがプロフィールページの投稿フォームから「書き込む」を実行する
2. **表示**: プロフィールページに時系列で表示される
3. **削除**: 投稿者本人のみが削除可能

---

### Follow（フォロー関係）

ユーザー間のフォロー関係を表す。フォロワーはフォロイーの投稿を通知で受け取ることができる。

#### フィールド

| フィールド名 | 型 | 必須 | 説明 |
|-------------|-----|------|------|
| followerId | UserId | 必須 | フォローする側のユーザーID |
| followeeId | UserId | 必須 | フォローされる側のユーザーID |
| createdAt | Date | 必須 | フォロー開始日時 |

#### ビヘイビア

```typescript
// Follow はイミュータブルな関係エンティティ。
// フォロー/アンフォローは Follow の作成/削除で表現する。
// 振る舞いメソッドはない。
```

#### 不変条件

- `followerId` と `followeeId` は同一ユーザーであってはならない（自分自身のフォロー不可）
- `followerId` と `followeeId` の組み合わせはシステム全体で一意（重複フォロー不可、リポジトリ層で保証）
- 全フィールドは作成後に変更不可

#### ライフサイクル

1. **作成**: ユーザーが他ユーザーのプロフィールページで「フォロー」リンクをクリックする
2. **削除**: ユーザーが「フォロー解除」を実行する（トグル動作）

---

## 値オブジェクト

### PostId

投稿の一意識別子。

```typescript
type PostId = {
  readonly value: string; // UUID v4 形式
};

// 等価性: value が一致すれば等しい
// バリデーション: 空文字でないこと、有効な UUID 形式であること
```

### RichTextHtml

リッチテキストの HTML コンテンツ。XSS 対策のためサニタイズされた HTML 文字列を保持する。

```typescript
type RichTextHtml = {
  readonly value: string; // サニタイズ済み HTML 文字列
};

// 等価性: value が一致すれば等しい
// バリデーション:
//   - 許可されたタグのみを含むこと（スクリプトタグ等は除去）
//   - 空文字を許容するかはコンテキストによる（投稿本文では空文字不可）
// 許可されるHTML要素:
//   - テキスト書式: b, i, u, span（style属性: color, background-color, font-size）
//   - 構造: p, br, ul, ol, li, div
//   - リンク: a（href, target属性）
//   - 画像: img（src, alt, width, height属性）
```

### Mention

投稿内の宛先指定。ユーザー・グループ・組織を対象にできる。

```typescript
type Mention = {
  readonly type: "user" | "group" | "organization";
  readonly targetId: string; // UserId | GroupId | OrganizationId の value
};

// 等価性: type と targetId の両方が一致すれば等しい
// バリデーション:
//   - type は "user" | "group" | "organization" のいずれかであること
//   - targetId が空文字でないこと
```

---

## ドメインサービス

People ドメインにはドメインサービスは不要である。フォローの重複チェックはリポジトリ層の一意制約で保証し、自己フォロー禁止は Follow エンティティの不変条件で保証する。

---

## ポート

### ProfileRepository

プロフィールの永続化を担うリポジトリインターフェース。

```typescript
interface ProfileRepository {
  /**
   * ユーザーIDでプロフィールを取得する。
   * @param userId - プロフィール所有者のユーザーID
   * @returns プロフィール。存在しない場合は null
   */
  findByUserId(userId: UserId): Promise<Profile | null>;

  /**
   * プロフィールを保存する（新規作成または更新）。
   * @param profile - 保存するプロフィール
   */
  save(profile: Profile): Promise<void>;

  /**
   * プロフィールを削除する。
   * ユーザー削除に連動して呼び出される。
   * @param userId - 削除対象のユーザーID
   * @throws ProfileNotFoundError プロフィールが存在しない場合
   */
  delete(userId: UserId): Promise<void>;
}
```

### PostRepository

投稿の永続化を担うリポジトリインターフェース。

```typescript
interface PostRepository {
  /**
   * IDで投稿を取得する。
   * @param postId - 投稿の識別子
   * @returns 投稿。存在しない場合は null
   */
  findById(postId: PostId): Promise<Post | null>;

  /**
   * 指定ユーザーの投稿一覧を取得する（ページネーション付き、新しい順）。
   * @param params.authorId - 投稿者のユーザーID
   * @param params.offset - 取得開始位置（0始まり）
   * @param params.limit - 取得件数上限
   * @returns 投稿一覧と総件数
   */
  findByAuthorId(params: {
    authorId: UserId;
    offset: number;
    limit: number;
  }): Promise<{ posts: Post[]; totalCount: number }>;

  /**
   * 投稿を保存する（新規作成のみ。投稿は編集不可のため更新はない）。
   * @param post - 保存する投稿
   */
  save(post: Post): Promise<void>;

  /**
   * 投稿を削除する。
   * @param postId - 削除対象の投稿ID
   * @throws PostNotFoundError 投稿が存在しない場合
   */
  delete(postId: PostId): Promise<void>;
}
```

### FollowRepository

フォロー関係の永続化を担うリポジトリインターフェース。

```typescript
interface FollowRepository {
  /**
   * 指定の2ユーザー間のフォロー関係を取得する。
   * @param followerId - フォローする側のユーザーID
   * @param followeeId - フォローされる側のユーザーID
   * @returns フォロー関係。存在しない場合は null
   */
  findByPair(followerId: UserId, followeeId: UserId): Promise<Follow | null>;

  /**
   * 指定ユーザーのフォロワー一覧を取得する（ページネーション付き、新しい順）。
   * @param params.followeeId - フォローされている側のユーザーID
   * @param params.offset - 取得開始位置（0始まり）
   * @param params.limit - 取得件数上限
   * @returns フォロー関係一覧と総件数
   */
  findFollowers(params: {
    followeeId: UserId;
    offset: number;
    limit: number;
  }): Promise<{ follows: Follow[]; totalCount: number }>;

  /**
   * 指定ユーザーがフォローしているユーザー一覧を取得する（ページネーション付き、新しい順）。
   * @param params.followerId - フォローしている側のユーザーID
   * @param params.offset - 取得開始位置（0始まり）
   * @param params.limit - 取得件数上限
   * @returns フォロー関係一覧と総件数
   */
  findFollowees(params: {
    followerId: UserId;
    offset: number;
    limit: number;
  }): Promise<{ follows: Follow[]; totalCount: number }>;

  /**
   * フォロー関係を保存する（新規作成のみ）。
   * @param follow - 保存するフォロー関係
   * @throws DuplicateFollowError すでにフォロー関係が存在する場合
   */
  save(follow: Follow): Promise<void>;

  /**
   * フォロー関係を削除する（アンフォロー）。
   * @param followerId - フォローする側のユーザーID
   * @param followeeId - フォローされる側のユーザーID
   * @throws FollowNotFoundError フォロー関係が存在しない場合
   */
  delete(followerId: UserId, followeeId: UserId): Promise<void>;
}
```

---

## エラー型

```typescript
// プロフィールのエラー
type ProfileNotFoundError = { kind: "ProfileNotFound"; userId: UserId };
type CoverImageTooLargeError = { kind: "CoverImageTooLarge"; fileSizeBytes: number; maxSizeBytes: number };

// 投稿のエラー
type PostNotFoundError = { kind: "PostNotFound"; postId: PostId };
type EmptyPostContentError = { kind: "EmptyPostContent" };
type PostPermissionError = { kind: "PostPermissionDenied"; postId: PostId; userId: UserId };

// フォローのエラー
type SelfFollowError = { kind: "SelfFollow"; userId: UserId };
type DuplicateFollowError = { kind: "DuplicateFollow"; followerId: UserId; followeeId: UserId };
type FollowNotFoundError = { kind: "FollowNotFound"; followerId: UserId; followeeId: UserId };
```

---

## ユースケース（概要）

### プロフィール

| # | ユースケース名 | 概要 | 主要アクター |
|---|--------------|------|-------------|
| 1 | プロフィール取得 | 指定ユーザーのプロフィール情報（Identity の基本情報 + People の拡張情報）を取得する | 認証済みユーザー |
| 2 | カバー画像設定 | 自分のプロフィールにカバー画像を設定する。最大5MB | 認証済みユーザー（本人のみ） |
| 3 | カバー画像削除 | 自分のプロフィールからカバー画像を削除する | 認証済みユーザー（本人のみ） |
| 4 | コメント更新 | 自分のプロフィールのコメント欄を更新する | 認証済みユーザー（本人のみ） |

### 投稿

| # | ユースケース名 | 概要 | 主要アクター |
|---|--------------|------|-------------|
| 5 | ステータス投稿 | プロフィールページにリッチテキストのステータスメッセージを投稿する | 認証済みユーザー |
| 6 | 投稿削除 | 自分が投稿したステータスメッセージを削除する。投稿者本人のみ実行可能 | 認証済みユーザー（投稿者本人） |
| 7 | 投稿一覧取得 | 指定ユーザーの投稿一覧をページネーション付きで取得する | 認証済みユーザー |

### フォロー

| # | ユースケース名 | 概要 | 主要アクター |
|---|--------------|------|-------------|
| 8 | フォロー | 他ユーザーをフォローする。自分自身のフォローは不可 | 認証済みユーザー |
| 9 | アンフォロー | フォロー中のユーザーのフォローを解除する | 認証済みユーザー |
| 10 | フォロワー一覧取得 | 指定ユーザーのフォロワー一覧をページネーション付きで取得する | 認証済みユーザー |
| 11 | フォロー中一覧取得 | 指定ユーザーがフォローしているユーザー一覧をページネーション付きで取得する | 認証済みユーザー |

### プロフィール取得

1. 対象ユーザーの UserId を受け取る
2. Identity ドメインのポートからユーザー基本情報を取得する
3. ProfileRepository.findByUserId() でプロフィール拡張情報を取得する
4. 存在しない場合はデフォルト値で新規作成して保存する
5. 基本情報と拡張情報を統合してプロフィール表示データとして返す

### ステータス投稿

1. 操作者の UserId と投稿内容（リッチテキスト・メンション・添付ファイル）を受け取る
2. content が空でないことを検証する
3. Post エンティティを新規作成する
4. PostRepository.save() で永続化する
5. メンション先のユーザーに通知を送信する（Notification ドメインとユースケース層で連携）

### フォロー

1. 操作者の UserId（followerId）とフォロー対象の UserId（followeeId）を受け取る
2. followerId と followeeId が異なることを検証する（自己フォロー禁止）
3. FollowRepository.findByPair() で既存のフォロー関係がないことを確認する
4. Follow エンティティを新規作成する
5. FollowRepository.save() で永続化する
