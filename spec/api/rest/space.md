# REST API: スペース・スレッド・ゲスト

## 1. スペース情報の取得

### メソッド・エンドポイント

```
GET /k/v1/space.json
```

- ゲストスペース: `GET /k/guest/{GUEST_SPACE_ID}/v1/space.json`

### 説明

指定したスペースの詳細情報を取得する。

### リクエストパラメータ

| パラメータ | 型 | 必須/任意 | 説明 |
|---|---|---|---|
| id | 数値または文字列 | 必須 | 取得対象のスペースID |

### レスポンス

| フィールド | 型 | 説明 |
|---|---|---|
| id | 文字列 | スペースID |
| name | 文字列 | スペース名 |
| defaultThread | 文字列 | デフォルトスレッドID |
| isPrivate | 真偽値 | 公開状態（true=非公開） |
| creator | オブジェクト | 作成者情報 |
| creator.code | 文字列 | 作成者のユーザーコード |
| creator.name | 文字列 | 作成者の表示名 |
| modifier | オブジェクト | 更新者情報 |
| modifier.code | 文字列 | 更新者のユーザーコード |
| modifier.name | 文字列 | 更新者の表示名 |
| memberCount | 文字列 | メンバー数 |
| coverType | 文字列 | カバー画像種別（BLOB / PRESET） |
| coverKey | 文字列 | カバー画像キー |
| coverUrl | 文字列 | カバー画像URL |
| body | 文字列 | スペース本文（HTML） |
| useMultiThread | 真偽値 | 複数スレッド対応フラグ |
| isGuest | 真偽値 | ゲストスペースかどうか |
| attachedApps | 配列 | スレッド内アプリリスト |
| permissions.createApp | 文字列 | アプリ作成権限（EVERYONE / ADMIN） |

### 制限事項

- スペース機能が無効の場合はエラー
- ゲストスペース機能が無効な場合にゲストスペース情報を取得するとエラー
- 非公開スペースの場合、メンバーのみ実行可能

### リクエスト例

```bash
curl -X GET 'https://sample.cybozu.com/k/v1/space.json?id=1' \
  -H 'X-Cybozu-Authorization: QWRtaW5pc3RyYXRvcjpjeWJvenU='
```

### レスポンス例

```json
{
  "id": "1",
  "name": "サンプルスペース",
  "defaultThread": "3",
  "isPrivate": false,
  "creator": {
    "code": "admin",
    "name": "管理者"
  },
  "modifier": {
    "code": "admin",
    "name": "管理者"
  },
  "memberCount": "5",
  "coverType": "PRESET",
  "coverKey": "BLUE",
  "coverUrl": "https://sample.cybozu.com/...",
  "body": "<b>サンプル</b>スペースです。",
  "useMultiThread": true,
  "isGuest": false,
  "attachedApps": [],
  "permissions": {
    "createApp": "EVERYONE"
  }
}
```

---

## 2. スペース設定の変更

### メソッド・エンドポイント

```
PUT /k/v1/space.json
```

- ゲストスペース: `PUT /k/guest/{GUEST_SPACE_ID}/v1/space.json`

### 説明

スペースの各種設定を変更する。省略したパラメータは変更されない。

### リクエストパラメータ

| パラメータ | 型 | 必須/任意 | 説明 |
|---|---|---|---|
| id | 数値または文字列 | 必須 | スペースID |
| name | 文字列 | 任意 | スペース名（省略時は変更なし） |
| isPrivate | 真偽値 | 任意 | 非公開設定（true=非公開、false=公開） |
| fixedMember | 真偽値 | 任意 | ユーザーの退会・アンフォローを禁止するか |
| useMultiThread | 真偽値 | 任意 | 複数スレッドを使用するか |
| showAnnouncement | 真偽値 | 任意 | ポータルにお知らせを表示するか |
| showThreadList | 真偽値 | 任意 | ポータルにスレッド一覧を表示するか |
| showAppList | 真偽値 | 任意 | ポータルにアプリ一覧を表示するか |
| showMemberList | 真偽値 | 任意 | ポータルにメンバー一覧を表示するか |
| showRelatedLinkList | 真偽値 | 任意 | ポータルに関連リンク一覧を表示するか |
| permissions.createApp | 文字列 | 任意 | アプリ作成権限（"EVERYONE" / "ADMIN"） |

### レスポンス

```json
{}
```

空のJSONオブジェクトが返される。

### 制限事項

- スペース管理者権限が必要
- スペース機能が無効の場合はエラー

### リクエスト例

```bash
curl -X PUT 'https://sample.cybozu.com/k/v1/space.json' \
  -H 'X-Cybozu-Authorization: QWRtaW5pc3RyYXRvcjpjeWJvenU=' \
  -H 'Content-Type: application/json' \
  -d '{
    "id": 1,
    "name": "新しいスペース名",
    "isPrivate": true,
    "useMultiThread": true,
    "showAnnouncement": true,
    "showThreadList": true,
    "showAppList": true,
    "showMemberList": true,
    "showRelatedLinkList": true,
    "permissions": {
      "createApp": "EVERYONE"
    }
  }'
```

### レスポンス例

```json
{}
```

---

## 3. テンプレートからスペース作成

### メソッド・エンドポイント

```
POST /k/v1/template/space.json
```

### 説明

スペーステンプレートから新しいスペースを作成する。

### リクエストパラメータ

| パラメータ | 型 | 必須/任意 | 説明 |
|---|---|---|---|
| id | 数値または文字列 | 必須 | スペーステンプレートID |
| name | 文字列 | 必須 | 作成するスペースの名前 |
| members | 配列 | 必須 | スペースのメンバー情報一覧。管理者1名以上が必須 |
| members[].entity | オブジェクト | 必須 | メンバー情報（ゲストユーザー不可） |
| members[].entity.type | 文字列 | 必須 | メンバーの種別（USER / GROUP / ORGANIZATION） |
| members[].entity.code | 文字列 | 必須 | メンバーのコード |
| members[].isAdmin | 真偽値 | 条件必須 | スペース管理者にするか（デフォルト: false） |
| members[].includeSubs | 真偽値 | 任意 | 下位組織を含めるか（ORGANIZATION型のみ有効） |
| isPrivate | 真偽値 | 任意 | 非公開スペースにするか（デフォルト: false） |
| isGuest | 真偽値 | 任意 | ゲストスペースとして作成するか（デフォルト: false） |
| fixedMember | 真偽値 | 任意 | 退会・アンフォローを禁止するか（デフォルト: false） |

### レスポンス

| フィールド | 型 | 説明 |
|---|---|---|
| id | 文字列 | 作成されたスペースのID |

### 制限事項

- スペース作成権限が必要
- ゲストスペース作成時はゲストスペース作成権限も必要
- スペース管理者を1名以上指定する必要がある
- 使用停止中・削除済みユーザーの指定は不可
- スペース機能が無効の場合はエラー
- ゲストスペース機能が無効な場合にisGuest=trueを指定するとエラー

### リクエスト例

```bash
curl -X POST 'https://sample.cybozu.com/k/v1/template/space.json' \
  -H 'X-Cybozu-Authorization: QWRtaW5pc3RyYXRvcjpjeWJvenU=' \
  -H 'Content-Type: application/json' \
  -d '{
    "id": 1,
    "name": "サンプルスペース",
    "members": [
      {
        "entity": {
          "type": "USER",
          "code": "user1"
        },
        "isAdmin": true
      },
      {
        "entity": {
          "type": "GROUP",
          "code": "group1"
        },
        "isAdmin": false
      }
    ],
    "isPrivate": false,
    "isGuest": false,
    "fixedMember": false
  }'
```

### レスポンス例

```json
{
  "id": "1"
}
```

---

## 4. スペース削除

### メソッド・エンドポイント

```
DELETE /k/v1/space.json
```

- ゲストスペース: `DELETE /k/guest/{GUEST_SPACE_ID}/v1/space.json`

### 説明

指定したスペースを削除する。

### リクエストパラメータ

| パラメータ | 型 | 必須/任意 | 説明 |
|---|---|---|---|
| id | 数値または文字列 | 必須 | 削除するスペースのスペースID |

### レスポンス

```json
{}
```

空のJSONオブジェクトが返される。

### 制限事項

- スペース管理者権限が必要
- スペース機能が無効の場合はエラー

### リクエスト例

```bash
curl -X DELETE 'https://sample.cybozu.com/k/v1/space.json' \
  -H 'X-Cybozu-Authorization: QWRtaW5pc3RyYXRvcjpjeWJvenU=' \
  -H 'Content-Type: application/json' \
  -d '{"id": 1}'
```

### レスポンス例

```json
{}
```

---

## 5. スペース本文の更新

### メソッド・エンドポイント

```
PUT /k/v1/space/body.json
```

- ゲストスペース: `PUT /k/guest/{GUEST_SPACE_ID}/v1/space/body.json`

### 説明

スペースの本文（ポータルのお知らせ欄）を更新する。マルチスレッドスペースの本文のみ更新可能。

### リクエストパラメータ

| パラメータ | 型 | 必須/任意 | 説明 |
|---|---|---|---|
| id | 数値または文字列 | 必須 | 本文を更新するスペースのスペースID |
| body | 文字列 | 必須 | スペースの本文。HTML文字列で記述。許可されていないタグ・属性は保存時に削除される |

### レスポンス

```json
{}
```

空のJSONオブジェクトが返される。

### 制限事項

- スペース管理者権限が必要
- マルチスレッドスペースの本文のみ更新可能（シングルスレッドスペースは別APIを使用）
- スペース機能が無効の場合はエラー

### リクエスト例

```bash
curl -X PUT 'https://sample.cybozu.com/k/v1/space/body.json' \
  -H 'X-Cybozu-Authorization: QWRtaW5pc3RyYXRvcjpjeWJvenU=' \
  -H 'Content-Type: application/json' \
  -d '{
    "id": 1,
    "body": "<b>総務課</b>専用のスペースです。"
  }'
```

### レスポンス例

```json
{}
```

---

## 6. スペースメンバーの取得

### メソッド・エンドポイント

```
GET /k/v1/space/members.json
```

- ゲストスペース: `GET /k/guest/{GUEST_SPACE_ID}/v1/space/members.json`

### 説明

スペースに参加しているメンバーの一覧を取得する。

### リクエストパラメータ

| パラメータ | 型 | 必須/任意 | 説明 |
|---|---|---|---|
| id | 数値または文字列 | 必須 | メンバー情報を取得するスペースのID |

### レスポンス

| フィールド | 型 | 説明 |
|---|---|---|
| members | 配列 | メンバー情報の配列 |
| members[].entity | オブジェクト | メンバーのエンティティ情報 |
| members[].entity.type | 文字列 | メンバーの種別（USER / GROUP / ORGANIZATION） |
| members[].entity.code | 文字列 | メンバーのコード |
| members[].isAdmin | 真偽値 | スペース管理者かどうか |
| members[].isImplicit | 真偽値 | ユーザーが直接追加されたかどうか（USERのみ） |
| members[].includeSubs | 真偽値 | 下位組織を含むか（GROUP/ORGANIZATIONのみ） |

### 制限事項

- スペース閲覧権限が必要
- 非公開スペースはスペース参加者のみ実行可能
- ゲストユーザー、OpenDesk未使用ユーザー、使用停止中ユーザー、削除済みユーザーはレスポンスに含まれない
- スペース機能が無効の場合はエラー
- ゲストスペース機能が無効な場合、該当スペース情報取得時にエラー

### リクエスト例

```bash
curl -X GET 'https://sample.cybozu.com/k/v1/space/members.json?id=1' \
  -H 'X-Cybozu-Authorization: QWRtaW5pc3RyYXRvcjpjeWJvenU=' \
  -H 'Content-Type: application/json'
```

### レスポンス例

```json
{
  "members": [
    {
      "entity": {
        "type": "USER",
        "code": "user1"
      },
      "isAdmin": true,
      "isImplicit": true
    },
    {
      "entity": {
        "type": "GROUP",
        "code": "group1"
      },
      "isAdmin": false,
      "includeSubs": false
    },
    {
      "entity": {
        "type": "ORGANIZATION",
        "code": "org1"
      },
      "isAdmin": false,
      "includeSubs": true
    }
  ]
}
```

---

## 7. スペースメンバーの更新

### メソッド・エンドポイント

```
PUT /k/v1/space/members.json
```

- ゲストスペース: `PUT /k/guest/{GUEST_SPACE_ID}/v1/space/members.json`

### 説明

スペースのメンバー構成を更新する。指定したメンバーでスペースのメンバーが置き換わる。

### リクエストパラメータ

| パラメータ | 型 | 必須/任意 | 説明 |
|---|---|---|---|
| id | 数値または文字列 | 必須 | スペースID |
| members | 配列 | 必須 | メンバー情報の配列 |
| members[].entity | オブジェクト | 必須 | メンバー情報（ゲストユーザー不可） |
| members[].entity.type | 文字列 | 必須 | メンバーの種別（USER / GROUP / ORGANIZATION） |
| members[].entity.code | 文字列 | 必須 | メンバーのコード |
| members[].isAdmin | 真偽値 | 条件必須 | スペース管理者にするか（デフォルト: false） |
| members[].includeSubs | 真偽値 | 任意 | 下位組織を含めるか（ORGANIZATION型のみ有効） |

### レスポンス

```json
{}
```

空のJSONオブジェクトが返される。

### 制限事項

- スペース管理者権限が必要
- 管理者を最低1名以上指定する必要がある
- 使用停止中・削除済みユーザーを指定するとエラー
- スペース機能が無効の場合はエラー
- ゲストスペース機能が無効な場合、ゲストスペースの更新は不可

### リクエスト例

```bash
curl -X PUT 'https://sample.cybozu.com/k/v1/space/members.json' \
  -H 'X-Cybozu-Authorization: QWRtaW5pc3RyYXRvcjpjeWJvenU=' \
  -H 'Content-Type: application/json' \
  -d '{
    "id": 1,
    "members": [
      {
        "entity": {
          "type": "USER",
          "code": "user1"
        },
        "isAdmin": true
      },
      {
        "entity": {
          "type": "GROUP",
          "code": "group1"
        },
        "isAdmin": false
      }
    ]
  }'
```

### レスポンス例

```json
{}
```

---

## 8. スペース使用状況の取得

### メソッド・エンドポイント

```
GET /k/v1/spaces/statistics.json
```

### 説明

スペースの使用状況（メンバー数、管理者数、作成情報など）を一覧で取得する。

### リクエストパラメータ

| パラメータ | 型 | 必須/任意 | 説明 |
|---|---|---|---|
| offset | 数値または文字列 | 任意 | 取得をスキップする件数（デフォルト: 0） |
| limit | 数値または文字列 | 任意 | 取得件数の上限。1~100（デフォルト: 100） |

### レスポンス

| フィールド | 型 | 説明 |
|---|---|---|
| spaces | 配列 | スペース情報一覧 |
| spaces[].id | 文字列 | スペースID |
| spaces[].name | 文字列 | スペース名 |
| spaces[].administratorCount | 文字列 | 管理者数 |
| spaces[].memberCount | 文字列 | メンバー数 |
| spaces[].isPrivate | 真偽値 | 非公開スペースかどうか |
| spaces[].isGuest | 真偽値 | ゲストスペースかどうか |
| spaces[].creator | オブジェクト | 作成者情報 |
| spaces[].creator.code | 文字列 | 作成者のユーザーコード |
| spaces[].creator.name | 文字列 | 作成者の表示名 |
| spaces[].modifier | オブジェクト | 更新者情報 |
| spaces[].modifier.code | 文字列 | 更新者のユーザーコード |
| spaces[].modifier.name | 文字列 | 更新者の表示名 |
| spaces[].createdAt | 文字列 | 作成日時（ISO 8601形式） |
| spaces[].modifiedAt | 文字列 | 更新日時（ISO 8601形式） |

### 制限事項

- 一度に取得できるスペース数は最大100件
- ゲストユーザーは実行不可
- パスワード認証またはセッション認証が必要

### リクエスト例

```bash
curl -X GET 'https://sample.cybozu.com/k/v1/spaces/statistics.json?offset=0&limit=10' \
  -H 'X-Cybozu-Authorization: QWRtaW5pc3RyYXRvcjpjeWJvenU='
```

### レスポンス例

```json
{
  "spaces": [
    {
      "id": "1",
      "name": "第1営業部",
      "administratorCount": "2",
      "memberCount": "10",
      "isPrivate": true,
      "isGuest": false,
      "creator": {
        "code": "admin",
        "name": "管理者"
      },
      "modifier": {
        "code": "admin",
        "name": "管理者"
      },
      "createdAt": "2023-12-04T05:45:36.000Z",
      "modifiedAt": "2023-12-10T08:30:00.000Z"
    }
  ]
}
```

---

## 9. スレッド作成

### メソッド・エンドポイント

```
POST /k/v1/space/thread.json
```

- ゲストスペース: `POST /k/guest/{GUEST_SPACE_ID}/v1/space/thread.json`

### 説明

スペースに新しいスレッドを作成する。マルチスレッドが有効なスペースでのみ使用可能。

### リクエストパラメータ

| パラメータ | 型 | 必須/任意 | 説明 |
|---|---|---|---|
| space | 数値または文字列 | 必須 | スペースID |
| name | 文字列 | 必須 | スレッド名（1~128文字） |

### レスポンス

| フィールド | 型 | 説明 |
|---|---|---|
| id | 文字列 | 作成されたスレッドのID |

### 制限事項

- スペースの設定で「スペースのポータルと複数のスレッドを使用する」が有効なスペースでのみ実行可能
- スレッド作成通知がスペース参加メンバーに配信される
- スペース機能が無効の場合はエラー
- ゲストスペース機能が無効の場合、ゲストスペースのスレッド作成でエラー

### リクエスト例

```bash
curl -X POST 'https://sample.cybozu.com/k/v1/space/thread.json' \
  -H 'X-Cybozu-Authorization: QWRtaW5pc3RyYXRvcjpjeWJvenU=' \
  -H 'Content-Type: application/json' \
  -d '{
    "space": 1,
    "name": "サンプルスレッド"
  }'
```

### レスポンス例

```json
{
  "id": "2"
}
```

---

## 10. スレッド更新

### メソッド・エンドポイント

```
PUT /k/v1/space/thread.json
```

- ゲストスペース: `PUT /k/guest/{GUEST_SPACE_ID}/v1/space/thread.json`

### 説明

スレッドの名前や本文を更新する。

### リクエストパラメータ

| パラメータ | 型 | 必須/任意 | 説明 |
|---|---|---|---|
| id | 数値または文字列 | 必須 | スレッドID |
| name | 文字列 | 任意 | スレッド名（1~128文字） |
| body | 文字列 | 任意 | スレッド本文（65,535文字以下のHTML） |

### レスポンス

```json
{}
```

空のJSONオブジェクトが返される。

### 制限事項

- スペース管理者またはスレッド作成者のみ実行可能
- スペース機能が無効の場合はエラー
- ゲストスペース機能が無効の場合、ゲストスペースの更新時にエラー

### リクエスト例

```bash
curl -X PUT 'https://sample.cybozu.com/k/v1/space/thread.json' \
  -H 'X-Cybozu-Authorization: QWRtaW5pc3RyYXRvcjpjeWJvenU=' \
  -H 'Content-Type: application/json' \
  -d '{
    "id": "1",
    "name": "総務課連絡スレッド",
    "body": "<b>総務課</b>の連絡用スレッドです。"
  }'
```

### レスポンス例

```json
{}
```

---

## 11. スレッドコメント投稿

### メソッド・エンドポイント

```
POST /k/v1/space/thread/comment.json
```

- ゲストスペース: `POST /k/guest/{GUEST_SPACE_ID}/v1/space/thread/comment.json`

### 説明

スレッドにコメントを投稿する。テキストまたはファイルの少なくとも一方が必要。

### リクエストパラメータ

| パラメータ | 型 | 必須/任意 | 説明 |
|---|---|---|---|
| space | 数値または文字列 | 必須 | スペースID |
| thread | 数値または文字列 | 必須 | スレッドID |
| comment | オブジェクト | 必須 | コメント情報 |
| comment.text | 文字列 | 条件必須 | コメント本文（最大65,535文字、改行はLF）。filesと合わせていずれか必須 |
| comment.mentions | 配列 | 任意 | 宛先情報（最大10件） |
| comment.mentions[].code | 文字列 | 必須 | ユーザー/組織/グループのコード |
| comment.mentions[].type | 文字列 | 必須 | 宛先種別（USER / GROUP / ORGANIZATION） |
| comment.files | 配列 | 条件必須 | 添付ファイル情報（最大5件）。textと合わせていずれか必須 |
| comment.files[].fileKey | 文字列 | 必須 | ファイルアップロードAPIで取得したファイルキー |
| comment.files[].width | 数値 | 任意 | 画像の表示幅（100~750px） |

### レスポンス

| フィールド | 型 | 説明 |
|---|---|---|
| id | 数値 | 投稿したコメントのID |

### 制限事項

- スペース参加者のみ実行可能
- 宛先の名前はAPIユーザーの言語設定に基づく
- 使用停止中・削除済みユーザー/組織/グループには通知されない
- ゲストスペースでは退会ユーザーが削除ユーザーと同じ扱い
- 招待中のゲストユーザーを宛先に指定するとエラー

### リクエスト例

```bash
curl -X POST 'https://sample.cybozu.com/k/v1/space/thread/comment.json' \
  -H 'X-Cybozu-Authorization: QWRtaW5pc3RyYXRvcjpjeWJvenU=' \
  -H 'Content-Type: application/json' \
  -d '{
    "space": 250,
    "thread": 1026,
    "comment": {
      "text": "本日のオススメ弁当です。\n弁当注文アプリの登録をお待ちしております。",
      "mentions": [
        {
          "code": "takahashi",
          "type": "USER"
        },
        {
          "code": "guest/yamada@test.jp",
          "type": "USER"
        }
      ],
      "files": [
        {
          "fileKey": "c15b3870-7505-4ab6-9d8d-b9bdbc74f5d6",
          "width": 500
        }
      ]
    }
  }'
```

### レスポンス例

```json
{
  "id": 410
}
```

---

## 12. ゲストユーザーの追加

### メソッド・エンドポイント

```
POST /k/v1/guests.json
```

### 説明

ゲストユーザーをOpenDeskに追加する。追加後、ゲストスペースに参加させるには別途ゲストメンバー更新APIを使用する。

### リクエストパラメータ

| パラメータ | 型 | 必須/任意 | 説明 |
|---|---|---|---|
| guests | 配列 | 必須 | ゲストユーザー情報の配列 |
| guests[].code | 文字列 | 必須 | メールアドレス |
| guests[].password | 文字列 | 必須 | パスワード |
| guests[].timezone | 文字列 | 必須 | タイムゾーン（例: "Asia/Tokyo"） |
| guests[].locale | 文字列 | 任意 | 言語設定（auto / ja / en / zh、デフォルト: auto） |
| guests[].image | 文字列 | 任意 | プロフィール画像のファイルキー（省略時は初期画像） |
| guests[].name | 文字列 | 必須 | 表示名（1~128文字） |
| guests[].surNameReading | 文字列 | 任意 | よみがな（姓、64文字以下） |
| guests[].givenNameReading | 文字列 | 任意 | よみがな（名、64文字以下） |
| guests[].company | 文字列 | 任意 | 会社名（100文字以下） |
| guests[].division | 文字列 | 任意 | 部署名（100文字以下） |
| guests[].phone | 文字列 | 任意 | 電話番号（100文字以下） |
| guests[].callto | 文字列 | 任意 | Skype名（256文字以下） |

### レスポンス

```json
{}
```

空のJSONオブジェクトが返される。

### 制限事項

- OpenDeskシステム管理者権限が必要
- 招待メールは送信されない
- ゲストスペース機能の有効/無効に関わらず実行可能
- 追加されたユーザーは自動的にメール通知が有効になる

### リクエスト例

```bash
curl -X POST 'https://sample.cybozu.com/k/v1/guests.json' \
  -H 'X-Cybozu-Authorization: QWRtaW5pc3RyYXRvcjpjeWJvenU=' \
  -H 'Content-Type: application/json' \
  -d '{
    "guests": [
      {
        "code": "hoge@example.com",
        "password": "p@ssword",
        "timezone": "Asia/Tokyo",
        "locale": "ja",
        "name": "東京 三郎",
        "company": "サンプル株式会社",
        "division": "営業部"
      }
    ]
  }'
```

### レスポンス例

```json
{}
```

---

## 13. ゲストユーザーの削除

### メソッド・エンドポイント

```
DELETE /k/v1/guests.json
```

### 説明

ゲストユーザーをOpenDeskから削除する。ゲストスペースからの退会は、ゲストメンバー更新APIで行う。

### リクエストパラメータ

| パラメータ | 型 | 必須/任意 | 説明 |
|---|---|---|---|
| guests | 配列（文字列） | 必須 | 削除するゲストユーザーのメールアドレスの一覧（最大100件） |

### レスポンス

```json
{}
```

空のJSONオブジェクトが返される。

### 制限事項

- OpenDeskシステム管理者権限が必要
- スペース機能やゲストスペース機能が無効の場合でも実行可能
- ゲストスペースからの退会は、ゲストスペースのゲストメンバーを更新するAPIで行う

### リクエスト例

```bash
curl -X DELETE 'https://sample.cybozu.com/k/v1/guests.json' \
  -H 'X-Cybozu-Authorization: QWRtaW5pc3RyYXRvcjpjeWJvenU=' \
  -H 'Content-Type: application/json' \
  -d '{
    "guests": [
      "guest1@example.com",
      "guest2@example.com",
      "guest3@example.com"
    ]
  }'
```

### レスポンス例

```json
{}
```

---

## 14. ゲストスペースのゲストメンバー更新

### メソッド・エンドポイント

```
PUT /k/guest/{GUEST_SPACE_ID}/v1/space/guests.json
```

### 説明

ゲストスペースに所属するゲストメンバーを更新する。指定したゲストユーザーでゲストメンバーが置き換わる。

### リクエストパラメータ

| パラメータ | 型 | 必須/任意 | 説明 |
|---|---|---|---|
| id | 数値または文字列 | 必須 | ゲストメンバーを更新するゲストスペースのスペースID |
| guests | 配列（文字列） | 必須 | 所属するゲストメンバーのログイン名（メールアドレス）の配列 |

### レスポンス

```json
{}
```

空のJSONオブジェクトが返される。

### 制限事項

- スペース管理者権限が必要
- スペース機能が利用可能で、ゲストスペース機能が有効である必要がある
- このAPIを実行する前に、ゲストユーザーを追加するAPI（POST /k/v1/guests.json）でゲストユーザーを追加しておく必要がある
- ゲストユーザー以外、使用停止中、または削除済みユーザーを指定するとエラー

### リクエスト例

```bash
curl -X PUT 'https://sample.cybozu.com/k/guest/3/v1/space/guests.json' \
  -H 'X-Cybozu-Authorization: QWRtaW5pc3RyYXRvcjpjeWJvenU=' \
  -H 'Content-Type: application/json' \
  -d '{
    "id": 1,
    "guests": [
      "guest1@example.com",
      "guest2@example.com"
    ]
  }'
```

### レスポンス例

```json
{}
```
