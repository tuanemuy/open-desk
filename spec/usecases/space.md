# Space ユースケース定義

## 1. スペース作成（白紙）

### 概要

新しいスペースを白紙から作成する。デフォルトスレッドと初期メンバーが自動生成される。スペース作成権限が必要。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| name | string | 必須 | 1文字以上128文字以下 |
| isPrivate | boolean | 必須 | - |
| useMultiThread | boolean | 必須 | - |
| fixedMember | boolean | 必須 | - |
| appCreationPermission | AppCreationPermission | 必須 | "EVERYONE" または "ADMIN" |
| coverImage | CoverImage | 必須 | PRESET の場合は有効なプリセットキー、BLOB の場合はファイルキーが必須 |
| members | Array<{ entity: MemberEntity; isAdmin: boolean; includeSubs: boolean }> | 必須 | 1件以上。管理者（isAdmin=true）が1名以上含まれること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| spaceId | SpaceId |
| name | string |
| isPrivate | boolean |
| useMultiThread | boolean |
| fixedMember | boolean |
| appCreationPermission | AppCreationPermission |
| coverImage | CoverImage |
| defaultThreadId | ThreadId |
| createdAt | Date |

### 処理フロー

1. Identity ドメインのポートから operatorId のユーザーコンテキストを取得する
2. AccessControl ドメインのポートで operatorId のシステム権限を評価し、`spaceCreate` 権限があることを検証する
3. 権限がない場合は SpacePermissionDeniedError を返す
4. `SpaceCreationService.createSpace({ name, isPrivate, isGuest: false, useMultiThread, fixedMember, appCreationPermission, coverImage, members, creatorId: operatorId })` を呼び出す
5. ドメインサービス内でスペース数上限チェック（通常スペース: 500）・管理者存在検証・Space/Thread/SpaceMember の生成と永続化が実行される
6. 作成されたスペース情報を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 操作者にスペース作成権限がない | SpacePermissionDeniedError |
| スペース名が空文字または128文字超過 | EmptySpaceNameError / SpaceNameTooLongError |
| 通常スペース数が上限（500）超過 | SpaceLimitExceededError |
| 管理者が1名も指定されていない | NoAdminMemberError |

---

## 2. スペース作成（テンプレート）

### 概要

テンプレートからスペースを作成する。テンプレートの設定を基にスペース・スレッド・お知らせ・関連リンクが生成される。スペース作成権限が必要。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| templateId | SpaceTemplateId | 必須 | 有効な SpaceTemplateId 形式であること |
| name | string | 必須 | 1文字以上128文字以下 |
| isPrivate | boolean | 必須 | - |
| fixedMember | boolean | 必須 | - |
| members | Array<{ entity: MemberEntity; isAdmin: boolean; includeSubs: boolean }> | 必須 | 1件以上。管理者が1名以上含まれること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| spaceId | SpaceId |
| name | string |
| isPrivate | boolean |
| useMultiThread | boolean |
| fixedMember | boolean |
| appCreationPermission | AppCreationPermission |
| coverImage | CoverImage |
| defaultThreadId | ThreadId |
| threads | Array<{ threadId: ThreadId; title: string }> |
| createdAt | Date |

### 処理フロー

1. Identity ドメインのポートから operatorId のユーザーコンテキストを取得する
2. AccessControl ドメインのポートで operatorId のシステム権限を評価し、`spaceCreate` 権限があることを検証する
3. 権限がない場合は SpacePermissionDeniedError を返す
4. `SpaceCreationService.createSpaceFromTemplate({ templateId, name, isPrivate, isGuest: false, fixedMember, members, creatorId: operatorId })` を呼び出す
5. ドメインサービス内でテンプレート取得・スペース数上限チェック・Space/Thread/SpaceMember の生成と永続化が実行される
6. 作成されたスペース情報を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 操作者にスペース作成権限がない | SpacePermissionDeniedError |
| テンプレートが存在しない | SpaceTemplateNotFoundError |
| スペース名が空文字または128文字超過 | EmptySpaceNameError / SpaceNameTooLongError |
| 通常スペース数が上限（500）超過 | SpaceLimitExceededError |
| 管理者が1名も指定されていない | NoAdminMemberError |

---

## 3. ゲストスペース作成

### 概要

ゲストスペースを作成する。isPrivate は常に true に強制される。ゲストスペース作成権限が必要。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| name | string | 必須 | 1文字以上128文字以下 |
| useMultiThread | boolean | 必須 | - |
| fixedMember | boolean | 必須 | - |
| appCreationPermission | AppCreationPermission | 必須 | "EVERYONE" または "ADMIN" |
| coverImage | CoverImage | 必須 | PRESET の場合は有効なプリセットキー、BLOB の場合はファイルキーが必須 |
| members | Array<{ entity: MemberEntity; isAdmin: boolean; includeSubs: boolean }> | 必須 | 1件以上。管理者が1名以上含まれること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| spaceId | SpaceId |
| name | string |
| isPrivate | boolean |
| isGuest | boolean |
| useMultiThread | boolean |
| fixedMember | boolean |
| appCreationPermission | AppCreationPermission |
| coverImage | CoverImage |
| defaultThreadId | ThreadId |
| createdAt | Date |

### 処理フロー

1. Identity ドメインのポートから operatorId のユーザーコンテキストを取得する
2. AccessControl ドメインのポートで operatorId のシステム権限を評価し、`guestSpaceCreate` 権限があることを検証する
3. 権限がない場合は SpacePermissionDeniedError を返す
4. `SpaceCreationService.createSpace({ name, isPrivate: true, isGuest: true, useMultiThread, fixedMember, appCreationPermission, coverImage, members, creatorId: operatorId })` を呼び出す
5. ドメインサービス内でゲストスペース機能有効チェック・スペース数上限チェック（ゲスト: 500）・isPrivate の true 強制・管理者存在検証・Space/Thread/SpaceMember の生成と永続化が実行される
6. 作成されたゲストスペース情報を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 操作者にゲストスペース作成権限がない | SpacePermissionDeniedError |
| ゲストスペース機能が無効 | GuestSpaceFeatureDisabledError |
| スペース名が空文字または128文字超過 | EmptySpaceNameError / SpaceNameTooLongError |
| ゲストスペース数が上限（500）超過 | SpaceLimitExceededError |
| 管理者が1名も指定されていない | NoAdminMemberError |

---

## 4. スペース設定変更

### 概要

スペース名・公開設定・マルチスレッド・カバー画像・ポータル表示設定・アプリ作成権限・固定メンバー設定を変更する。スペース管理者のみ実行可能。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| spaceId | SpaceId | 必須 | 有効な SpaceId 形式であること |
| name | string | 任意 | 指定時は1文字以上128文字以下 |
| isPrivate | boolean | 任意 | ゲストスペースの場合は変更不可 |
| useMultiThread | boolean | 任意 | true のみ指定可能（false への変更は不可） |
| fixedMember | boolean | 任意 | - |
| coverImage | CoverImage | 任意 | PRESET の場合は有効なプリセットキー、BLOB の場合はファイルキーが必須 |
| portalDisplay | PortalDisplayConfig | 任意 | - |
| appCreationPermission | AppCreationPermission | 任意 | "EVERYONE" または "ADMIN" |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| spaceId | SpaceId |
| name | string |
| isPrivate | boolean |
| isGuest | boolean |
| useMultiThread | boolean |
| fixedMember | boolean |
| appCreationPermission | AppCreationPermission |
| coverImage | CoverImage |
| portalDisplay | PortalDisplayConfig |
| updatedAt | Date |

### 処理フロー

1. `SpaceRepository.findById(spaceId)` でスペースを取得する
2. スペースが存在しない場合は SpaceNotFoundError を返す
3. `SpaceMemberRepository.findBySpaceIdAndUserId(spaceId, operatorId)` で操作者のメンバー情報を取得する
4. 操作者がスペース管理者（isAdmin=true）でない場合は SpaceAdminRequiredError を返す
5. 指定されたフィールドに対して各エンティティメソッドを呼び出す:
   - name が指定: `space.rename(SpaceName(name))`
   - isPrivate が指定: `space.setPrivate(isPrivate)`（ゲストスペースの場合はエラー）
   - useMultiThread が true: `space.enableMultiThread()`
   - fixedMember が指定: `space.setFixedMember(fixedMember)`
   - coverImage が指定: `space.setCoverImage(coverImage)`
   - portalDisplay が指定: `space.setPortalDisplay(portalDisplay)`
   - appCreationPermission が指定: `space.setAppCreationPermission(appCreationPermission)`
6. `SpaceRepository.save(space)` で永続化する
7. 更新後のスペース情報を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| スペースが存在しない | SpaceNotFoundError |
| 操作者がスペース管理者でない | SpaceAdminRequiredError |
| スペース名が空文字 | EmptySpaceNameError（ドメインモデルから発生） |
| スペース名が128文字超過 | SpaceNameTooLongError（ドメインモデルから発生） |
| ゲストスペースの公開設定変更 | GuestSpacePrivacyError（ドメインモデルから発生） |
| マルチスレッドが既に有効なのに再度有効化 | MultiThreadIrreversibleError（ドメインモデルから発生） |
| カバー画像が不正 | InvalidCoverImageError |

---

## 5. スペース削除

### 概要

スペースと関連データ（スレッド・コメント・メンバー・お知らせ・関連リンク・フォロー・いいね）を削除する。スペース管理者のみ実行可能。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| spaceId | SpaceId | 必須 | 有効な SpaceId 形式であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| (なし) | void |

### 処理フロー

1. `SpaceRepository.findById(spaceId)` でスペースを取得する
2. スペースが存在しない場合は SpaceNotFoundError を返す
3. `SpaceMemberRepository.findBySpaceIdAndUserId(spaceId, operatorId)` で操作者のメンバー情報を取得する
4. 操作者がスペース管理者（isAdmin=true）でない場合は SpaceAdminRequiredError を返す
5. `ThreadRepository.findBySpaceId(spaceId)` でスペース内の全スレッドを取得する
6. 各スレッドに対して `ThreadCommentRepository.deleteByThreadId(threadId)` で関連コメントを削除する
7. 各スレッドに対して `ThreadFollowRepository.deleteByThreadId(threadId)` で関連フォローを削除する
8. `ThreadRepository` で各スレッドを削除する
9. `SpaceAnnouncementRepository.deleteBySpaceId(spaceId)` でお知らせを削除する
10. `RelatedLinkRepository.deleteBySpaceId(spaceId)` で関連リンクを削除する
11. `SpaceMemberRepository.deleteBySpaceId(spaceId)` で全メンバーを削除する
12. `SpaceRepository.delete(spaceId)` でスペースを削除する

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| スペースが存在しない | SpaceNotFoundError |
| 操作者がスペース管理者でない | SpaceAdminRequiredError |

---

## 6. スペース情報取得

### 概要

スペースの詳細情報を取得する。非公開スペースはメンバーのみ閲覧可能。公開スペースは認証済みユーザーなら閲覧可能。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| spaceId | SpaceId | 必須 | 有効な SpaceId 形式であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| spaceId | SpaceId |
| name | string |
| isPrivate | boolean |
| isGuest | boolean |
| useMultiThread | boolean |
| fixedMember | boolean |
| appCreationPermission | AppCreationPermission |
| coverImage | CoverImage |
| portalDisplay | PortalDisplayConfig |
| defaultThreadId | ThreadId |
| creatorId | UserId |
| createdAt | Date |
| updatedAt | Date |

### 処理フロー

1. `SpaceRepository.findById(spaceId)` でスペースを取得する
2. スペースが存在しない場合は SpaceNotFoundError を返す
3. スペースが非公開（isPrivate=true）の場合、`SpaceMemberRepository.findBySpaceIdAndUserId(spaceId, operatorId)` でメンバーシップを確認する
4. 非公開スペースで操作者がメンバーでない場合は SpaceAccessDeniedError を返す
5. スペース情報を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| スペースが存在しない | SpaceNotFoundError |
| 非公開スペースで操作者がメンバーでない | SpaceAccessDeniedError |

---

## 7. スペース使用状況一覧取得

### 概要

全スペースの統計情報（メンバー数・管理者数等）を一覧で取得する。システム管理者のみ実行可能。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| offset | number | 任意 | 0以上の整数。デフォルト: 0 |
| limit | number | 任意 | 1以上100以下。デフォルト: 100 |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| spaces | Array<{ spaceId: SpaceId; name: string; isGuest: boolean; memberCount: number; adminCount: number; createdAt: Date }> |
| totalCount | number |

### 処理フロー

1. Identity ドメインのポートから operatorId のユーザーコンテキストを取得する
2. AccessControl ドメインのポートで操作者のシステム権限を評価し、`systemAdmin` 権限があること、または `userContext.isCybozuAdmin` が true であることを検証する
3. 権限がない場合は SystemPermissionDeniedError を返す
4. `SpaceRepository.list({}, offset, limit)` でスペース一覧を取得する
5. 各スペースに対して `SpaceMemberRepository.findBySpaceId(spaceId)` でメンバー数と管理者数を集計する
6. スペース使用状況一覧と総数を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 操作者にシステム管理権限がない | SystemPermissionDeniedError |

---

## 8. メンバー一覧取得

### 概要

スペースのメンバー一覧を取得する。公開スペースは認証済みユーザー、非公開スペースはメンバーのみ取得可能。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| spaceId | SpaceId | 必須 | 有効な SpaceId 形式であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| members | Array<{ entity: MemberEntity; isAdmin: boolean; includeSubs: boolean }> |

### 処理フロー

1. `SpaceRepository.findById(spaceId)` でスペースを取得する
2. スペースが存在しない場合は SpaceNotFoundError を返す
3. スペースが非公開（isPrivate=true）の場合、`SpaceMemberRepository.findBySpaceIdAndUserId(spaceId, operatorId)` でメンバーシップを確認する
4. 非公開スペースで操作者がメンバーでない場合は SpaceAccessDeniedError を返す
5. `SpaceMemberRepository.findBySpaceId(spaceId)` で全メンバーを取得する
6. メンバー一覧を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| スペースが存在しない | SpaceNotFoundError |
| 非公開スペースで操作者がメンバーでない | SpaceAccessDeniedError |

---

## 9. メンバー一括更新

### 概要

スペースのメンバー構成を指定リストで置き換える。管理者1名以上が必須。スペース管理者のみ実行可能。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| spaceId | SpaceId | 必須 | 有効な SpaceId 形式であること |
| members | Array<{ entity: MemberEntity; isAdmin: boolean; includeSubs: boolean }> | 必須 | 1件以上。管理者が1名以上含まれること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| members | Array<{ entity: MemberEntity; isAdmin: boolean; includeSubs: boolean }> |

### 処理フロー

1. `SpaceRepository.findById(spaceId)` でスペースを取得する
2. スペースが存在しない場合は SpaceNotFoundError を返す
3. `SpaceMemberRepository.findBySpaceIdAndUserId(spaceId, operatorId)` で操作者のメンバー情報を取得する
4. 操作者がスペース管理者（isAdmin=true）でない場合は SpaceAdminRequiredError を返す
5. Identity ドメインのポートで、members 内の各ユーザーが有効（使用停止中・削除済みでない）であることを検証する
6. `SpaceMembershipService.replaceMembers({ spaceId, members })` を呼び出す
7. ドメインサービス内で管理者1名以上検証・全メンバー置き換えが実行される
8. 更新後のメンバー一覧を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| スペースが存在しない | SpaceNotFoundError |
| 操作者がスペース管理者でない | SpaceAdminRequiredError |
| 管理者が1名も含まれていない | NoAdminMemberError |
| 使用停止中・削除済みユーザーが含まれている | InvalidMemberError |

---

## 10. スペース退会

### 概要

ユーザーが自発的にスペースを退会する。固定メンバー（fixedMember）設定時は退会不可。最後の管理者は退会不可。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| spaceId | SpaceId | 必須 | 有効な SpaceId 形式であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| (なし) | void |

### 処理フロー

1. `SpaceRepository.findById(spaceId)` でスペースを取得する
2. スペースが存在しない場合は SpaceNotFoundError を返す
3. `SpaceMembershipService.leaveSpace({ spaceId, userId: operatorId })` を呼び出す
4. ドメインサービス内で fixedMember チェック・最後の管理者チェック・メンバー削除が実行される

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| スペースが存在しない | SpaceNotFoundError |
| 操作者がスペースメンバーでない | NotMemberError |
| 固定メンバー設定により退会禁止 | FixedMemberError |
| 最後の管理者は退会できない | LastAdminError |

---

## 11. ゲストメンバー更新

### 概要

ゲストスペースのゲストメンバーを更新する。スペース管理者のみ実行可能。ゲストユーザーの追加・削除を行う。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| spaceId | SpaceId | 必須 | 有効な SpaceId 形式であること。対象スペースがゲストスペースであること |
| members | Array<{ entity: MemberEntity; isAdmin: boolean; includeSubs: boolean }> | 必須 | 1件以上。管理者が1名以上含まれること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| members | Array<{ entity: MemberEntity; isAdmin: boolean; includeSubs: boolean }> |

### 処理フロー

1. `SpaceRepository.findById(spaceId)` でスペースを取得する
2. スペースが存在しない場合は SpaceNotFoundError を返す
3. スペースがゲストスペース（isGuest=true）でない場合は NotGuestSpaceError を返す
4. `SpaceMemberRepository.findBySpaceIdAndUserId(spaceId, operatorId)` で操作者のメンバー情報を取得する
5. 操作者がスペース管理者（isAdmin=true）でない場合は SpaceAdminRequiredError を返す
6. Identity ドメインのポートで、members 内の各ユーザーが有効であることを検証する
7. `SpaceMembershipService.replaceMembers({ spaceId, members })` を呼び出す
8. ドメインサービス内で管理者1名以上検証・全メンバー置き換えが実行される
9. 更新後のメンバー一覧を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| スペースが存在しない | SpaceNotFoundError |
| スペースがゲストスペースでない | NotGuestSpaceError |
| 操作者がスペース管理者でない | SpaceAdminRequiredError |
| 管理者が1名も含まれていない | NoAdminMemberError |
| 使用停止中・削除済みユーザーが含まれている | InvalidMemberError |

---

## 12. スレッド作成

### 概要

マルチスレッドスペースに新しいスレッドを作成する。通知オプション付き。スペースメンバーのみ実行可能。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| spaceId | SpaceId | 必須 | 有効な SpaceId 形式であること |
| title | string | 必須 | 1文字以上128文字以下 |
| body | string | 任意 | 最大65,535文字。リッチテキスト/HTML |
| notifyOnCreate | boolean | 任意 | デフォルト: false。true の場合、スペース参加メンバーに「自分宛」通知を送信 |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| threadId | ThreadId |
| spaceId | SpaceId |
| title | string |
| body | string | null |
| creatorId | UserId |
| createdAt | Date |

### 処理フロー

1. `SpaceRepository.findById(spaceId)` でスペースを取得する
2. スペースが存在しない場合は SpaceNotFoundError を返す
3. スペースのマルチスレッドが無効（useMultiThread=false）の場合は MultiThreadRequiredError を返す
4. `SpaceMemberRepository.findBySpaceIdAndUserId(spaceId, operatorId)` でメンバーシップを確認する
5. 操作者がメンバーでない場合は NotMemberError を返す
6. 新しい Thread エンティティを生成する（isDefault=false, notifyOnCreate=指定値）
7. `ThreadRepository.save(thread)` で永続化する
8. `ThreadFollowRepository.save({ threadId, userId: operatorId })` で作成者を自動フォローする
9. notifyOnCreate が true の場合、Notification ドメインのポートを通じてスペースメンバーへの通知生成を依頼する
10. 作成されたスレッド情報を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| スペースが存在しない | SpaceNotFoundError |
| マルチスレッドが無効 | MultiThreadRequiredError |
| 操作者がスペースメンバーでない | NotMemberError |
| タイトルが空文字 | EmptyThreadTitleError（ドメインモデルから発生） |
| タイトルが128文字超過 | ThreadTitleTooLongError（ドメインモデルから発生） |
| 本文が65,535文字超過 | ThreadBodyTooLongError（ドメインモデルから発生） |

---

## 13. スレッド更新

### 概要

スレッドのタイトル・本文を更新する。スペース管理者またはスレッド作成者のみ実行可能。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| threadId | ThreadId | 必須 | 有効な ThreadId 形式であること |
| title | string | 任意 | 指定時は1文字以上128文字以下 |
| body | string | null | 任意 | 指定時は最大65,535文字 |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| threadId | ThreadId |
| spaceId | SpaceId |
| title | string |
| body | string | null |
| updatedAt | Date |

### 処理フロー

1. `ThreadRepository.findById(threadId)` でスレッドを取得する
2. スレッドが存在しない場合は ThreadNotFoundError を返す
3. `SpaceMemberRepository.findBySpaceIdAndUserId(thread.spaceId, operatorId)` で操作者のメンバー情報を取得する
4. 操作者がスペース管理者（isAdmin=true）でもスレッド作成者（thread.creatorId === operatorId）でもない場合は ThreadUpdatePermissionDeniedError を返す
5. title が指定されている場合: `thread.rename(ThreadTitle(title))`
6. body が指定されている場合: `thread.updateBody(body)`
7. `ThreadRepository.save(thread)` で永続化する
8. 更新後のスレッド情報を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| スレッドが存在しない | ThreadNotFoundError |
| 操作者がスペース管理者でもスレッド作成者でもない | ThreadUpdatePermissionDeniedError |
| タイトルが空文字 | EmptyThreadTitleError（ドメインモデルから発生） |
| タイトルが128文字超過 | ThreadTitleTooLongError（ドメインモデルから発生） |
| 本文が65,535文字超過 | ThreadBodyTooLongError（ドメインモデルから発生） |

---

## 14. スレッド削除

### 概要

スレッドと関連コメント・フォロー・いいねを削除する。デフォルトスレッドは削除不可。スペース管理者のみ実行可能。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| threadId | ThreadId | 必須 | 有効な ThreadId 形式であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| (なし) | void |

### 処理フロー

1. `ThreadRepository.findById(threadId)` でスレッドを取得する
2. スレッドが存在しない場合は ThreadNotFoundError を返す
3. スレッドがデフォルトスレッド（isDefault=true）の場合は DefaultThreadDeletionError を返す
4. `SpaceMemberRepository.findBySpaceIdAndUserId(thread.spaceId, operatorId)` で操作者のメンバー情報を取得する
5. 操作者がスペース管理者（isAdmin=true）でない場合は SpaceAdminRequiredError を返す
6. `ThreadCommentRepository.deleteByThreadId(threadId)` で関連コメントを削除する
7. `ThreadFollowRepository.deleteByThreadId(threadId)` で関連フォローを削除する
8. `ThreadRepository.delete(threadId)` でスレッドを削除する

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| スレッドが存在しない | ThreadNotFoundError |
| デフォルトスレッドの削除 | DefaultThreadDeletionError |
| 操作者がスペース管理者でない | SpaceAdminRequiredError |

---

## 15. スレッドフォロー

### 概要

スレッドの更新通知を受け取るようフォローする。固定メンバー設定時はフォロー変更不可。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| threadId | ThreadId | 必須 | 有効な ThreadId 形式であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| (なし) | void |

### 処理フロー

1. `ThreadRepository.findById(threadId)` でスレッドを取得する
2. スレッドが存在しない場合は ThreadNotFoundError を返す
3. `SpaceMemberRepository.findBySpaceIdAndUserId(thread.spaceId, operatorId)` でメンバーシップを確認する
4. 操作者がメンバーでない場合は NotMemberError を返す
5. `ThreadFollowService.follow({ threadId, userId: operatorId })` を呼び出す
6. ドメインサービス内で fixedMember チェック・フォロー関係の保存が実行される

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| スレッドが存在しない | ThreadNotFoundError |
| 操作者がスペースメンバーでない | NotMemberError |
| 固定メンバー設定によりフォロー変更禁止 | FixedMemberError |
| すでにフォロー中 | AlreadyFollowingError |

---

## 16. スレッドフォロー解除

### 概要

スレッドのフォローを解除する。固定メンバー設定時はフォロー解除不可。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| threadId | ThreadId | 必須 | 有効な ThreadId 形式であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| (なし) | void |

### 処理フロー

1. `ThreadRepository.findById(threadId)` でスレッドを取得する
2. スレッドが存在しない場合は ThreadNotFoundError を返す
3. `SpaceMemberRepository.findBySpaceIdAndUserId(thread.spaceId, operatorId)` でメンバーシップを確認する
4. 操作者がメンバーでない場合は NotMemberError を返す
5. `ThreadFollowService.unfollow({ threadId, userId: operatorId })` を呼び出す
6. ドメインサービス内で fixedMember チェック・フォロー関係の削除が実行される

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| スレッドが存在しない | ThreadNotFoundError |
| 操作者がスペースメンバーでない | NotMemberError |
| 固定メンバー設定によりフォロー変更禁止 | FixedMemberError |
| フォローしていない | NotFollowingError |

---

## 17. コメント投稿

### 概要

スレッドにコメントを投稿する。@メンション・ファイル添付をサポート。スペースメンバーのみ実行可能。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| threadId | ThreadId | 必須 | 有効な ThreadId 形式であること |
| text | string | null | 任意 | 最大65,535文字。files と合わせていずれか必須 |
| mentions | Mention[] | 任意 | 最大10件。各要素は type（USER/ORGANIZATION/GROUP）と code を含む |
| files | CommentFile[] | 任意 | 最大5件。各要素は fileKey と width（任意、100-750px）を含む |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| commentId | ThreadCommentId |
| threadId | ThreadId |
| spaceId | SpaceId |
| text | string | null |
| mentions | Mention[] |
| files | CommentFile[] |
| creatorId | UserId |
| createdAt | Date |

### 処理フロー

1. `ThreadRepository.findById(threadId)` でスレッドを取得する
2. スレッドが存在しない場合は ThreadNotFoundError を返す
3. `SpaceMemberRepository.findBySpaceIdAndUserId(thread.spaceId, operatorId)` でメンバーシップを確認する
4. 操作者がメンバーでない場合は NotMemberError を返す
5. 新しい ThreadComment エンティティを生成する（creatorId=operatorId）
6. `comment.validate()` でコメントの有効性を検証する（text と files のいずれか必須）
7. `ThreadCommentRepository.save(comment)` で永続化する
8. mentions が指定されている場合、Notification ドメインのポートを通じてメンション通知の生成を依頼する
9. スレッドのフォロワーに対して、Notification ドメインのポートを通じてスペース通知の生成を依頼する
10. 作成されたコメント情報を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| スレッドが存在しない | ThreadNotFoundError |
| 操作者がスペースメンバーでない | NotMemberError |
| text と files が両方空 | EmptyCommentError（ドメインモデルから発生） |
| メンションが10件超過 | TooManyMentionsError（ドメインモデルから発生） |
| 添付ファイルが5件超過 | TooManyFilesError（ドメインモデルから発生） |
| コメント本文が65,535文字超過 | バリデーションエラー |

---

## 18. コメント削除

### 概要

コメントを削除する。投稿者本人またはスペース管理者のみ実行可能。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| commentId | ThreadCommentId | 必須 | 有効な ThreadCommentId 形式であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| (なし) | void |

### 処理フロー

1. `ThreadCommentRepository.findById(commentId)` でコメントを取得する
2. コメントが存在しない場合は CommentNotFoundError を返す
3. `SpaceMemberRepository.findBySpaceIdAndUserId(comment.spaceId, operatorId)` で操作者のメンバー情報を取得する
4. 操作者がコメント投稿者（comment.creatorId === operatorId）でもスペース管理者（isAdmin=true）でもない場合は CommentDeletePermissionDeniedError を返す
5. `CommentLikeRepository.deleteByCommentId(commentId)` で関連いいねを削除する
6. `ThreadCommentRepository.delete(commentId)` でコメントを削除する

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| コメントが存在しない | CommentNotFoundError |
| 操作者がコメント投稿者でもスペース管理者でもない | CommentDeletePermissionDeniedError |

---

## 19. コメントにいいね

### 概要

コメントに「いいね」を付与する。既にいいね済みの場合は取り消す（トグル動作）。スペースメンバーのみ実行可能。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| commentId | ThreadCommentId | 必須 | 有効な ThreadCommentId 形式であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| liked | boolean |

### 処理フロー

1. `ThreadCommentRepository.findById(commentId)` でコメントを取得する
2. コメントが存在しない場合は CommentNotFoundError を返す
3. `SpaceMemberRepository.findBySpaceIdAndUserId(comment.spaceId, operatorId)` でメンバーシップを確認する
4. 操作者がメンバーでない場合は NotMemberError を返す
5. `CommentLikeRepository.exists(commentId, operatorId)` で既存のいいねを確認する
6. いいね済みの場合: `CommentLikeRepository.delete(commentId, operatorId)` で取り消し、`liked=false` を返す
7. 未いいねの場合: 新しい CommentLike を生成し、`CommentLikeRepository.save(like)` で保存、`liked=true` を返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| コメントが存在しない | CommentNotFoundError |
| 操作者がスペースメンバーでない | NotMemberError |

---

## 20. 返信（@メンション自動挿入）

### 概要

元コメント投稿者への @メンション付きでコメントを投稿する。スペースメンバーのみ実行可能。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| threadId | ThreadId | 必須 | 有効な ThreadId 形式であること |
| replyToCommentId | ThreadCommentId | 必須 | 有効な ThreadCommentId 形式であること |
| text | string | null | 任意 | 最大65,535文字。files と合わせていずれか必須 |
| additionalMentions | Mention[] | 任意 | 追加メンション。自動挿入分と合わせて最大10件 |
| files | CommentFile[] | 任意 | 最大5件 |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| commentId | ThreadCommentId |
| threadId | ThreadId |
| spaceId | SpaceId |
| text | string | null |
| mentions | Mention[] |
| files | CommentFile[] |
| creatorId | UserId |
| createdAt | Date |

### 処理フロー

1. `ThreadRepository.findById(threadId)` でスレッドを取得する
2. スレッドが存在しない場合は ThreadNotFoundError を返す
3. `SpaceMemberRepository.findBySpaceIdAndUserId(thread.spaceId, operatorId)` でメンバーシップを確認する
4. 操作者がメンバーでない場合は NotMemberError を返す
5. `ThreadCommentRepository.findById(replyToCommentId)` で返信先コメントを取得する
6. 返信先コメントが存在しない場合は CommentNotFoundError を返す
7. `ThreadCommentService.resolveReplyMentions(originalComment, additionalMentions)` を呼び出し、メンション対象ユーザーを取得する（返信先投稿者の自動挿入・重複排除はドメインサービス内部で処理）
8. 新しい ThreadComment エンティティを生成する（creatorId=operatorId, mentions=解決済みメンション一覧）
9. `comment.validate()` でコメントの有効性を検証する
10. `ThreadCommentRepository.save(comment)` で永続化する
11. Notification ドメインのポートを通じてメンション通知の生成を依頼する
12. スレッドのフォロワーに対して、Notification ドメインのポートを通じてスペース通知の生成を依頼する
13. 作成されたコメント情報を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| スレッドが存在しない | ThreadNotFoundError |
| 操作者がスペースメンバーでない | NotMemberError |
| 返信先コメントが存在しない | CommentNotFoundError |
| text と files が両方空 | EmptyCommentError（ドメインモデルから発生） |
| メンションが10件超過 | TooManyMentionsError（ドメインモデルから発生） |
| 添付ファイルが5件超過 | TooManyFilesError（ドメインモデルから発生） |

---

## 21. 全員に返信

### 概要

スレッド参加者全員への @メンション付きでコメントを投稿する。スペースメンバーのみ実行可能。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| threadId | ThreadId | 必須 | 有効な ThreadId 形式であること |
| text | string | null | 任意 | 最大65,535文字。files と合わせていずれか必須 |
| additionalMentions | Mention[] | 任意 | 追加メンション |
| files | CommentFile[] | 任意 | 最大5件 |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| commentId | ThreadCommentId |
| threadId | ThreadId |
| spaceId | SpaceId |
| text | string | null |
| mentions | Mention[] |
| files | CommentFile[] |
| creatorId | UserId |
| createdAt | Date |

### 処理フロー

1. `ThreadRepository.findById(threadId)` でスレッドを取得する
2. スレッドが存在しない場合は ThreadNotFoundError を返す
3. `SpaceMemberRepository.findBySpaceIdAndUserId(thread.spaceId, operatorId)` でメンバーシップを確認する
4. 操作者がメンバーでない場合は NotMemberError を返す
5. `ThreadCommentService.resolveReplyAllMentions(threadId, operatorId, additionalMentions)` を呼び出し、メンション対象ユーザーを取得する（スレッド参加者の収集・操作者除外・重複排除・件数制限はドメインサービス内部で処理）
6. 新しい ThreadComment エンティティを生成する（creatorId=operatorId, mentions=解決済みメンション一覧）
7. `comment.validate()` でコメントの有効性を検証する
8. `ThreadCommentRepository.save(comment)` で永続化する
9. Notification ドメインのポートを通じてメンション通知の生成を依頼する
10. スレッドのフォロワーに対して、Notification ドメインのポートを通じてスペース通知の生成を依頼する
11. 作成されたコメント情報を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| スレッドが存在しない | ThreadNotFoundError |
| 操作者がスペースメンバーでない | NotMemberError |
| text と files が両方空 | EmptyCommentError（ドメインモデルから発生） |
| メンションが10件超過 | TooManyMentionsError（ドメインモデルから発生） |
| 添付ファイルが5件超過 | TooManyFilesError（ドメインモデルから発生） |

---

## 22. お知らせ更新

### 概要

スペースのお知らせ本文を更新する。マルチスレッドスペースのみ編集可能。スペース管理者のみ実行可能。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| spaceId | SpaceId | 必須 | 有効な SpaceId 形式であること |
| body | string | 必須 | 最大65,535文字。リッチテキスト/HTML |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| spaceId | SpaceId |
| body | string |
| updatedBy | UserId |
| updatedAt | Date |

### 処理フロー

1. `SpaceRepository.findById(spaceId)` でスペースを取得する
2. スペースが存在しない場合は SpaceNotFoundError を返す
3. スペースのマルチスレッドが無効（useMultiThread=false）の場合は MultiThreadRequiredError を返す
4. `SpaceMemberRepository.findBySpaceIdAndUserId(spaceId, operatorId)` で操作者のメンバー情報を取得する
5. 操作者がスペース管理者（isAdmin=true）でない場合は SpaceAdminRequiredError を返す
6. `SpaceAnnouncementRepository.findBySpaceId(spaceId)` でお知らせを取得する
7. お知らせが存在しない場合は新しい SpaceAnnouncement を生成する
8. `announcement.updateBody(body, operatorId)` でお知らせ本文を更新する
9. `SpaceAnnouncementRepository.save(announcement)` で永続化する
10. 更新後のお知らせ情報を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| スペースが存在しない | SpaceNotFoundError |
| マルチスレッドが無効 | MultiThreadRequiredError |
| 操作者がスペース管理者でない | SpaceAdminRequiredError |
| お知らせ本文が65,535文字超過 | バリデーションエラー |

---

## 23. 関連リンク追加

### 概要

スペースに関連リンクを追加する。スペース管理者のみ実行可能。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| spaceId | SpaceId | 必須 | 有効な SpaceId 形式であること |
| title | string | 必須 | 空文字でないこと |
| url | string | 必須 | 空文字でないこと。有効な URL 形式であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| linkId | RelatedLinkId |
| spaceId | SpaceId |
| title | string |
| url | string |

### 処理フロー

1. `SpaceRepository.findById(spaceId)` でスペースを取得する
2. スペースが存在しない場合は SpaceNotFoundError を返す
3. `SpaceMemberRepository.findBySpaceIdAndUserId(spaceId, operatorId)` で操作者のメンバー情報を取得する
4. 操作者がスペース管理者（isAdmin=true）でない場合は SpaceAdminRequiredError を返す
5. 新しい RelatedLink 値オブジェクトを生成する（title, url のバリデーション含む）
6. `RelatedLinkRepository.save(link)` で永続化する
7. 追加された関連リンク情報を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| スペースが存在しない | SpaceNotFoundError |
| 操作者がスペース管理者でない | SpaceAdminRequiredError |
| タイトルが空文字 | バリデーションエラー |
| URL が空文字または不正な形式 | バリデーションエラー |

---

## 24. 関連リンク削除

### 概要

スペースの関連リンクを削除する。スペース管理者のみ実行可能。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| linkId | RelatedLinkId | 必須 | 有効な RelatedLinkId 形式であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| (なし) | void |

### 処理フロー

1. `RelatedLinkRepository.findById(linkId)` で関連リンクを取得する
2. 関連リンクが存在しない場合は RelatedLinkNotFoundError を返す
3. `SpaceMemberRepository.findBySpaceIdAndUserId(link.spaceId, operatorId)` で操作者のメンバー情報を取得する
4. 操作者がスペース管理者（isAdmin=true）でない場合は SpaceAdminRequiredError を返す
5. `RelatedLinkRepository.delete(linkId)` で関連リンクを削除する

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 関連リンクが存在しない | RelatedLinkNotFoundError |
| 操作者がスペース管理者でない | SpaceAdminRequiredError |

---

## 25. 関連リンク一覧取得

### 概要

スペースの関連リンク一覧を取得する。スペースメンバーのみ取得可能（公開スペースは認証済みユーザーも可）。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| spaceId | SpaceId | 必須 | 有効な SpaceId 形式であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| links | Array<{ linkId: RelatedLinkId; title: string; url: string }> |

### 処理フロー

1. `SpaceRepository.findById(spaceId)` でスペースを取得する
2. スペースが存在しない場合は SpaceNotFoundError を返す
3. スペースが非公開（isPrivate=true）の場合、`SpaceMemberRepository.findBySpaceIdAndUserId(spaceId, operatorId)` でメンバーシップを確認する
4. 非公開スペースで操作者がメンバーでない場合は SpaceAccessDeniedError を返す
5. `RelatedLinkRepository.findBySpaceId(spaceId)` で関連リンク一覧を取得する
6. 関連リンク一覧を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| スペースが存在しない | SpaceNotFoundError |
| 非公開スペースで操作者がメンバーでない | SpaceAccessDeniedError |

---

## 26. テンプレート作成

### 概要

既存スペースの構成をテンプレートとして保存する。スペース管理者のみ実行可能。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| spaceId | SpaceId | 必須 | 有効な SpaceId 形式であること |
| name | string | 必須 | 空文字でないこと |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| templateId | SpaceTemplateId |
| name | string |
| sourceSpaceId | SpaceId |
| useMultiThread | boolean |
| fixedMember | boolean |
| appCreationPermission | AppCreationPermission |
| coverImage | CoverImage |
| portalDisplay | PortalDisplayConfig |
| threadNames | string[] |
| appIds | AppId[] |
| relatedLinks | RelatedLink[] |
| announcementBody | string | undefined |
| createdAt | Date |

### 処理フロー

1. `SpaceRepository.findById(spaceId)` でスペースを取得する
2. スペースが存在しない場合は SpaceNotFoundError を返す
3. `SpaceMemberRepository.findBySpaceIdAndUserId(spaceId, operatorId)` で操作者のメンバー情報を取得する
4. 操作者がスペース管理者（isAdmin=true）でない場合は SpaceAdminRequiredError を返す
5. `ThreadRepository.findBySpaceId(spaceId)` でスペース内の全スレッド名を取得する
6. `RelatedLinkRepository.findBySpaceId(spaceId)` で関連リンク一覧を取得する
7. `SpaceAnnouncementRepository.findBySpaceId(spaceId)` でお知らせを取得する
8. App ドメインのポートからスペースに所属するアプリ ID 一覧を取得する
9. 新しい SpaceTemplate エンティティを生成する（スペースの設定、スレッド名、アプリ ID、関連リンク、お知らせ本文を含む）
10. `SpaceTemplateRepository.save(template)` で永続化する
11. 作成されたテンプレート情報を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| スペースが存在しない | SpaceNotFoundError |
| 操作者がスペース管理者でない | SpaceAdminRequiredError |
| テンプレート名が空文字 | バリデーションエラー |

---

## 27. テンプレート一覧取得

### 概要

スペーステンプレートの一覧を取得する。スペース作成権限保持者のみ実行可能。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| offset | number | 任意 | 0以上の整数。デフォルト: 0 |
| limit | number | 任意 | 1以上の整数。デフォルト: 100 |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| templates | Array<{ templateId: SpaceTemplateId; name: string; sourceSpaceId: SpaceId; useMultiThread: boolean; createdAt: Date }> |
| totalCount | number |

### 処理フロー

1. Identity ドメインのポートから operatorId のユーザーコンテキストを取得する
2. AccessControl ドメインのポートで operatorId のシステム権限を評価し、`spaceCreate` 権限があることを検証する
3. 権限がない場合は SpacePermissionDeniedError を返す
4. `SpaceTemplateRepository.list(offset, limit)` でテンプレート一覧を取得する
5. テンプレート一覧と総数を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 操作者にスペース作成権限がない | SpacePermissionDeniedError |

---

## 28. テンプレート削除

### 概要

スペーステンプレートを削除する。システム管理者のみ実行可能。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| templateId | SpaceTemplateId | 必須 | 有効な SpaceTemplateId 形式であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| (なし) | void |

### 処理フロー

1. Identity ドメインのポートから operatorId のユーザーコンテキストを取得する
2. AccessControl ドメインのポートで操作者のシステム権限を評価し、`systemAdmin` 権限があること、または `userContext.isCybozuAdmin` が true であることを検証する
3. 権限がない場合は SystemPermissionDeniedError を返す
4. `SpaceTemplateRepository.findById(templateId)` でテンプレートを取得する
5. テンプレートが存在しない場合は SpaceTemplateNotFoundError を返す
6. `SpaceTemplateRepository.delete(templateId)` でテンプレートを削除する

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 操作者にシステム管理権限がない | SystemPermissionDeniedError |
| テンプレートが存在しない | SpaceTemplateNotFoundError |

---

## 29. ゲストユーザー追加

### 概要

ゲストユーザーを OpenDesk に追加する。招待メールは送信されない。システム管理者のみ実行可能。ゲストユーザーの実体は Identity ドメインで管理される。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| name | string | 必須 | 空文字でないこと |
| email | string | 必須 | 有効なメールアドレス形式であること |
| company | string | 任意 | 会社名 |
| spaceIds | SpaceId[] | 任意 | 追加先のゲストスペース ID。各スペースがゲストスペースであること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| userId | UserId |
| name | string |
| email | string |
| company | string | null |

### 処理フロー

1. Identity ドメインのポートから operatorId のユーザーコンテキストを取得する
2. AccessControl ドメインのポートで操作者のシステム権限を評価し、`systemAdmin` 権限があること、または `userContext.isCybozuAdmin` が true であることを検証する
3. 権限がない場合は SystemPermissionDeniedError を返す
4. Identity ドメインのポートを通じてゲストユーザーを作成する（name, email, company）
5. spaceIds が指定されている場合、各スペースに対して:
   - `SpaceRepository.findById(spaceId)` でスペースを取得し、ゲストスペースであることを検証する
   - `SpaceMemberRepository.save()` でゲストユーザーをメンバーとして追加する
6. 追加されたゲストユーザー情報を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 操作者にシステム管理権限がない | SystemPermissionDeniedError |
| メールアドレスが不正 | バリデーションエラー |
| 指定されたスペースがゲストスペースでない | NotGuestSpaceError |
| 指定されたスペースが存在しない | SpaceNotFoundError |

---

## 30. ゲストユーザー削除

### 概要

ゲストユーザーを OpenDesk から削除する。システム管理者のみ実行可能。ゲストユーザーの実体は Identity ドメインで管理される。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| targetUserId | UserId | 必須 | 有効な UserId 形式であること。ゲストユーザーであること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| (なし) | void |

### 処理フロー

1. Identity ドメインのポートから operatorId のユーザーコンテキストを取得する
2. AccessControl ドメインのポートで操作者のシステム権限を評価し、`systemAdmin` 権限があること、または `userContext.isCybozuAdmin` が true であることを検証する
3. 権限がない場合は SystemPermissionDeniedError を返す
4. Identity ドメインのポートで targetUserId がゲストユーザーであることを検証する
5. ゲストユーザーでない場合は NotGuestUserError を返す
6. `SpaceMemberRepository.findByUserId(targetUserId)` でゲストユーザーが参加している全スペースを取得する
7. 各スペースから `SpaceMemberRepository.delete(spaceId, entity)` でメンバーシップを削除する
8. Identity ドメインのポートを通じてゲストユーザーを削除する

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 操作者にシステム管理権限がない | SystemPermissionDeniedError |
| 対象ユーザーがゲストユーザーでない | NotGuestUserError |
| 対象ユーザーが存在しない | UserNotFoundError |

---

## 31. スレッドアクション一覧取得

### 概要

システムに登録されたスレッドアクションの一覧を取得する。システム管理者のみ実行可能。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| offset | number | 任意 | 0以上の整数。デフォルト0 |
| limit | number | 任意 | 1以上の整数。デフォルト100 |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| actions | Array<{ threadActionId: ThreadActionId; actionName: string; destinationAppId: AppId; fieldMappings: ThreadActionFieldMapping[]; modifierId: UserId; modifiedAt: Date; createdAt: Date }> |
| totalCount | number |

### 処理フロー

1. Identity ドメインのポートから operatorId のユーザーコンテキストを取得する
2. AccessControl ドメインのポートで操作者のシステム権限を評価し、`systemAdmin` 権限があること、または `userContext.isCybozuAdmin` が true であることを検証する
3. 権限がない場合は SystemPermissionDeniedError を返す
4. `ThreadActionRepository.list(offset, limit)` でスレッドアクション一覧を取得する
5. スレッドアクション一覧と総件数を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 操作者にシステム管理権限がない | SystemPermissionDeniedError |

---

## 32. スレッドアクション作成

### 概要

新しいスレッドアクションを作成する。コピー先アプリとフィールドマッピングを設定する。システム管理者のみ実行可能。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| actionName | string | 必須 | 1文字以上128文字以下 |
| destinationAppId | AppId | 必須 | 有効な AppId 形式であること |
| fieldMappings | ThreadActionFieldMapping[] | 必須 | 1件以上100件以下。各マッピングの destinationFieldCode が空文字でないこと |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| threadActionId | ThreadActionId |
| actionName | string |
| destinationAppId | AppId |
| fieldMappings | ThreadActionFieldMapping[] |
| modifierId | UserId |
| modifiedAt | Date |
| createdAt | Date |

### 処理フロー

1. Identity ドメインのポートから operatorId のユーザーコンテキストを取得する
2. AccessControl ドメインのポートで操作者のシステム権限を評価し、`systemAdmin` 権限があること、または `userContext.isCybozuAdmin` が true であることを検証する
3. 権限がない場合は SystemPermissionDeniedError を返す
4. actionName が1文字以上128文字以下であることを検証する。空文字の場合は EmptyThreadActionNameError、128文字超過の場合は ThreadActionNameTooLongError を返す
5. App ドメインのポートで destinationAppId のアプリが存在することを検証する。存在しない場合は InvalidDestinationAppError を返す
6. fieldMappings が1件以上100件以下であることを検証する。0件の場合は EmptyFieldMappingsError、100件超過の場合は TooManyFieldMappingsError を返す
7. 各フィールドマッピングの destinationFieldCode がコピー先アプリに存在するフィールドであることを検証する
8. 新しい ThreadAction エンティティを生成する（threadActionId は新規生成、modifierId は operatorId、modifiedAt と createdAt は現在日時）
9. `ThreadAction.setFieldMappings(fieldMappings)` でフィールドマッピングを設定する
10. `ThreadActionRepository.save(action)` で永続化する
11. 作成されたスレッドアクションを出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 操作者にシステム管理権限がない | SystemPermissionDeniedError |
| アクション名が空文字 | EmptyThreadActionNameError |
| アクション名が128文字超過 | ThreadActionNameTooLongError |
| コピー先アプリが存在しない | InvalidDestinationAppError |
| フィールドマッピングが0件 | EmptyFieldMappingsError |
| フィールドマッピングが100件超過 | TooManyFieldMappingsError |

---

## 33. スレッドアクション更新

### 概要

既存のスレッドアクションのアクション名・コピー先アプリ・フィールドマッピングを変更する。システム管理者のみ実行可能。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| threadActionId | ThreadActionId | 必須 | 有効な ThreadActionId 形式であること |
| actionName | string | 任意 | 指定時は1文字以上128文字以下 |
| destinationAppId | AppId | 任意 | 指定時は有効な AppId 形式であること |
| fieldMappings | ThreadActionFieldMapping[] | 任意 | 指定時は1件以上100件以下 |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| threadActionId | ThreadActionId |
| actionName | string |
| destinationAppId | AppId |
| fieldMappings | ThreadActionFieldMapping[] |
| modifierId | UserId |
| modifiedAt | Date |
| createdAt | Date |

### 処理フロー

1. Identity ドメインのポートから operatorId のユーザーコンテキストを取得する
2. AccessControl ドメインのポートで操作者のシステム権限を評価し、`systemAdmin` 権限があること、または `userContext.isCybozuAdmin` が true であることを検証する
3. 権限がない場合は SystemPermissionDeniedError を返す
4. `ThreadActionRepository.findById(threadActionId)` でスレッドアクションを取得する
5. スレッドアクションが存在しない場合は ThreadActionNotFoundError を返す
6. actionName が指定されている場合、`ThreadAction.rename(actionName)` を呼び出す（ドメインモデル内で1-128文字のバリデーションが実行される）
7. destinationAppId が指定されている場合:
   - App ドメインのポートでコピー先アプリが存在することを検証する。存在しない場合は InvalidDestinationAppError を返す
   - `ThreadAction.setDestinationApp(destinationAppId)` を呼び出す（フィールドマッピングがクリアされる）
8. fieldMappings が指定されている場合:
   - 1件以上100件以下であることを検証する
   - 各フィールドマッピングの destinationFieldCode がコピー先アプリに存在するフィールドであることを検証する
   - `ThreadAction.setFieldMappings(fieldMappings)` を呼び出す
9. `ThreadAction.updateModifier(operatorId)` で最終更新者と最終更新日時を更新する
10. `ThreadActionRepository.save(action)` で永続化する
11. 更新後のスレッドアクションを出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 操作者にシステム管理権限がない | SystemPermissionDeniedError |
| スレッドアクションが存在しない | ThreadActionNotFoundError |
| アクション名が空文字 | EmptyThreadActionNameError（ドメインモデルから発生） |
| アクション名が128文字超過 | ThreadActionNameTooLongError（ドメインモデルから発生） |
| コピー先アプリが存在しない | InvalidDestinationAppError |
| フィールドマッピングが0件 | EmptyFieldMappingsError（ドメインモデルから発生） |
| フィールドマッピングが100件超過 | TooManyFieldMappingsError（ドメインモデルから発生） |

---

## 34. スレッドアクション削除

### 概要

スレッドアクションを削除する。システム管理者のみ実行可能。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| threadActionId | ThreadActionId | 必須 | 有効な ThreadActionId 形式であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| (なし) | void |

### 処理フロー

1. Identity ドメインのポートから operatorId のユーザーコンテキストを取得する
2. AccessControl ドメインのポートで操作者のシステム権限を評価し、`systemAdmin` 権限があること、または `userContext.isCybozuAdmin` が true であることを検証する
3. 権限がない場合は SystemPermissionDeniedError を返す
4. `ThreadActionRepository.findById(threadActionId)` でスレッドアクションを取得する
5. スレッドアクションが存在しない場合は ThreadActionNotFoundError を返す
6. `ThreadActionRepository.delete(threadActionId)` でスレッドアクションを削除する

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 操作者にシステム管理権限がない | SystemPermissionDeniedError |
| スレッドアクションが存在しない | ThreadActionNotFoundError |

---

## 35. スペース復旧

### 概要

削除後14日以内のスペースをスペースIDを指定して復旧する。14日超過の場合はエラー。関連するスレッド・メンバー・お知らせ・関連リンク等も復旧される。システム管理者のみ実行可能。

### 入力DTO

| フィールド名 | 型 | 必須/任意 | バリデーションルール |
|-------------|-----|----------|-------------------|
| operatorId | UserId | 必須 | 有効な UserId 形式であること |
| spaceId | SpaceId | 必須 | 有効な SpaceId 形式であること |

### 出力DTO

| フィールド名 | 型 |
|-------------|-----|
| spaceId | SpaceId |
| name | string |
| isPrivate | boolean |
| useMultiThread | boolean |
| fixedMember | boolean |
| appCreationPermission | AppCreationPermission |
| coverImage | CoverImage |
| defaultThreadId | ThreadId |
| createdAt | Date |

### 処理フロー

1. Identity ドメインのポートから operatorId のユーザーコンテキストを取得する
2. AccessControl ドメインのポートで操作者のシステム権限を評価し、`systemAdmin` 権限があること、または `userContext.isCybozuAdmin` が true であることを検証する
3. 権限がない場合は SystemPermissionDeniedError を返す
4. `SpaceRepository.findById(spaceId)` で削除済みスペースを取得する（論理削除されたスペースも取得可能であること）
5. スペースが存在しない場合は SpaceNotFoundError を返す
6. スペースが削除済みでない場合は SpaceNotDeletedError を返す
7. スペースの削除日時から14日が経過しているかを検証する。14日を超過している場合は SpaceRestoreExpiredError を返す（deletedAt と expiredAt を含む）
8. スペースの削除フラグを解除し、復旧する
9. `SpaceRepository.save(space)` で永続化する
10. 復旧されたスペース情報を出力 DTO として返す

### エラーケース

| 条件 | エラー種別 |
|------|-----------|
| 操作者にシステム管理権限がない | SystemPermissionDeniedError |
| スペースが存在しない | SpaceNotFoundError |
| スペースが削除済みでない | SpaceNotDeletedError |
| 削除後14日を超過している | SpaceRestoreExpiredError |
