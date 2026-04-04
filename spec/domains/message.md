# Message ドメイン設計

## 概要

Message ドメインは、ユーザー間の1対1ダイレクトメッセージを管理する Generic ドメインである。メッセージは必ず2人のユーザー間でやり取りされ、グループメッセージには対応しない（グループでのやり取りはスペーススレッドを使用する）。ゲストユーザーとのメッセージは不可。

独立した「メッセージ一覧画面」は存在せず、`/k/#/message` にアクセスすると最後に開いたメッセージスレッドが直接表示される。メッセージスレッドへのアクセスは、他ユーザーのピープルページ・全体検索結果・通知・直接 URL（`/k/#/message/{id1};{id2}`）から行う。

OpenDesk システム管理で「ピープル機能とメッセージ機能を利用する」が有効な場合のみ使用可能。機能を無効にしても既存データは保持される。

---

## ユビキタス言語

| 英語名 | 日本語名 | 定義 |
|--------|---------|------|
| MessageThread | メッセージスレッド | 2人のユーザー間のダイレクトメッセージの会話単位。参加者は必ず2名で固定 |
| DirectMessage | ダイレクトメッセージ | メッセージスレッド内の1件のメッセージ。リッチテキスト形式で添付ファイルを含む |
| Participant | 参加者 | メッセージスレッドに参加する2名のユーザー |
| Attachment | 添付ファイル | ダイレクトメッセージに添付されたファイル |

---

## 他ドメインとの関係

| 参照先ドメイン | 参照方法 | 用途 |
|--------------|---------|------|
| Identity | UserId（値オブジェクト） | メッセージスレッドの参加者・メッセージの送信者の識別 |
| File | FileKey（値オブジェクト） | メッセージの添付ファイルの参照 |

メッセージ送信時のゲストユーザー判定は、ユースケース層で Identity ドメインのポートを通じて行う。

---

## エンティティ

### MessageThread（メッセージスレッド）

2人のユーザー間のダイレクトメッセージの会話単位。同じ2人の組み合わせに対してスレッドは1つのみ存在する。URL は `/k/#/message/{id1};{id2}` の形式で、id1・id2 はユーザーID。

#### フィールド

| フィールド名 | 型 | 必須 | 説明 |
|-------------|-----|------|------|
| threadId | MessageThreadId | 必須 | メッセージスレッドの一意識別子 |
| participantIds | [UserId, UserId] | 必須 | 参加者2名のユーザーID。順序はソート済み（小さい方が先） |
| lastMessageAt | Date | 任意 | 最新メッセージの送信日時（メッセージがない場合は null） |
| createdAt | Date | 必須 | スレッド作成日時 |

#### ビヘイビア

```typescript
/**
 * 最新メッセージの日時を更新する。
 * 新しいメッセージが送信されたときに呼び出される。
 * @param messageAt - メッセージの送信日時
 * 事後条件: lastMessageAt が更新される
 */
updateLastMessageAt(messageAt: Date): void;

/**
 * 指定ユーザーがスレッドの参加者かどうかを判定する。
 * @param userId - 判定対象のユーザーID
 * @returns 参加者の場合 true
 */
isParticipant(userId: UserId): boolean;

/**
 * スレッドの相手ユーザーIDを取得する。
 * @param myUserId - 自分のユーザーID
 * @returns 相手のユーザーID
 * @throws NotParticipantError 自分がスレッドの参加者でない場合
 */
getCounterpartId(myUserId: UserId): UserId;
```

#### 不変条件

- `participantIds` は必ず2要素のタプル（1対1固定、グループメッセージ不可）
- `participantIds` の2つの要素は異なる UserId でなければならない（自分自身とのスレッド不可）
- `participantIds` は作成後に変更不可
- 同じ2人の UserId の組み合わせに対してスレッドは1つのみ存在する（リポジトリ層で保証）
- `participantIds` はソート済みで保持される（順序の正規化により一意性を保証）
- `participantIds` はコンストラクタでソートされることを保証する（ID の文字列比較で昇順）

#### ライフサイクル

1. **作成**: 2人のユーザー間で初めてメッセージをやり取りする際に自動作成される。または、ピープルページの「個人メッセージ」リンクから遷移した際にスレッドが存在しなければ作成される
2. **更新**: メッセージが送信されるたびに lastMessageAt が更新される
3. **削除**: メッセージスレッドの削除機能は提供しない

---

### DirectMessage（ダイレクトメッセージ）

メッセージスレッド内の1件のメッセージ。リッチテキスト形式で添付ファイルを含むことができる。作成後の編集は不可。仕様上、削除機能についての明示的な記述はないため、送信後のメッセージは変更・削除不可のイミュータブルなエンティティとして扱う。

#### フィールド

| フィールド名 | 型 | 必須 | 説明 |
|-------------|-----|------|------|
| messageId | DirectMessageId | 必須 | メッセージの一意識別子 |
| threadId | MessageThreadId | 必須 | 所属するメッセージスレッドのID |
| senderId | UserId | 必須 | 送信者のユーザーID |
| content | RichTextHtml | 必須 | メッセージ本文（リッチテキスト HTML 形式。アプリ埋め込みは不可） |
| attachmentFileKeys | FileKey[] | 必須 | 添付ファイルのキー一覧（空配列可） |
| createdAt | Date | 必須 | 送信日時 |

#### ビヘイビア

```typescript
/**
 * 指定ユーザーがメッセージの送信者かどうかを判定する。
 * @param userId - 判定対象のユーザーID
 * @returns 送信者本人の場合 true
 */
isSentBy(userId: UserId): boolean;
```

#### 不変条件

- `content` は空であってはならない（空文字のメッセージは送信不可）
- `senderId` はメッセージが属するスレッドの参加者のいずれかでなければならない
- 全フィールドは作成後に変更不可（編集機能なし）
- アプリ埋め込み（アプリ貼り付け）は content に含めることができない（お知らせ掲示板・スペースとの差異）
- content には RichTextHtml を使用するが、アプリ埋め込み要素（iframe、opendesk-app タグ等）は含めることができない。バリデーションはユースケース層で実施

#### ライフサイクル

1. **作成**: ユーザーがメッセージ入力フォームから「送信」を実行する
2. **表示**: メッセージスレッド内に時系列で表示される
3. **不変**: 送信後のメッセージは編集・削除不可

---

## 値オブジェクト

### MessageThreadId

メッセージスレッドの一意識別子。

```typescript
type MessageThreadId = {
  readonly value: string; // UUID v4 形式
};

// 等価性: value が一致すれば等しい
// バリデーション: 空文字でないこと、有効な UUID 形式であること
```

### DirectMessageId

ダイレクトメッセージの一意識別子。

```typescript
type DirectMessageId = {
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
//   - 空文字を許容するかはコンテキストによる（メッセージ本文では空文字不可）
// 許可されるHTML要素:
//   - テキスト書式: b, i, u, span（style属性: color, background-color, font-size）
//   - 構造: p, br, ul, ol, li, div
//   - リンク: a（href, target属性）
//   - 画像: img（src, alt, width, height属性）
//   - アプリ埋め込み: 不可（お知らせ掲示板・スペースとは異なる）
```

---

## ドメインサービス

### MessageThreadService

メッセージスレッドの取得・作成に関するビジネスロジックを提供する。2人のユーザーIDの組み合わせからスレッドを特定し、存在しない場合は新規作成する「get or create」パターンを実装する。

#### 依存ポート

- MessageThreadRepository

#### メソッド

```typescript
/**
 * 2人のユーザー間のメッセージスレッドを取得する。
 * 存在しない場合は新規作成して返す（get or create パターン）。
 * @param participantId1 - 参加者1のユーザーID
 * @param participantId2 - 参加者2のユーザーID
 * @returns メッセージスレッド
 * @throws SameParticipantError 2つのユーザーIDが同一の場合
 *
 * 処理:
 *   1. participantId1 と participantId2 が異なることを検証する
 *   2. ユーザーIDをソートして正規化する
 *   3. MessageThreadRepository.findByParticipantIds() でスレッドを検索する
 *   4. 存在する場合はそのスレッドを返す
 *   5. 存在しない場合は新規 MessageThread を作成し、save() して返す
 */
getOrCreateThread(
  participantId1: UserId,
  participantId2: UserId,
): Promise<MessageThread>;
```

---

## ポート

### MessageThreadRepository

メッセージスレッドの永続化を担うリポジトリインターフェース。

```typescript
interface MessageThreadRepository {
  /**
   * IDでメッセージスレッドを取得する。
   * @param threadId - メッセージスレッドの識別子
   * @returns メッセージスレッド。存在しない場合は null
   */
  findById(threadId: MessageThreadId): Promise<MessageThread | null>;

  /**
   * 参加者2名のユーザーIDの組み合わせでメッセージスレッドを取得する。
   * ユーザーIDの順序は内部でソートされるため、引数の順序は問わない。
   * @param participantId1 - 参加者1のユーザーID
   * @param participantId2 - 参加者2のユーザーID
   * @returns メッセージスレッド。存在しない場合は null
   */
  findByParticipantIds(
    participantId1: UserId,
    participantId2: UserId,
  ): Promise<MessageThread | null>;

  /**
   * 指定ユーザーが参加しているメッセージスレッド一覧を取得する（最終メッセージ日時の新しい順）。
   * @param params.userId - 参加者のユーザーID
   * @param params.offset - 取得開始位置（0始まり）
   * @param params.limit - 取得件数上限
   * @returns メッセージスレッド一覧と総件数
   */
  findByParticipantUserId(params: {
    userId: UserId;
    offset: number;
    limit: number;
  }): Promise<{ threads: MessageThread[]; totalCount: number }>;

  /**
   * メッセージスレッドを保存する（新規作成または更新）。
   * @param thread - 保存するメッセージスレッド
   * @throws DuplicateThreadError 同じ参加者の組み合わせのスレッドが既に存在する場合
   */
  save(thread: MessageThread): Promise<void>;
}
```

### DirectMessageRepository

ダイレクトメッセージの永続化を担うリポジトリインターフェース。

```typescript
interface DirectMessageRepository {
  /**
   * IDでダイレクトメッセージを取得する。
   * @param messageId - メッセージの識別子
   * @returns ダイレクトメッセージ。存在しない場合は null
   */
  findById(messageId: DirectMessageId): Promise<DirectMessage | null>;

  /**
   * 指定スレッドのメッセージ一覧を取得する（ページネーション付き、新しい順）。
   * @param params.threadId - メッセージスレッドの識別子
   * @param params.offset - 取得開始位置（0始まり）
   * @param params.limit - 取得件数上限
   * @returns メッセージ一覧と総件数
   */
  findByThreadId(params: {
    threadId: MessageThreadId;
    offset: number;
    limit: number;
  }): Promise<{ messages: DirectMessage[]; totalCount: number }>;

  /**
   * ダイレクトメッセージを保存する（新規作成のみ。メッセージは編集不可）。
   * @param message - 保存するダイレクトメッセージ
   */
  save(message: DirectMessage): Promise<void>;

  /**
   * 指定スレッド内のキーワードでメッセージを検索する（全文検索用）。
   * @param params.threadId - メッセージスレッドの識別子（省略時は全スレッド対象）
   * @param params.keyword - 検索キーワード
   * @param params.senderId - 送信者でフィルタ（任意）
   * @param params.dateFrom - 作成日の開始日（任意）
   * @param params.dateTo - 作成日の終了日（任意）
   * @param params.offset - 取得開始位置（0始まり）
   * @param params.limit - 取得件数上限
   * @returns メッセージ一覧と総件数
   */
  search(params: {
    threadId?: MessageThreadId;
    keyword: string;
    senderId?: UserId;
    dateFrom?: Date;
    dateTo?: Date;
    offset: number;
    limit: number;
  }): Promise<{ messages: DirectMessage[]; totalCount: number }>;
}
```

---

## エラー型

```typescript
// メッセージスレッドのエラー
type ThreadNotFoundError = { kind: "ThreadNotFound"; threadId: MessageThreadId };
type SameParticipantError = { kind: "SameParticipant"; userId: UserId };
type NotParticipantError = { kind: "NotParticipant"; threadId: MessageThreadId; userId: UserId };
type DuplicateThreadError = { kind: "DuplicateThread"; participantIds: [UserId, UserId] };
type GuestUserMessageError = { kind: "GuestUserMessageNotAllowed"; guestUserId: UserId };

// ダイレクトメッセージのエラー
type MessageNotFoundError = { kind: "MessageNotFound"; messageId: DirectMessageId };
type EmptyMessageContentError = { kind: "EmptyMessageContent" };
type SenderNotParticipantError = { kind: "SenderNotParticipant"; threadId: MessageThreadId; senderId: UserId };

// 機能無効エラー
type MessageFeatureDisabledError = { kind: "MessageFeatureDisabled" };
```

---

## ユースケース（概要）

### メッセージスレッド

| # | ユースケース名 | 概要 | 主要アクター |
|---|--------------|------|-------------|
| 1 | メッセージスレッド取得/作成 | 2人のユーザー間のメッセージスレッドを取得する。存在しない場合は新規作成する | 認証済みユーザー |
| 2 | メッセージスレッド一覧取得 | 自分が参加しているメッセージスレッド一覧を取得する | 認証済みユーザー |

### メッセージ

| # | ユースケース名 | 概要 | 主要アクター |
|---|--------------|------|-------------|
| 3 | メッセージ送信 | メッセージスレッドにリッチテキストのダイレクトメッセージを送信する | 認証済みユーザー（スレッド参加者） |
| 4 | メッセージ履歴取得 | メッセージスレッド内のメッセージ一覧をページネーション付きで取得する | 認証済みユーザー（スレッド参加者） |

### メッセージスレッド取得/作成

1. 操作者の UserId と相手の UserId を受け取る
2. ピープル機能とメッセージ機能が有効であることを検証する
3. Identity ドメインのポートで相手ユーザーがゲストユーザーでないことを検証する
4. ゲストユーザーの場合は GuestUserMessageError を返す
5. MessageThreadService.getOrCreateThread() でスレッドを取得または作成する
6. メッセージスレッドを返す

### メッセージ送信

1. 操作者の UserId、スレッドID、メッセージ内容（リッチテキスト・添付ファイル）を受け取る
2. ピープル機能とメッセージ機能が有効であることを検証する
3. MessageThreadRepository.findById() でスレッドを取得する
4. スレッドが存在しない場合は ThreadNotFoundError を返す
5. 操作者がスレッドの参加者であることを検証する
6. content が空でないことを検証する
7. DirectMessage エンティティを新規作成する
8. DirectMessageRepository.save() で永続化する
9. MessageThread.updateLastMessageAt() でスレッドの最終メッセージ日時を更新する
10. MessageThreadRepository.save() でスレッドを永続化する
11. 相手ユーザーに通知を送信する（Notification ドメインとユースケース層で連携）

### メッセージ履歴取得

1. 操作者の UserId、スレッドID、ページネーションパラメータを受け取る
2. MessageThreadRepository.findById() でスレッドを取得する
3. スレッドが存在しない場合は ThreadNotFoundError を返す
4. 操作者がスレッドの参加者であることを検証する
5. DirectMessageRepository.findByThreadId() でメッセージ一覧を取得する
6. メッセージ一覧と総件数を返す
