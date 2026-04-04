# File ドメイン設計

## 概要

File ドメインは、OpenDesk プラットフォームにおけるファイルのアップロード・ダウンロード・保持期限管理を担う Generic ドメインである。レコードの添付ファイル、スレッドの添付ファイル、プロフィール画像など、システム全体のファイル管理基盤として機能する。

**ドメイン種別**: Generic

**責務境界**:
- ファイルの一時保管領域へのアップロードとファイルキーの発行を管理する
- ファイルキーに基づくファイルのダウンロード（バイナリデータ取得）を提供する
- 未使用ファイル（一時保管領域に残存し、レコード等に紐付けられていないファイル）の期限切れ削除を担う
- ファイルのアクセス権制御は AccessControl ドメインに委譲する

---

## ユビキタス言語

| 英語名 | 日本語名 | 定義 |
|--------|---------|------|
| StoredFile | 保管ファイル | アップロードされたファイルのメタデータ。ファイルキー・ファイル名・MIMEタイプ・サイズ・アップローダー情報を持つ |
| FileKey | ファイルキー | ファイルを一意に識別するキー文字列。アップロード直後は UUID 形式、レコード等に紐付け後は英数字形式に変換される |
| TemporaryFile | 一時ファイル | アップロード後まだレコード等に紐付けられていないファイル。3日間で自動削除される |
| AttachedFile | 添付済みファイル | レコード・スレッド等に紐付けられたファイル。紐付け元が存在する限り保持される |
| Upload | アップロード | ファイルを一時保管領域に保存する操作。マルチパートフォームデータで1件ずつ送信する |
| Download | ダウンロード | ファイルキーを指定してファイルのバイナリデータを取得する操作 |
| ContentType | コンテンツタイプ | ファイルの MIME タイプ（例: `application/pdf`, `image/png`） |
| Attachment | 紐付け | 一時ファイルをレコード・スレッド等のエンティティに関連付ける操作。ファイルキーが UUID 形式から英数字形式に変換される |
| Expiration | 有効期限 | 一時ファイルの自動削除期限。アップロードから3日間 |

---

## 他ドメインとの関係

| 参照先ドメイン | 参照方法 | 用途 |
|--------------|---------|------|
| Identity | UserId（値オブジェクト） | アップロード者の識別 |

他のドメインから File ドメインへの参照:
- Record ドメイン: FileKey で添付ファイルフィールドのファイルを参照
- Identity ドメイン: FileKey でアバター画像を参照
- Space ドメイン: FileKey でスレッド添付ファイルを参照

---

## エンティティ

### StoredFile（保管ファイル）

アップロードされたファイルのメタデータを管理するエンティティ。ファイルの実体（バイナリデータ）は FileStorageProvider を通じて外部ストレージに保管される。

#### フィールド

| フィールド名 | 型 | 必須 | 説明 |
|-------------|-----|------|------|
| fileKey | FileKey | 必須 | ファイルの一意識別子。アップロード直後は UUID 形式、紐付け後は英数字形式 |
| fileName | string | 必須 | アップロード時のファイル名（日本語ファイル名は UTF-8） |
| contentType | string | 必須 | ファイルの MIME タイプ（例: `application/pdf`） |
| size | number | 必須 | ファイルサイズ（バイト単位） |
| uploaderId | UserId | 必須 | アップロードしたユーザーの ID |
| status | FileStatus | 必須 | ファイルの状態（TEMPORARY / ATTACHED） |
| uploadedAt | Date | 必須 | アップロード日時 |
| expiresAt | Date | 任意 | 自動削除期限。TEMPORARY 状態の場合のみ設定される（アップロードから3日後） |

#### ビヘイビア

```typescript
/**
 * ファイルをレコード等に紐付ける。
 * ステータスを ATTACHED に変更し、有効期限を解除する。
 * ファイルキーは UUID 形式から英数字形式に変換される。
 * @param newFileKey 紐付け後の新しいファイルキー（英数字形式）
 * @throws AlreadyAttachedError すでに ATTACHED 状態の場合
 */
attach(newFileKey: FileKey): void
// 前提条件: status === TEMPORARY
// 事後条件: status が ATTACHED に変更、fileKey が newFileKey に更新、expiresAt が null に設定される

/**
 * ファイルの有効期限が切れているかを判定する。
 * ATTACHED 状態のファイルは期限切れにならない。
 * @returns TEMPORARY かつ現在時刻が expiresAt を超過している場合 true
 */
isExpired(now: Date): boolean

/**
 * ファイルが一時保管状態かどうかを判定する。
 */
isTemporary(): boolean

/**
 * ファイルが紐付け済み状態かどうかを判定する。
 */
isAttached(): boolean
```

#### 不変条件

- `fileName` は空文字であってはならない
- `contentType` は空文字であってはならない
- `size` は 0 より大きくなければならない
- `status` が `TEMPORARY` の場合、`expiresAt` は必須（非 null）
- `status` が `ATTACHED` の場合、`expiresAt` は null
- `fileKey` は空文字であってはならない
- `uploadedAt <= expiresAt`（expiresAt が設定されている場合）

#### ライフサイクル

1. **アップロード**: ファイルが一時保管領域にアップロードされる。`status = TEMPORARY`、`expiresAt = uploadedAt + 3日` で作成。ファイルキーは UUID 形式
2. **紐付け**: レコード登録・更新等でファイルがエンティティに関連付けられる。`status = ATTACHED` に遷移し、ファイルキーが英数字形式に変換される。`expiresAt` は解除される
3. **ダウンロード**: ファイルキーを指定してバイナリデータを取得する。ステータスは変化しない
4. **期限切れ削除**: TEMPORARY 状態のまま3日間経過したファイルはバッチ処理で削除される
5. **紐付け元削除に伴う削除**: レコード削除等で参照元がなくなったファイルは削除される

---

## 値オブジェクト

### FileKey

ファイルの一意識別子。2つの形式が存在する。

```typescript
type FileKey = {
  readonly value: string;
};

// 等価性: value が一致すれば等しい
// バリデーション: 空文字でないこと
// 形式:
//   - UUID 形式: アップロード直後の一時ファイル用（例: "c15b3870-7505-4ab6-9d8d-b9bdbc74f5d6"）
//   - 英数字形式: 紐付け済みファイル用（例: "201202061155587E339F9067544F1A92C743460E3D12B3297"）
// 備考:
//   FileKey には2つの形式がある: (1) UUID形式 — アップロード直後の一時ファイルに付与される
//   (2) 英数字形式 — レコードやスレッドに添付された永続ファイルに付与される。
//   型としては同一の FileKey を使用し、StoredFile.status で区別する
```

### FileStatus

ファイルの状態を表す列挙型。

```typescript
type FileStatus =
  | "TEMPORARY"   // 一時保管中（未紐付け、有効期限あり）
  | "ATTACHED";   // 紐付け済み（有効期限なし）
```

### FileMetadata

ファイルダウンロード時に返されるメタデータ。

```typescript
type FileMetadata = {
  readonly fileName: string;      // ファイル名
  readonly contentType: string;   // MIME タイプ
  readonly size: number;          // ファイルサイズ（バイト）
};
```

---

## ポート

### FileRepository

ファイルメタデータの永続化を担うリポジトリインターフェース。

```typescript
interface FileRepository {
  /**
   * ファイルキーでファイルメタデータを取得する。
   * @param fileKey ファイルの一意識別子
   * @returns ファイルメタデータ。存在しない場合は null
   */
  findByKey(fileKey: FileKey): Promise<StoredFile | null>;

  /**
   * 指定アップローダーのファイル一覧を取得する。
   * @param uploaderId アップロードしたユーザーの ID
   * @param status ステータスで絞り込み（省略時は全ステータス）
   * @returns ファイルメタデータの配列
   */
  findByUploaderId(
    uploaderId: UserId,
    status?: FileStatus
  ): Promise<StoredFile[]>;

  /**
   * ファイルメタデータを保存する（新規作成・更新の両方に対応）。
   * @param file 保存対象のファイルメタデータ
   */
  save(file: StoredFile): Promise<void>;

  /**
   * ファイルメタデータを削除する。
   * @param fileKey 削除対象のファイルキー
   * @throws FileNotFoundError ファイルが存在しない場合
   */
  delete(fileKey: FileKey): Promise<void>;

  /**
   * 有効期限切れの一時ファイルを一括取得する。
   * バッチ削除処理の対象特定に使用する。
   * @param now 現在時刻
   * @returns 期限切れファイルメタデータの配列
   */
  findExpired(now: Date): Promise<StoredFile[]>;

  /**
   * 有効期限切れの一時ファイルメタデータを一括削除する。
   * @param now 現在時刻
   * @returns 削除されたファイル数
   */
  deleteExpired(now: Date): Promise<number>;
}
```

### FileStorageProvider

ファイルの実体（バイナリデータ）の保管を担う外部ストレージとのインターフェース。

```typescript
interface FileStorageProvider {
  /**
   * ファイルをストレージにアップロードする。
   * @param fileKey ファイルの一意識別子
   * @param data ファイルのバイナリデータ（ストリーム）
   * @param metadata ファイルのメタデータ（ファイル名・MIME タイプ・サイズ）
   * @throws StorageUploadError ストレージへのアップロードに失敗した場合
   * @throws FileSizeLimitExceededError ファイルサイズが上限（1GB）を超える場合
   */
  upload(
    fileKey: FileKey,
    data: ReadableStream,
    metadata: FileMetadata
  ): Promise<void>;

  /**
   * ファイルをストレージからダウンロードする。
   * @param fileKey ファイルの一意識別子
   * @returns ファイルのバイナリデータ（ストリーム）とメタデータ
   * @throws FileNotFoundInStorageError ストレージにファイルが存在しない場合
   */
  download(fileKey: FileKey): Promise<{
    data: ReadableStream;
    metadata: FileMetadata;
  }>;

  /**
   * ファイルをストレージから削除する。
   * @param fileKey 削除対象のファイルキー
   * @throws FileNotFoundInStorageError ストレージにファイルが存在しない場合
   */
  delete(fileKey: FileKey): Promise<void>;

  /**
   * 複数のファイルをストレージから一括削除する。
   * バッチ処理での期限切れファイル削除に使用する。
   * @param fileKeys 削除対象のファイルキーの配列
   * @returns 削除に成功したファイル数
   */
  deleteBatch(fileKeys: FileKey[]): Promise<number>;
}
```

---

## エラー型

```typescript
// ファイル操作エラー
type FileNotFoundError = { kind: "FileNotFound"; fileKey: FileKey };
type AlreadyAttachedError = { kind: "AlreadyAttached"; fileKey: FileKey };
type FileSizeLimitExceededError = { kind: "FileSizeLimitExceeded"; size: number; maxSize: number };
type StorageUploadError = { kind: "StorageUploadError"; reason: string };
type FileNotFoundInStorageError = { kind: "FileNotFoundInStorage"; fileKey: FileKey };
type InvalidFileKeyFormatError = { kind: "InvalidFileKeyFormat"; fileKey: string };
type EmptyFileError = { kind: "EmptyFile" };
```

---

## ユースケース（概要）

### ファイル操作

| # | ユースケース名 | 概要 | 主要アクター |
|---|--------------|------|-------------|
| 1 | ファイルアップロード | ファイルを一時保管領域にアップロードし、UUID 形式のファイルキーを返す。マルチパートフォームデータで1ファイルずつ送信する | 認証済みユーザー |
| 2 | ファイルダウンロード | ファイルキーを指定してファイルのバイナリデータを取得する。レスポンスの Content-Type にはファイルの MIME タイプが設定される | 認証済みユーザー |
| 3 | 未使用ファイル削除 | アップロードから3日間経過しても紐付けられていない一時ファイルを一括削除する。バッチ処理として定期実行される | システム（バッチ） |
